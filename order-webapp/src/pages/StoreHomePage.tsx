import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgePercent,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Flame,
  LayoutGrid,
  Loader2,
  Package,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api, type StoreCategory, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import BannerCarousel from '../components/store/BannerCarousel';
import CategoryRail from '../components/store/CategoryRail';
import ProductRail from '../components/store/ProductRail';
import StoreProductGrid from '../components/store/StoreProductGrid';

function CategoryThumbnail({ category }: { category: StoreCategory }) {
  const [error, setError] = useState(false);
  return (
    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf6ef] ring-1 ring-[#0f7a4f]/10">
      {category.imageUrl && !error ? (
        <img
          src={category.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package size={16} className="text-[#0f7a4f]/60" />
      )}
    </span>
  );
}

function CategorySidebar({ categories }: { categories: StoreCategory[] }) {
  const { t } = useLanguage();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const hoveredCategory = categories.find((c) => c.slug === hoveredSlug) || null;
  const subCategories = hoveredCategory?.productCategories || [];
  const showFlyout = Boolean(hoveredCategory && subCategories.length > 1);

  return (
    <nav
      aria-label={t('Danh mục hàng hóa')}
      onMouseLeave={() => setHoveredSlug(null)}
      className="relative hidden min-h-85 rounded-2xl bg-white ring-1 ring-[#17231d]/6 lg:block"
    >
      <div className="no-scrollbar absolute inset-0 flex flex-col overflow-y-auto p-1.5">
        {categories.map((c) => {
          const isHovered = hoveredSlug === c.slug;
          const hasSub = Boolean(c.productCategories && c.productCategories.length > 1);
          return (
            <Link
              key={c.slug}
              to={`/danh-muc/${c.slug}`}
              onMouseEnter={() => setHoveredSlug(hasSub ? c.slug : null)}
              className={`group flex items-center gap-2.5 rounded-xl px-2 py-1 text-[13.5px] transition ${
                isHovered
                  ? 'bg-[#eaf6ef] font-bold text-[#0f7a4f]'
                  : 'font-semibold text-[#17231d] hover:bg-[#eaf6ef] hover:text-[#0b4f34]'
              }`}
            >
              <CategoryThumbnail category={c} />
              <span className="min-w-0 flex-1 truncate">{t(c.name)}</span>
              {hasSub && (
                <ChevronRight
                  size={16}
                  className={`shrink-0 transition ${
                    isHovered
                      ? 'translate-x-0.5 text-[#0f7a4f]'
                      : 'text-[#8a9690] group-hover:translate-x-0.5 group-hover:text-[#0f7a4f]'
                  }`}
                />
              )}
            </Link>
          );
        })}
        <Link
          to="/danh-muc"
          onMouseEnter={() => setHoveredSlug(null)}
          className="mt-auto flex items-center gap-2.5 rounded-xl px-2 py-1 text-[13px] font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0f7a4f]/10">
            <LayoutGrid size={15} />
          </span>
          {t('Xem tất cả danh mục')}
        </Link>
      </div>

      {/* Bảng Flyout mục nhỏ thực tế từ API bên phải khi lia chuột vào danh mục */}
      {showFlyout && hoveredCategory && (
        <div className="absolute top-0 left-full bottom-0 z-30 hidden pl-2 lg:flex">
          <div className="flex h-full w-68 xl:w-76 flex-col justify-between overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_20px_50px_rgba(12,48,31,0.16)] ring-1 ring-[#17231d]/8">
            <div className="space-y-1">
              {subCategories.map((subName) => (
                <Link
                  key={subName}
                  to={`/danh-muc/${hoveredCategory.slug}?nhom=${encodeURIComponent(subName)}`}
                  onClick={() => setHoveredSlug(null)}
                  className="group/sub flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#17231d] transition hover:bg-[#eaf6ef] hover:text-[#0f7a4f]"
                >
                  <span className="truncate">{t(subName)}</span>
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-[#8a9690] opacity-0 transition group-hover/sub:translate-x-0.5 group-hover/sub:text-[#0f7a4f] group-hover/sub:opacity-100"
                  />
                </Link>
              ))}
            </div>
            <Link
              to={`/danh-muc/${hoveredCategory.slug}`}
              onClick={() => setHoveredSlug(null)}
              className="mt-3 inline-flex items-center justify-end gap-1 border-t border-[#17231d]/8 pt-3 px-2 text-xs font-bold text-[#0f7a4f] hover:text-[#0b4f34] hover:underline"
            >
              <span>
                {t('Xem tất cả')} {t(hoveredCategory.name)}
              </span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

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
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className="order-2 grid gap-3 lg:order-1 lg:grid-cols-[250px_minmax(0,1fr)]">
          {data && data.categories.length > 0 ? (
            <CategorySidebar categories={data.categories} />
          ) : (
            <div className="hidden animate-pulse rounded-2xl bg-white ring-1 ring-[#17231d]/6 lg:block" aria-hidden="true" />
          )}
          <BannerCarousel banners={data?.banners || []} />
        </div>

        {session ? (
          <div className="order-3 flex flex-col gap-3 rounded-2xl bg-linear-to-br from-[#eaf6ef] via-[#f2faf5] to-[#e3f2ea] p-3.5 ring-[1.5px] ring-[#0f7a4f]/25 shadow-[0_8px_24px_rgba(11,79,52,0.08)] sm:p-4 lg:order-2 lg:flex-row lg:items-center lg:justify-between lg:px-4 lg:py-3">
            {/* Hàng định danh Bếp Đối Tác */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="shrink-0 rounded-lg bg-[#0b4f34] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white antialiased">
                {t('BẾP ĐỐI TÁC TPS1')}
              </span>
              <span className="truncate text-[14px] sm:text-[15px] font-bold text-[#0b4f34] antialiased">
                {session.company || session.name}
              </span>
              <span className="hidden truncate text-xs font-medium text-[#3d5247] xl:inline">
                {'· '}
                {t('Giá hiển thị đã áp dụng theo hợp đồng của bếp.')}
              </span>
            </div>

            {/* 3 Nút Chức Năng Quan Trọng: To, rõ ràng, nổi bật trên cả Mobile & Desktop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:flex lg:shrink-0 lg:gap-2.5">
              {[
                { to: '/dat-hang', icon: RotateCcw, label: 'Đặt nhanh', desktop: 'Đặt nhanh & Đặt lại đơn' },
                { to: '/gio-hang?excel=1', icon: FileSpreadsheet, label: 'Đặt từ Excel', desktop: 'Đặt hàng từ file Excel' },
                { to: '/don-hang', icon: ClipboardList, label: 'Đơn hàng', desktop: 'Đơn hàng' },
              ].map(({ to, icon: Icon, label, desktop }, idx) => (
                <Link
                  key={to}
                  to={to}
                  className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 min-h-[62px] text-center transition-all active:scale-[0.98] sm:flex-row sm:min-h-11 sm:gap-2 sm:px-3.5 lg:px-4 ${
                    idx === 0
                      ? 'bg-[#0f7a4f] text-white shadow-sm shadow-[#0f7a4f]/20 hover:bg-[#0b5c3b]'
                      : 'bg-white text-[#11261c] shadow-xs ring-[1.5px] ring-[#0f7a4f]/20 hover:bg-[#f8fcf9] hover:ring-[#0f7a4f]/40'
                  }`}
                >
                  <span
                    className={`flex size-7.5 sm:size-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                      idx === 0
                        ? 'bg-white/20 text-white'
                        : idx === 1
                        ? 'bg-[#eaf6ef] text-[#0f7a4f]'
                        : 'bg-[#fef5ee] text-[#e0742f]'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                  </span>
                  <span className="text-[12.5px] sm:text-[13px] font-semibold tracking-normal leading-snug whitespace-nowrap antialiased lg:hidden">
                    {t(label)}
                  </span>
                  <span className="hidden text-[13.5px] font-semibold tracking-normal whitespace-nowrap antialiased lg:inline">
                    {t(desktop)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="order-3 hidden items-center gap-3 rounded-2xl bg-linear-to-r from-[#fef5ee] to-white p-2 pl-4 ring-1 ring-[#e0742f]/15 lg:order-2 lg:flex">
            <p className="min-w-0 flex-1 truncate text-sm text-[#59665f]">
              <span className="font-black text-[#17231d]">{t('Giá riêng cho bếp của quý khách')}</span>
              {' · '}
              {t('Đăng ký tài khoản miễn phí để xem đúng giá hợp đồng, gửi đơn bằng file Excel và biết đơn đang giao tới đâu.')}
            </p>
            <Link
              to="/dang-ky"
              className="flex min-h-10 shrink-0 items-center rounded-xl bg-[#e0742f] px-4 text-sm font-bold text-white hover:bg-[#c4601f]"
            >
              {t('Đăng ký tài khoản')}
            </Link>
            <Link
              to="/dang-nhap"
              className="flex min-h-10 shrink-0 items-center rounded-xl border border-[#17231d]/12 bg-white px-4 text-sm font-bold text-[#17231d] hover:bg-[#f5f7f3]"
            >
              {t('Đăng nhập')}
            </Link>
          </div>
        )}

        {data && data.categories.length > 0 && (
          <section id="store-home-catalog" className="order-1 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-[#17231d]/6 sm:p-3.5 lg:hidden">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-bold tracking-normal text-[#17231d] antialiased sm:text-[15px]">
                {t('Danh mục hàng hóa')}
              </h2>
              <Link
                to="/danh-muc"
                className="inline-flex items-center gap-0.5 text-xs font-bold text-[#0f7a4f] hover:text-[#0b4f34] hover:underline"
              >
                <span>{t('Xem tất cả')}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
            <CategoryRail categories={data.categories} />
          </section>
        )}
        {!data && loading && (
          <div className="order-1 flex gap-1.5 overflow-hidden rounded-2xl bg-white px-3 py-2.5 ring-1 ring-[#17231d]/6 sm:p-3.5 lg:hidden" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex w-[calc((100%-24px)/5)] min-w-[54px] shrink-0 flex-col items-center gap-1.5">
                <div className="size-11.5 animate-pulse rounded-xl bg-[#eef2ee]" />
                <div className="h-3 w-12 animate-pulse rounded bg-[#eef2ee]" />
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
