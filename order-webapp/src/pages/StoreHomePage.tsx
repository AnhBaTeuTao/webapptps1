import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent, ClipboardList, FileSpreadsheet, Flame, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { api, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import BannerCarousel from '../components/store/BannerCarousel';
import CategoryRail from '../components/store/CategoryRail';
import ProductRail from '../components/store/ProductRail';
import StoreProductGrid from '../components/store/StoreProductGrid';

/** Danh mục không phải thực phẩm: không đưa vào lưới đề xuất. */
const NON_FOOD_SLUGS = new Set(['dung-cu-bep']);

function RailSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#17231d]/6 sm:p-4">
      <div className="mb-3 h-5 w-40 animate-pulse rounded-lg bg-[#eef2ee]" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-[42%] shrink-0 sm:w-[23%] md:w-[18.5%] lg:w-[15.5%] xl:w-[13.4%]">
            <div className="aspect-square animate-pulse rounded-xl bg-[#eef2ee]" />
            <div className="mt-2 h-4 animate-pulse rounded bg-[#eef2ee]" />
            <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-[#eef2ee]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoreHomePage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { data, error, loading } = useStoreHome();
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [extra, setExtra] = useState<Product[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  // Lần lượt lấy thêm từng trang của mỗi nhóm thực phẩm, để lưới đề xuất đa dạng.
  const cursor = useRef({ index: 0, pages: new Map<string, number>(), done: new Set<string>() });

  useEffect(() => {
    const controller = new AbortController();
    setExtra([]);
    setExhausted(false);
    cursor.current = { index: 0, pages: new Map(), done: new Set() };
    api.storeRecommendations(controller.signal)
      .then((res) => setRecommended(res.products || []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [session?.id]);

  // Hàng đã có ở các khối phía trên (khuyến mãi, bán chạy) không lặp lại trong lưới đề xuất.
  const suggestions = useMemo(() => {
    const seen = new Set((data?.collections || []).flatMap((c) => c.products.map((p) => p.id)));
    const out: Product[] = [];
    for (const product of [...recommended, ...extra]) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      out.push(product);
    }
    return out;
  }, [data, recommended, extra]);

  const foodGroups = useMemo(
    () => (data?.categories || []).filter((c) => !NON_FOOD_SLUGS.has(c.slug) && c.productCategories?.length),
    [data],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || foodGroups.length === 0) return;
    setLoadingMore(true);
    try {
      const state = cursor.current;
      const batch: Product[] = [];
      // Mỗi lần bấm lấy trang kế tiếp của vài nhóm liền nhau, chỉ giữ hàng có ảnh.
      for (let tries = 0; tries < foodGroups.length && batch.length < 24; tries += 1) {
        const group = foodGroups[state.index % foodGroups.length];
        state.index += 1;
        if (state.done.has(group.slug)) continue;
        const page = state.pages.get(group.slug) || 0;
        const res = await api.products({ categories: group.productCategories, page });
        const items = res.products || [];
        state.pages.set(group.slug, page + 1);
        if (items.length < 24) state.done.add(group.slug);
        batch.push(...items.filter((p) => p.thumbUrl || p.imageUrl));
      }
      if (state.done.size >= foodGroups.length) setExhausted(true);
      setExtra((current) => [...current, ...batch]);
    } catch {
      // Lỗi mạng: khách bấm lại là được.
    } finally {
      setLoadingMore(false);
    }
  }, [foodGroups, loadingMore]);

  // Tự động tải thêm ở nền nếu số lượng gợi ý chưa đủ 21 món (để chia đều 7 cột x 3 hàng = 21 món)
  useEffect(() => {
    if (suggestions.length > 0 && suggestions.length < 21 && !exhausted && !loadingMore && foodGroups.length > 0) {
      loadMore();
    }
  }, [suggestions.length, exhausted, loadingMore, foodGroups.length, loadMore]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Điện thoại: danh mục lên đầu để khách thấy gian hàng ngay; máy tính: banner trước. */}
      <div className="flex flex-col gap-3">
        <div className="order-2 grid gap-3 lg:order-1 lg:grid-cols-[minmax(0,1fr)_300px]">
          <BannerCarousel banners={data?.banners || []} />
          <aside className="hidden flex-col gap-3 lg:flex">
            {session ? (
              <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-4 ring-1 ring-[#17231d]/6">
                <div>
                  <span className="inline-block rounded-md bg-[#eaf6ef] px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#0f7a4f]">
                    {t('BẾP ĐỐI TÁC TPS1')}
                  </span>
                  <p className="mt-2 line-clamp-2 text-base font-black text-[#17231d]">{session.company || session.name}</p>
                  <p className="mt-1 text-xs text-[#59665f]">{t('Giá hiển thị đã áp dụng theo hợp đồng của bếp.')}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  <Link
                    to="/dat-hang"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f7a4f] px-4 py-2.5 text-[13.5px] font-bold text-white whitespace-nowrap shadow-sm shadow-[#0f7a4f]/20 transition hover:bg-[#0b4f34]"
                  >
                    <RotateCcw size={16} className="shrink-0" />
                    <span>{t('Đặt nhanh & Đặt lại đơn')}</span>
                  </Link>
                  <Link
                    to="/gio-hang?excel=1"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0f7a4f]/30 bg-[#eaf6ef]/50 px-4 py-2.5 text-[13.5px] font-bold text-[#0b4f34] whitespace-nowrap transition hover:bg-[#eaf6ef]"
                  >
                    <FileSpreadsheet size={16} className="shrink-0" />
                    <span>{t('Đặt hàng từ file Excel')}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between rounded-2xl bg-linear-to-br from-[#fef5ee] to-white p-4 ring-1 ring-[#e0742f]/15">
                <div>
                  <p className="text-base font-black leading-snug text-[#17231d]">{t('Giá riêng cho bếp của quý khách')}</p>
                  <p className="mt-1.5 text-[13px] text-[#59665f]">{t('Đăng ký tài khoản miễn phí để xem đúng giá hợp đồng, gửi đơn bằng file Excel và biết đơn đang giao tới đâu.')}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  <Link to="/dang-ky" className="flex min-h-11 items-center justify-center rounded-xl bg-[#e0742f] px-4 text-sm font-bold text-white whitespace-nowrap shadow-sm shadow-[#e0742f]/20 transition hover:bg-[#c4601f]">{t('Đăng ký tài khoản')}</Link>
                  <Link to="/dang-nhap" className="flex min-h-11 items-center justify-center rounded-xl border border-[#17231d]/12 bg-white px-4 text-sm font-bold text-[#17231d] whitespace-nowrap transition hover:bg-[#f5f7f3]">{t('Đăng nhập')}</Link>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Lối tắt trên điện thoại/tablet (máy tính đã có khung bên cạnh banner và thanh menu). */}
        {session ? (
          <div className="order-3 grid grid-cols-3 gap-2 lg:hidden">
            {[
              { to: '/dat-hang', icon: RotateCcw, label: 'Đặt nhanh' },
              { to: '/gio-hang?excel=1', icon: FileSpreadsheet, label: 'Đặt từ Excel' },
              { to: '/don-hang', icon: ClipboardList, label: 'Đơn hàng' },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-center text-[12px] sm:text-[13px] font-bold text-[#0b4f34] ring-1 ring-[#17231d]/6 whitespace-nowrap active:scale-[0.98]"
              >
                <Icon size={16} className="shrink-0 text-[#0f7a4f]" />
                <span>{t(label)}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {data && data.categories.length > 0 && (
          <section id="store-home-catalog" className="order-1 rounded-2xl bg-white px-3 py-3 ring-1 ring-[#17231d]/6 sm:p-4 lg:order-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-black text-[#17231d] sm:text-lg">{t('Danh mục hàng hóa')}</h2>
            </div>
            <CategoryRail categories={data.categories} />
          </section>
        )}
        {!data && loading && (
          <div className="order-1 flex gap-3 overflow-hidden rounded-2xl bg-white px-3 py-3 ring-1 ring-[#17231d]/6 lg:hidden" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex w-19.5 shrink-0 flex-col items-center gap-2">
                <div className="size-18 animate-pulse rounded-2xl bg-[#eef2ee]" />
                <div className="h-3 w-14 animate-pulse rounded bg-[#eef2ee]" />
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <RailSkeleton />}
      {error && !data && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t('Chưa tải được cửa hàng. Quý khách vui lòng kiểm tra kết nối mạng và thử lại.')}</p>
      )}

      {data?.collections.map((collection) => (
        <ProductRail
          key={collection.slug}
          title={collection.title}
          subtitle={collection.subtitle}
          products={collection.products}
          icon={collection.source === 'best_sellers'
            ? <Flame size={18} className="text-[#e0742f]" />
            : collection.slug === 'khuyen-mai'
              ? <BadgePercent size={18} className="text-[#d6453d]" />
              : collection.source === 'new_arrivals'
                ? <Sparkles size={18} className="text-[#0f7a4f]" />
                : undefined}
        />
      ))}

      {suggestions.length > 0 && (
        <section className="rounded-2xl bg-white p-3 ring-1 ring-[#17231d]/6 sm:p-4">
          <div className="mb-2.5">
            <h2 className="flex items-center gap-1.5 text-base font-black text-[#17231d] sm:text-lg">
              <Sparkles size={18} className="text-[#0f7a4f]" />
              {t(session ? 'Đề xuất cho bếp của quý khách' : 'Đề xuất cho quý khách')}
            </h2>
            <p className="hidden text-xs text-[#59665f] sm:block">
              {t(session ? 'Những món bếp của quý khách thường đặt và các mặt hàng cùng nhóm' : 'Những mặt hàng được nhiều bếp ăn lựa chọn')}
            </p>
          </div>
          <StoreProductGrid products={suggestions} hasMore={!exhausted && foodGroups.length > 0} />
          {!exhausted && foodGroups.length > 0 && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#0f7a4f]/30 bg-white px-6 text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef] disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin" />}
                {t('Xem thêm sản phẩm')}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
