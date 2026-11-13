import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError, clearToken, getToken, setToken, type CustomerSession } from '../lib/api';

const SESSION_CACHE = 'tps1_customer_session_snapshot';
const IS_DEMO_BYPASS = import.meta.env.VITE_BYPASS_AUTH !== 'false';

const DEMO_CUSTOMER_SESSION: CustomerSession = {
  id: 'demo-bep-truong-001',
  code: 'KH-BEP01',
  name: 'Nguyễn Văn An (Bếp Trưởng)',
  phone: '089 890 2222',
  company: 'Bếp Ăn Mẫu TPS1',
  tier: 'VIP',
  discountPercent: 5,
  verificationStatus: 'verified',
  mustChangePassword: false,
  orderSessionToken: 'demo-session-token',
  defaultShippingAddress: {
    alias: 'Bếp chính',
    address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    name: 'Nguyễn Văn An',
    phone: '089 890 2222',
  },
};

interface AuthContextType {
  session: CustomerSession | null;
  loading: boolean;
  login: (code: string, password: string) => Promise<CustomerSession>;
  logout: () => void;
  refresh: () => Promise<void>;
  setSession: (s: CustomerSession) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => {
    throw new Error('not implemented');
  },
  logout: () => {},
  refresh: async () => {},
  setSession: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Xác thực RIÊNG cho app này — chỉ khách hàng, không có khái niệm nhân viên
// hay phiên admin nào cả (khác hẳn AuthContext của sale-webapp vốn gộp cả 2
// loại). Token lưu localStorage, gửi kèm Authorization: Bearer trên mọi
// request — không có cookie nào được dùng ở đây.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<CustomerSession | null>(() => {
    if (IS_DEMO_BYPASS) return DEMO_CUSTOMER_SESSION;
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (IS_DEMO_BYPASS) return false;
    return true;
  });

  const refresh = async () => {
    const token = getToken();
    if (!token) {
      if (IS_DEMO_BYPASS) {
        setSessionState(DEMO_CUSTOMER_SESSION);
      } else {
        setSessionState(null);
      }
      setLoading(false);
      return;
    }
    try {
      const res = await api.session();
      setSessionState(res.session);
      localStorage.setItem(SESSION_CACHE, JSON.stringify(res.session));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        if (IS_DEMO_BYPASS) {
          setSessionState(DEMO_CUSTOMER_SESSION);
        } else {
          clearToken();
          localStorage.removeItem(SESSION_CACHE);
          setSessionState(null);
        }
      } else {
        try {
          setSessionState(JSON.parse(localStorage.getItem(SESSION_CACHE) || 'null') || (IS_DEMO_BYPASS ? DEMO_CUSTOMER_SESSION : null));
        } catch {
          setSessionState(IS_DEMO_BYPASS ? DEMO_CUSTOMER_SESSION : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (code: string, password: string) => {
    const res = await api.login(code, password);
    if (res.session.orderSessionToken) setToken(res.session.orderSessionToken);
    setSessionState(res.session);
    localStorage.setItem(SESSION_CACHE, JSON.stringify(res.session));
    return res.session;
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(SESSION_CACHE);
    setSessionState(null);
  };

  const setSession = (s: CustomerSession) => {
    if (s.orderSessionToken) setToken(s.orderSessionToken);
    setSessionState(s);
    localStorage.setItem(SESSION_CACHE, JSON.stringify(s));
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, refresh, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};
