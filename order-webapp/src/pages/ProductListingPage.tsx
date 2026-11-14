import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { api, ApiError, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { searchProducts } from '../lib/productSearch';
import StoreProductGrid, { StoreGridSkeleton, useGridColumns } from '../components/store/StoreProductGrid';
import CategoryRail from '../components/store/CategoryRail';

type Sort = 'default' | 'price_asc' | 'price_desc' | 'name';

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'default', label: 'Phổ biến' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'name', label: 'Tên A–Z' },
];

function SortDropdown({
  value,
  onChange,
  align = 'left',
}: {
  value: Sort;
  onChange: (next: Sort) => void;
  align?: 'left' | 'right';
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? 'Phổ biến';

  return (
    <div ref={rootRef} className="relative flex items-center gap-2 shrink-0">
      <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-[#17231d]">
        {t('Sắp xếp theo')}:
      </span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 rounded-full border bg-white px-3.5 text-xs sm:text-sm font-bold text-[#17231d] transition-all cursor-pointer shadow-2xs ${
          open
            ? 'border-[#0f7a4f] ring-2 ring-[#0f7a4f]/15'
            : 'border-[#17231d]/15 hover:border-[#0f7a4f]/50 hover:bg-[#f8faf7]'
        }`}
      >
        <ArrowUpDown size={14} className="text-[#0f7a4f] shrink-0" />
        <span className="whitespace-nowrap">{t(currentLabel)}</span>
        <ChevronDown
          size={15}
          className={`text-[#59665f] transition-transform duration-200 ${open ? 'rotate-180 text-[#0f7a4f]' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-[calc(100%+6px)] z-30 min-w-50 overflow-hidden rounded-2xl border border-[#17231d]/10 bg-white p-1.5 shadow-xl`}
        >
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#eaf6ef] font-bold text-[#0b4f34]'
                    : 'font-medium text-[#17231d] hover:bg-[#f4f8f5]'
                }`}
              >
                <span className="whitespace-nowrap">{t(opt.label)}</span>
                {active && <Check size={14} className="text-[#0f7a4f] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function sortProducts(products: Product[], sort: Sort) {
  if (sort === 'default') return products;
  const copy = [...products];
  const price = (p: Product) => (p.priceOnRequest || !(p.price > 0) ? Number.POSITIVE_INFINITY : p.price);
  if (sort === 'price_asc') copy.sort((a, b) => price(a) - price(b));
  if (sort === 'price_desc') copy.sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  return copy;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

const ProductGridSkeleton = () => <StoreGridSkeleton />;

/**
 * /danh-muc            → tất cả danh mục (lưới ảnh)
 * /danh-muc/:slug      → sản phẩm của danh mục (phân trang chuẩn số cột)
 * /tim-kiem?q=…        → kết quả tìm kiếm (phân trang chuẩn số cột)
 */
export default function ProductListingPage({ mode }: { mode: 'categories' | 'category' | 'search' }) {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const sub = params.get('nhom') || '';
  const currentPage = Math.max(1, Number(params.get('trang')) || 1);

  const { t } = useLanguage();
  const { logout } = useAuth();
  const { data: home } = useStoreHome();
  const category = home?.categories.find((c) => c.slug === slug) || null;
  const subRailRef = useHorizontalScroll<HTMLDivElement>();
  const searchRailRef = useHorizontalScroll<HTMLDivElement>();

  const columns = useGridColumns();
  // Số sản phẩm/trang luôn chia hết cho số cột (đủ 4 hàng kín mít, ví dụ 7 cột x 4 hàng = 28 món)
  const displayPageSize = columns * 4;

  const [products, setProducts] = useState<Product[]>([]);
  const [allMatchedProducts, setAllMatchedProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(mode !== 'categories');
  const [error, setError] = useState('');
  const [sort, setSort] = useState<Sort>('default');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('');

  useEffect(() => {
    setSelectedSearchCategory('');
  }, [query]);

  // Đếm số lượng sản phẩm khớp theo từng category (chỉ giữ lại category có count > 0)
  const searchCategoryCounts = useMemo(() => {
    if (mode !== 'search') return [];
    const map = new Map<string, number>();
    for (const p of allMatchedProducts) {
      const cat = (p.category || '').trim();
      if (cat) {
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count || a.cat.localeCompare(b.cat, 'vi'));
  }, [mode, allMatchedProducts]);

  const filteredSearchProducts = useMemo(() => {
    if (mode !== 'search') return [];
    if (!selectedSearchCategory) return allMatchedProducts;
    return allMatchedProducts.filter((p) => (p.category || '').trim() === selectedSearchCategory);
  }, [mode, allMatchedProducts, selectedSearchCategory]);

  const availableSubCategories = useMemo(() => {
    if (!category) return [];
    return category.productCategories || [];
  }, [category]);

  const filterCategories = useMemo(() => {
    if (mode !== 'category' || !category) return null;
    if (sub && availableSubCategories.includes(sub)) {
      return [sub];
    }
    return availableSubCategories;
  }, [mode, category, sub, availableSubCategories]);

  // Chế độ tìm kiếm: Tải toàn bộ sản phẩm khớp query để đếm danh mục và lọc tại chỗ
  useEffect(() => {
    if (mode !== 'search') return;
    if (!query) {
      setAllMatchedProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    api.products({ search: query, page: 0 }, controller.signal)
      .then(async (firstRes) => {
        const firstProducts = firstRes.products || [];
        const totalCount = firstRes.total || firstProducts.length;
        const pageSize = firstRes.pageSize || 24;
        const totalPages = Math.ceil(totalCount / pageSize);
        let all = [...firstProducts];

        if (totalPages > 1) {
          const extraPages = Array.from({ length: Math.min(totalPages - 1, 15) }, (_, i) => i + 1);
          const extraResponses = await Promise.all(
            extraPages.map((p) => api.products({ search: query, page: p }, controller.signal))
          );
          for (const res of extraResponses) {
            all.push(...(res.products || []));
          }
        }

        const seen = new Set<string>();
        all = all.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        // Lọc lại chuẩn theo nguyên chữ/cụm từ bằng searchProducts (tránh danh mục thừa)
        const strictMatched = searchProducts(
          all,
          query,
          (p) => ({ text: `${p.sku || ''} ${p.name} ${t(p.name)} ${p.category || ''}`, name: t(p.name) }),
          (p) => Boolean(p.thumbUrl || p.imageUrl),
          500
        );
        const finalMatched = strictMatched.length > 0 ? strictMatched : all;

        setAllMatchedProducts(finalMatched);
        setTotal(finalMatched.length);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) { logout(); return; }
        setError(t('Không tải được kết quả tìm kiếm, vui lòng thử lại'));
        setLoading(false);
      });

    return () => controller.abort();
  }, [mode, query, logout, t]);

  // Chế độ xem danh mục: Tải theo trang
  useEffect(() => {
    if (mode !== 'category' || !filterCategories) return;

    const controller = new AbortController();
    setLoading(true);
    setError('');

    const BACKEND_PAGE_SIZE = 24;
    const startIdx = (currentPage - 1) * displayPageSize;
    const endIdx = startIdx + displayPageSize;
    const firstBackendPage = Math.floor(startIdx / BACKEND_PAGE_SIZE);
    const lastBackendPage = Math.floor((endIdx - 1) / BACKEND_PAGE_SIZE);

    const pagesToFetch = [firstBackendPage];
    if (lastBackendPage !== firstBackendPage) {
      pagesToFetch.push(lastBackendPage);
    }

    Promise.all(
      pagesToFetch.map((p) =>
        api.products({ categories: filterCategories, page: p }, controller.signal)
      )
    )
      .then((responses) => {
        const combined: Product[] = [];
        for (const res of responses) {
          combined.push(...(res.products || []));
        }
        const offset = startIdx - firstBackendPage * BACKEND_PAGE_SIZE;
        const sliced = combined.slice(offset, offset + displayPageSize);
        setProducts(sliced);
        setTotal(responses[0]?.total || 0);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) { logout(); return; }
        setError(t('Không tải được sản phẩm, vui lòng thử lại'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [mode, filterCategories, currentPage, displayPageSize, logout, t]);

  if (mode === 'categories') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-[#17231d]">{t('Danh mục hàng hóa')}</h1>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-[#17231d]/6 sm:p-6">
          {home ? <CategoryRail categories={home.categories} layout="grid" /> : <ProductGridSkeleton />}
        </div>
      </div>
    );
  }

  const title = mode === 'search' ? `${t('Kết quả cho')} “${query}”` : category ? t(category.name) : t('Danh mục');

  const totalCount = mode === 'search' ? filteredSearchProducts.length : total;
  const sorted = sortProducts(mode === 'search' ? filteredSearchProducts : products, sort);
  const totalPages = Math.max(1, Math.ceil(totalCount / displayPageSize));
  const displayedProducts = mode === 'search'
    ? sorted.slice((currentPage - 1) * displayPageSize, currentPage * displayPageSize)
    : sorted;

  const goToPage = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete('trang');
    else next.set('trang', String(p));
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fromItem = totalCount === 0 ? 0 : (currentPage - 1) * displayPageSize + 1;
  const toItem = Math.min(totalCount, (currentPage - 1) * displayPageSize + displayedProducts.length);

  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-1 text-xs text-[#59665f]" aria-label="breadcrumb">
        <Link to="/" className="hover:text-[#0f7a4f]">{t('Trang chủ')}</Link>
        <ChevronRight size={13} />
        {mode === 'category' ? <Link to="/danh-muc" className="hover:text-[#0f7a4f]">{t('Danh mục')}</Link> : <span>{t('Tìm kiếm')}</span>}
        {mode === 'category' && category && (<><ChevronRight size={13} /><span className="font-semibold text-[#17231d]">{t(category.name)}</span></>)}
      </nav>

      {mode === 'search' ? (
        <div className="rounded-3xl bg-white p-4 sm:p-6 ring-1 ring-[#17231d]/8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-[#17231d] sm:text-2xl">{title}</h1>
              {!loading && (
                <p className="text-sm text-[#59665f]">
                  {selectedSearchCategory ? `${filteredSearchProducts.length} / ` : ''}{allMatchedProducts.length} {t('mặt hàng')}
                </p>
              )}
            </div>
          </div>

          {/* Thanh công cụ Sort & Filter nhóm hàng chuẩn Kamereo */}
          <div className="rounded-2xl bg-[#f8faf8] px-3.5 py-2.5 ring-1 ring-[#17231d]/8 shadow-2xs flex flex-wrap sm:flex-nowrap items-center gap-3">
            <SortDropdown value={sort} onChange={setSort} align="left" />

            {!loading && searchCategoryCounts.length > 0 && (
              <>
                <div className="hidden sm:block h-5 w-px bg-[#17231d]/12 shrink-0" />

                <div ref={searchRailRef} className="no-scrollbar flex-1 flex items-center gap-2 overflow-x-auto overscroll-contain select-none cursor-grab">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSearchCategory('');
                      goToPage(1);
                    }}
                    className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-bold ring-1 transition cursor-pointer ${
                      !selectedSearchCategory
                        ? 'bg-[#eaf6ef] text-[#0f7a4f] ring-1.5 ring-[#0f7a4f]'
                        : 'bg-white text-[#17231d] ring-1 ring-[#17231d]/15 hover:ring-[#0f7a4f]'
                    }`}
                  >
                    {t('Tất cả')} ({allMatchedProducts.length})
                  </button>
                  {searchCategoryCounts.map(({ cat, count }) => {
                    const isActive = selectedSearchCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedSearchCategory(isActive ? '' : cat);
                          goToPage(1);
                        }}
                        className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-bold ring-1 transition cursor-pointer ${
                          isActive
                            ? 'bg-[#eaf6ef] text-[#0f7a4f] ring-1.5 ring-[#0f7a4f]'
                            : 'bg-white text-[#17231d] ring-1 ring-[#17231d]/15 hover:ring-[#0f7a4f]'
                        }`}
                      >
                        {t(cat)} ({count})
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          {loading ? (
            <ProductGridSkeleton />
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#f8faf8] px-6 py-14 text-center ring-1 ring-[#17231d]/6">
              <PackageSearch size={40} className="text-[#59665f]/40" />
              <p className="font-bold text-[#17231d]">{t('Chưa tìm thấy mặt hàng phù hợp')}</p>
              <p className="max-w-sm text-sm text-[#59665f]">{t('Chưa thấy mặt hàng cần tìm? Quý khách có thể ghi tên hàng trong giỏ hàng, TPS1 sẽ báo giá riêng.')}</p>
              <Link to="/gio-hang" className="mt-1 text-sm font-bold text-[#0f7a4f] hover:underline">{t('Mở giỏ hàng')}</Link>
            </div>
          ) : (
            <StoreProductGrid products={displayedProducts} hasMore={false} />
          )}

          {/* Phân trang (Pagination) */}
          {totalPages > 1 && !loading && (
            <div className="mt-6 flex flex-col items-center gap-3 border-t border-[#17231d]/8 pt-4 sm:flex-row sm:justify-between">
              <p className="text-xs sm:text-sm font-medium text-[#59665f]">
                {t('Hiển thị')} <span className="font-bold text-[#17231d]">{fromItem}–{toItem}</span> / <span className="font-bold text-[#17231d]">{totalCount}</span> {t('mặt hàng')} · {t('Trang')} <span className="font-bold text-[#0f7a4f]">{currentPage}</span>/{totalPages}
              </p>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="flex h-9 items-center gap-1 rounded-lg border border-[#17231d]/12 bg-white px-2.5 text-xs font-bold text-[#17231d] transition hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  <span className="hidden sm:inline">{t('Trước')}</span>
                </button>

                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="flex h-9 w-7 items-center justify-center text-xs font-bold text-[#8a9690]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(Number(p))}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                        p === currentPage
                          ? 'bg-[#0f7a4f] text-white shadow-xs'
                          : 'border border-[#17231d]/12 bg-white text-[#17231d] hover:bg-[#f5f7f3]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="flex h-9 items-center gap-1 rounded-lg border border-[#17231d]/12 bg-white px-2.5 text-xs font-bold text-[#17231d] transition hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">{t('Sau')}</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-[#17231d] sm:text-2xl">{title}</h1>
              {!loading && <p className="text-sm text-[#59665f]">{total} {t('mặt hàng')}</p>}
            </div>
            <SortDropdown value={sort} onChange={setSort} align="right" />
          </div>

          {mode === 'category' && category && availableSubCategories.length > 1 && (
            <div ref={subRailRef} className="no-scrollbar flex gap-2 overflow-x-auto pb-1 overscroll-contain select-none cursor-grab">
              {['', ...availableSubCategories].map((value) => (
                <button
                  key={value || 'all'}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    if (value) next.set('nhom', value);
                    else next.delete('nhom');
                    next.delete('trang'); // Tự động về trang 1 khi đổi nhóm
                    setParams(next, { replace: true });
                  }}
                  className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 transition ${sub === value ? 'bg-[#0f7a4f] text-white ring-[#0f7a4f]' : 'bg-white text-[#17231d] ring-[#17231d]/10 hover:ring-[#0f7a4f]/40'}`}
                >
                  {value ? t(value) : t('Tất cả')}
                </button>
              ))}
            </div>
          )}

          {mode === 'category' && home && !category && (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t('Danh mục này không còn hiển thị.')} <Link to="/danh-muc" className="font-bold underline">{t('Xem danh mục khác')}</Link></p>
          )}
          {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          {loading ? (
            <ProductGridSkeleton />
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-[#17231d]/6">
              <PackageSearch size={40} className="text-[#59665f]/40" />
              <p className="font-bold text-[#17231d]">{t('Nhóm hàng này đang được bổ sung')}</p>
              <p className="max-w-sm text-sm text-[#59665f]">{t('Chưa thấy mặt hàng cần tìm? Quý khách có thể ghi tên hàng trong giỏ hàng, TPS1 sẽ báo giá riêng.')}</p>
              <Link to="/gio-hang" className="mt-1 text-sm font-bold text-[#0f7a4f] hover:underline">{t('Mở giỏ hàng')}</Link>
            </div>
          ) : (
            <StoreProductGrid products={sorted} hasMore={false} />
          )}

          {/* Phân trang (Pagination) */}
          {totalPages > 1 && !loading && (
            <div className="mt-6 flex flex-col items-center gap-3 border-t border-[#17231d]/8 pt-4 sm:flex-row sm:justify-between">
              <p className="text-xs sm:text-sm font-medium text-[#59665f]">
                {t('Hiển thị')} <span className="font-bold text-[#17231d]">{fromItem}–{toItem}</span> / <span className="font-bold text-[#17231d]">{total}</span> {t('mặt hàng')} · {t('Trang')} <span className="font-bold text-[#0f7a4f]">{currentPage}</span>/{totalPages}
              </p>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="flex h-9 items-center gap-1 rounded-lg border border-[#17231d]/12 bg-white px-2.5 text-xs font-bold text-[#17231d] transition hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  <span className="hidden sm:inline">{t('Trước')}</span>
                </button>

                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="flex h-9 w-7 items-center justify-center text-xs font-bold text-[#8a9690]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(Number(p))}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                        p === currentPage
                          ? 'bg-[#0f7a4f] text-white shadow-xs'
                          : 'border border-[#17231d]/12 bg-white text-[#17231d] hover:bg-[#f5f7f3]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="flex h-9 items-center gap-1 rounded-lg border border-[#17231d]/12 bg-white px-2.5 text-xs font-bold text-[#17231d] transition hover:bg-[#f5f7f3] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">{t('Sau')}</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
