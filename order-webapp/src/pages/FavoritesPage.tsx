import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { api, ApiError, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLanguage } from '../contexts/LanguageContext';
import StoreProductGrid, { StoreGridSkeleton } from '../components/store/StoreProductGrid';

// Cache sản phẩm yêu thích ở cấp module (sống xuyên suốt qua các lần đổi trang)
// Lưu cả null cho các ID không tồn tại trên server để không bao giờ hỏi lại
const favoriteProductCache = new Map<string, Product | null>();
let cachedOwnerKey = '';

/** Danh sách hàng yêu thích; giá lấy mới mỗi lần mở (theo hợp đồng nếu đã đăng nhập). */
export default function FavoritesPage() {
  const { ids } = useFavorites();
  const { session, logout } = useAuth();
  const { t } = useLanguage();

  const ownerKey = session?.id || 'guest';
  if (cachedOwnerKey !== ownerKey) {
    favoriteProductCache.clear();
    cachedOwnerKey = ownerKey;
  }

  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(
    () => ids.some((id) => !favoriteProductCache.has(id))
  );
  const [error, setError] = useState('');

  // Tính danh sách sản phẩm hiển thị ĐỒNG BỘ ngay trong lúc render
  // Khi người dùng bấm bỏ yêu thích 1 món, món đó biến mất tức thì (0ms) trên cùng frame
  const visibleProducts = useMemo(
    () =>
      ids
        .map((id) => favoriteProductCache.get(id))
        .filter((p): p is Product => Boolean(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(','), tick]
  );

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    const missingIds = ids.filter((id) => !favoriteProductCache.has(id));

    // Toàn bộ ID đã có trong cache (bao gồm khi khách vừa bỏ yêu thích 1 món):
    // Tuyệt đối không gọi API, không bật loading
    if (missingIds.length === 0) {
      setLoading(false);
      return;
    }

    let alive = true;
    // Chỉ bật loading skeleton nếu trong cache chưa có bất kỳ sản phẩm nào thuộc ids hiện tại
    if (!ids.some((id) => Boolean(favoriteProductCache.get(id)))) {
      setLoading(true);
    }
    setError('');

    const chunks: string[][] = [];
    for (let i = 0; i < missingIds.length; i += 24) chunks.push(missingIds.slice(i, i + 24));

    Promise.all(chunks.map((chunk) => api.productsByIds(chunk)))
      .then((responses) => {
        if (!alive) return;
        // Đánh dấu null trước cho tất cả missingIds để id không tồn tại không bị query lại
        for (const id of missingIds) {
          if (!favoriteProductCache.has(id)) {
            favoriteProductCache.set(id, null);
          }
        }
        for (const res of responses) {
          for (const p of res.products || []) {
            favoriteProductCache.set(p.id, p);
          }
        }
        setTick((t) => t + 1);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) { logout(); return; }
        setError(t('Không tải được danh sách yêu thích, vui lòng thử lại'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), ownerKey]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#17231d]">
          <Heart size={22} className="fill-rose-500 text-rose-500" /> {t('Hàng yêu thích')}
        </h1>
        {ids.length > 0 && <p className="text-sm text-[#59665f]">{ids.length} {t('mặt hàng')}</p>}
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <StoreGridSkeleton count={Math.min(ids.length || 6, 14)} />
      ) : visibleProducts.length === 0 ? (
        <div className="mx-auto max-w-md space-y-3 rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-[#17231d]/8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#fef5ee] text-[#e0742f]"><Heart size={30} /></div>
          <p className="font-bold text-[#17231d]">{t('Chưa có mặt hàng yêu thích')}</p>
          <p className="text-sm text-[#59665f]">{t('Bấm vào hình trái tim trên mỗi mặt hàng để lưu lại, lần sau đặt chỉ cần mở trang này.')}</p>
          <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f7a4f] px-6 text-sm font-bold text-white hover:bg-[#0b4f34]"><ShoppingBag size={16} /> {t('Xem cửa hàng')}</Link>
        </div>
      ) : (
        <StoreProductGrid products={visibleProducts} />
      )}
    </div>
  );
}
