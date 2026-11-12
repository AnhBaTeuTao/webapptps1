import { useEffect, useRef, useState } from 'react';
import { api, ApiError, getToken, type StoreHome } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Dữ liệu trang chủ cửa hàng (banner, danh mục, bộ sưu tập). Header, trang
// danh mục và trang chủ cùng dùng nên giữ một bản trong bộ nhớ 2 phút, tách
// theo khách (giá khách lạ khác giá khách đăng nhập).
const TTL_MS = 2 * 60 * 1000;
let cache: { owner: string; expiresAt: number; data: StoreHome } | null = null;
let inflight: { owner: string; promise: Promise<StoreHome> } | null = null;

function load(owner: string) {
  if (cache && cache.owner === owner && cache.expiresAt > Date.now()) return Promise.resolve(cache.data);
  if (inflight && inflight.owner === owner) return inflight.promise;
  const promise = api.storeHome().then((data) => {
    cache = { owner, expiresAt: Date.now() + TTL_MS, data };
    return data;
  }).finally(() => { inflight = null; });
  inflight = { owner, promise };
  return promise;
}

export function useStoreHome() {
  const { session, logout } = useAuth();
  const owner = session?.id || (getToken() ? 'token' : 'guest');
  const [data, setData] = useState<StoreHome | null>(() => (cache && cache.owner === owner ? cache.data : null));
  const [error, setError] = useState('');
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    let alive = true;
    load(owner)
      .then((result) => { if (alive) { setData(result); setError(''); } })
      .catch((err) => {
        if (!alive) return;
        // Token hết hạn: đăng xuất để xem tiếp bằng giá tham khảo.
        if (err instanceof ApiError && err.status === 401) { logoutRef.current(); return; }
        setError(err instanceof Error ? err.message : 'Không tải được cửa hàng');
      });
    return () => { alive = false; };
  }, [owner]);

  return { data, error, loading: !data && !error };
}
