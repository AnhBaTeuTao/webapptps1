import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

// Hàng yêu thích, lưu theo khách (hoặc 'guest') ở đúng key trang Đặt nhanh cũ
// đã dùng, nên danh sách khách đã đánh dấu trước đây vẫn còn nguyên.
// Khách lạ đánh dấu rồi đăng nhập: gộp vào danh sách của tài khoản.
const keyFor = (owner: string) => `tps1_favorite_products_v2_${owner}`;

function read(owner: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(owner)) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

interface FavoritesContextType {
  ids: string[];
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return <>{children}</>;
  const owner = session?.id || 'guest';
  return <FavoritesStore key={owner} owner={owner}>{children}</FavoritesStore>;
};

const FavoritesStore: React.FC<{ children: React.ReactNode; owner: string }> = ({ children, owner }) => {
  const [ids, setIds] = useState<string[]>(() => {
    const own = read(owner);
    if (owner === 'guest') return own;
    const guest = read('guest');
    if (guest.length === 0) return own;
    localStorage.removeItem(keyFor('guest'));
    return Array.from(new Set([...own, ...guest]));
  });

  useEffect(() => {
    try { localStorage.setItem(keyFor(owner), JSON.stringify(ids)); } catch { /* bộ nhớ đầy */ }
  }, [ids, owner]);

  const toggle = useCallback((productId: string) => {
    setIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [productId, ...current]));
  }, []);

  const value = useMemo(() => {
    const set = new Set(ids);
    return { ids, isFavorite: (productId: string) => set.has(productId), toggle };
  }, [ids, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites phải dùng bên trong FavoritesProvider');
  return ctx;
};
