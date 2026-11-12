import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { api, ApiError, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLanguage } from '../contexts/LanguageContext';
import StoreProductCard from '../components/store/StoreProductCard';

/** Danh sách hàng yêu thích; giá lấy mới mỗi lần mở (theo hợp đồng nếu đã đăng nhập). */
export default function FavoritesPage() {
  const { ids } = useFavorites();
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const idsKey = ids.join(',');

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    setError('');
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 24) chunks.push(ids.slice(i, i + 24));
    Promise.all(chunks.map((chunk) => api.productsByIds(chunk)))
      .then((responses) => {
        if (!alive) return;
        const byId = new Map(responses.flatMap((res) => res.products || []).map((p) => [p.id, p]));
        // Giữ thứ tự khách đánh dấu (mới nhất trước); bỏ hàng đã ngừng bán.
        setProducts(ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p)));
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) { logout(); return; }
        setError(t('Không tải được danh sách yêu thích, vui lòng thử lại'));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, session?.id]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#17231d]"><Heart size={22} className="text-[#e0742f]" fill="currentColor" /> {t('Hàng yêu thích')}</h1>
        {ids.length > 0 && <p className="text-sm text-[#59665f]">{ids.length} {t('mặt hàng')}</p>}
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: Math.min(ids.length || 4, 10) }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-2 ring-1 ring-[#17231d]/6">
              <div className="aspect-square animate-pulse rounded-xl bg-[#eef2ee]" />
              <div className="mt-2 h-4 animate-pulse rounded bg-[#eef2ee]" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mx-auto max-w-md space-y-3 rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-[#17231d]/8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#fef5ee] text-[#e0742f]"><Heart size={30} /></div>
          <p className="font-bold text-[#17231d]">{t('Chưa có mặt hàng yêu thích')}</p>
          <p className="text-sm text-[#59665f]">{t('Bấm vào hình trái tim trên mỗi mặt hàng để lưu lại, lần sau đặt chỉ cần mở trang này.')}</p>
          <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f7a4f] px-6 text-sm font-bold text-white hover:bg-[#0b4f34]"><ShoppingBag size={16} /> {t('Xem cửa hàng')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => <StoreProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}
