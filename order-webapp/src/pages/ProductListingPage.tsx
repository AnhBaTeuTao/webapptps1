import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, PackageSearch } from 'lucide-react';
import { api, ApiError, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import StoreProductCard from '../components/store/StoreProductCard';
import CategoryRail from '../components/store/CategoryRail';

type Sort = 'default' | 'price_asc' | 'price_desc' | 'name';

function sortProducts(products: Product[], sort: Sort) {
  if (sort === 'default') return products;
  const copy = [...products];
  const price = (p: Product) => (p.priceOnRequest || !(p.price > 0) ? Number.POSITIVE_INFINITY : p.price);
  if (sort === 'price_asc') copy.sort((a, b) => price(a) - price(b));
  if (sort === 'price_desc') copy.sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  return copy;
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-2 ring-1 ring-[#17231d]/6">
          <div className="aspect-square animate-pulse rounded-xl bg-[#eef2ee]" />
          <div className="mt-2 h-4 animate-pulse rounded bg-[#eef2ee]" />
          <div className="mt-2 h-9 animate-pulse rounded-xl bg-[#eef2ee]" />
        </div>
      ))}
    </div>
  );
}

/**
 * /danh-muc            → tất cả danh mục (lưới ảnh)
 * /danh-muc/:slug      → sản phẩm của danh mục
 * /tim-kiem?q=…        → kết quả tìm kiếm
 */
export default function ProductListingPage({ mode }: { mode: 'categories' | 'category' | 'search' }) {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const sub = params.get('nhom') || '';
  const { t } = useLanguage();
  const { logout } = useAuth();
  const { data: home } = useStoreHome();
  const category = home?.categories.find((c) => c.slug === slug) || null;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(mode !== 'categories');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<Sort>('default');

  const filterCategories = useMemo(() => {
    if (mode !== 'category' || !category) return null;
    return sub && category.productCategories.includes(sub) ? [sub] : category.productCategories;
  }, [mode, category, sub]);

  useEffect(() => {
    if (mode === 'categories') return;
    if (mode === 'category' && !filterCategories) return; // chờ danh sách danh mục
    if (mode === 'search' && !query) { setProducts([]); setTotal(0); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError(''); setPage(0);
    api.products(mode === 'search' ? { search: query } : { categories: filterCategories!, page: 0 }, controller.signal)
      .then((res) => { setProducts(res.products || []); setTotal(res.total || 0); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) { logout(); return; }
        setError(t('Không tải được sản phẩm, vui lòng thử lại'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query, filterCategories?.join('|')]);

  const loadMore = async () => {
    if (!filterCategories) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await api.products({ categories: filterCategories, page: next });
      setProducts((current) => [...current, ...(res.products || [])]);
      setPage(next);
    } catch {
      setError(t('Không tải thêm được, vui lòng thử lại'));
    } finally {
      setLoadingMore(false);
    }
  };

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
  const sorted = sortProducts(products, sort);

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 text-xs text-[#59665f]" aria-label="breadcrumb">
        <Link to="/" className="hover:text-[#0f7a4f]">{t('Trang chủ')}</Link>
        <ChevronRight size={13} />
        {mode === 'category' ? <Link to="/danh-muc" className="hover:text-[#0f7a4f]">{t('Danh mục')}</Link> : <span>{t('Tìm kiếm')}</span>}
        {mode === 'category' && category && (<><ChevronRight size={13} /><span className="font-semibold text-[#17231d]">{t(category.name)}</span></>)}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#17231d]">{title}</h1>
          {!loading && <p className="text-sm text-[#59665f]">{total} {t('mặt hàng')}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm text-[#59665f]">
          <span className="hidden sm:inline">{t('Sắp xếp')}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 rounded-xl border border-[#17231d]/12 bg-white px-3 text-sm font-semibold text-[#17231d] focus:border-[#0f7a4f] focus:outline-none">
            <option value="default">{t('Phổ biến')}</option>
            <option value="price_asc">{t('Giá thấp đến cao')}</option>
            <option value="price_desc">{t('Giá cao đến thấp')}</option>
            <option value="name">{t('Tên A–Z')}</option>
          </select>
        </label>
      </div>

      {mode === 'category' && category && category.productCategories.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {['', ...category.productCategories].map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => { const next = new URLSearchParams(params); if (value) next.set('nhom', value); else next.delete('nhom'); setParams(next, { replace: true }); }}
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
          <p className="font-bold text-[#17231d]">{mode === 'search' ? t('Không tìm thấy mặt hàng phù hợp') : t('Danh mục đang cập nhật')}</p>
          <p className="max-w-sm text-sm text-[#59665f]">{t('Quý khách có thể thêm hàng ngoài danh mục trong giỏ hàng, TPS1 sẽ báo giá riêng.')}</p>
          <Link to="/gio-hang" className="mt-1 text-sm font-bold text-[#0f7a4f] hover:underline">{t('Mở giỏ hàng')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((product) => <StoreProductCard key={product.id} product={product} />)}
        </div>
      )}

      {mode === 'category' && !loading && products.length < total && (
        <button type="button" onClick={loadMore} disabled={loadingMore} className="mx-auto flex h-11 items-center justify-center rounded-xl border border-[#0f7a4f]/25 bg-white px-6 text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef] disabled:opacity-60">
          {loadingMore ? t('Đang tải...') : `${t('Xem thêm')} (${total - products.length})`}
        </button>
      )}
    </div>
  );
}
