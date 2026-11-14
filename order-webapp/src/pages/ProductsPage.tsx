import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { searchProducts } from '../lib/productSearch';
import {
  api,
  type Product,
  type ProductCatalogResponse,
  type Order,
  type FrequentItem,
  ApiError,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useOrderSubmit } from '../hooks/useOrderSubmit';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLanguage } from '../contexts/LanguageContext';

import QuickOrderSections from '../components/products/QuickOrderSections';
import ProductGrid from '../components/products/ProductGrid';
import CartSummarySidebar from '../components/products/CartSummarySidebar';
import CartFloatingBar from '../components/products/CartFloatingBar';
import CartCheckoutDrawer from '../components/products/CartCheckoutDrawer';
import OrderSuccessModal from '../components/products/OrderSuccessModal';

const PRODUCT_CACHE_TTL_MS = 2 * 60 * 1000;
const productSearchCache = new Map<string, { expiresAt: number; products: Product[] }>();
const PRODUCT_CATALOG_TTL_MS = 5 * 60 * 1000;
const productCatalogMemoryCache = new Map<string, { expiresAt: number; products: Product[] }>();
function decodeCatalog(catalog: ProductCatalogResponse): Product[] {
  const imageBaseUrl = catalog.imageBaseUrl.replace(/\/$/, '');
  return catalog.items.map(([id, sku, name, category, unit, price, priceOnRequest, hasImage]) => {
    const imageUrl = hasImage && imageBaseUrl ? `${imageBaseUrl}/${id}.webp` : null;
    const product: Product = {
      id,
      sku,
      name,
      category,
      unit,
      price: Number(price) || 0,
      priceOnRequest,
      imageUrl,
      thumbUrl: imageUrl,
      available: true,
    };
    return product;
  });
}

function searchLocalCatalog(products: Product[], rawQuery: string, productName: (name: string) => string): Product[] {
  return searchProducts(
    products,
    rawQuery,
    (product) => ({
      text: `${product.sku || ''} ${product.name} ${productName(product.name)} ${product.category || ''}`,
      name: productName(product.name),
    }),
    (product) => Boolean(product.thumbUrl || product.imageUrl),
  );
}

export default function ProductsPage() {
  const { session, logout } = useAuth();
  const { t, productName } = useLanguage();
  const navigate = useNavigate();

  // Giỏ hàng chung của cả app (CartContext) và luồng gửi đơn dùng chung.
  const {
    tab: activeTab,
    updateTab: updateActiveTab,
    addProduct,
    addUnlisted,
    updateQty,
    updateNote,
    removeItem,
  } = useCart();
  const { submit, submitting, errorMessage, setErrorMessage, successOrder, clearSuccess, cutoffInfo } = useOrderSubmit();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  // 2. Search & Catalog state
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [searchCategoryFilter, setSearchCategoryFilter] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const productGridWrapRef = useRef<HTMLDivElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [frequentItems, setFrequentItems] = useState<FrequentItem[]>([]);
  const [loadingLatestOrder, setLoadingLatestOrder] = useState(false);
  const hasSubmittedSearch = Boolean(searchQuery.trim());

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSearchCategoryFilter('');
  }, [searchQuery]);
  // Hàng yêu thích dùng chung với cửa hàng (FavoritesContext).
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();

  // Mobile Checkout Drawer & Success Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const searchTimeoutRef = useRef<any>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchRequestRef = useRef(0);
  const catalogAbortRef = useRef<AbortController | null>(null);


  // Tìm kiếm qua Search API khi catalog cục bộ chưa sẵn sàng
  const loadProducts = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      const cacheKey = `${session?.id || 'anonymous'}:${query.toLocaleLowerCase('vi-VN')}`;
      const cached = productSearchCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setSearchResults(cached.products);
        return;
      }

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const requestId = ++searchRequestRef.current;
      setSearchLoading(true);
      try {
        const res = await api.products(query ? { search: query } : {}, controller.signal);
        if (requestId !== searchRequestRef.current) return;
        const products = res.products || [];
        productSearchCache.set(cacheKey, {
          expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS,
          products,
        });
        setSearchResults(products);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/dang-nhap');
        }
      } finally {
        if (requestId === searchRequestRef.current) setSearchLoading(false);
      }
    },
    [logout, navigate, session?.id]
  );

  // Tải 20 mặt hàng thường đặt
  useEffect(() => {
    const controller = new AbortController();
    void api
      .frequentItems(controller.signal)
      .then((res) => setFrequentItems(res.items || []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // Nạp đơn gần nhất để khách có thể đặt lại ngay ở màn hình mặc định.
  useEffect(() => {
    void api.orders()
      .then((res) => setRecentOrders((res.orders || []).slice(0, 1)))
      .catch(() => undefined);
  }, []);

  // Hiển thị nhóm hàng đầu tiên trước. Không bắt khách chờ toàn bộ catalog
  // 5.000+ mặt hàng; tìm kiếm sẽ gọi API theo từ khóa trong lúc catalog nền
  // chưa sẵn sàng.
  useEffect(() => {
    const cached = productCatalogMemoryCache.get(session?.id || '');
    if (cached && cached.expiresAt > Date.now()) return;
    const controller = new AbortController();
    void api.products({}, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setInitialProducts(res.products || []);
        setCatalogLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [session?.id]);

  // Tải toàn bộ Catalog vào bộ nhớ ở nền để tìm kiếm tức thì cho các lần sau.
  // Trì hoãn nhẹ để request đầu tiên và khung thao tác của khách được ưu tiên.
  useEffect(() => {
    const customerId = session?.id;
    if (!customerId) return;
    const now = Date.now();
    const memory = productCatalogMemoryCache.get(customerId);
    if (memory && memory.expiresAt > now) {
      setCatalogProducts(memory.products);
      setCatalogLoading(false);
      return;
    }

    const storageKey = `tps1_product_catalog_v1_${customerId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { expiresAt: number; catalog: ProductCatalogResponse };
        if ((parsed.expiresAt > now || !navigator.onLine) && Array.isArray(parsed.catalog?.items)) {
          const products = decodeCatalog(parsed.catalog);
          productCatalogMemoryCache.set(customerId, { expiresAt: parsed.expiresAt, products });
          setCatalogProducts(products);
          setCatalogLoading(false);
          return;
        }
        localStorage.removeItem(storageKey);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }

    const controller = new AbortController();
    catalogAbortRef.current = controller;
    const timer = window.setTimeout(() => void api
      .productCatalog(controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return;
        const products = decodeCatalog(catalog);
        const expiresAt = Date.now() + PRODUCT_CATALOG_TTL_MS;
        productCatalogMemoryCache.set(customerId, { expiresAt, products });
        setCatalogProducts(products);
        setCatalogLoading(false);
        try {
          localStorage.setItem(storageKey, JSON.stringify({ expiresAt, catalog }));
        } catch {}
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCatalogLoading(false);
          console.warn('Không tải được catalog nền:', error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }), 3000);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [session?.id]);

  // Phím tắt F3 để focus ô tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        const headerInput = document.querySelector('header form[role="search"] input') as HTMLInputElement | null;
        headerInput?.focus();
        headerInput?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    if (catalogProducts.length > 0) {
      searchAbortRef.current?.abort();
      setSearchLoading(false);
      setSearchResults(searchLocalCatalog(catalogProducts, q, productName));
      return;
    }

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => void loadProducts(q), 120);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, loadProducts, catalogProducts, productName]);

  // Thao tác Thêm / Sửa số lượng / Ghi chú dòng
  const handleAddProduct = (
    product: Product,
    quantityToAdd: number = 1,
    options?: { resetSearch?: boolean; keepFocus?: boolean }
  ) => {
    addProduct(product, Math.max(0.1, Number(quantityToAdd) || 1));

    if (options?.resetSearch) { setSearchQuery(''); }
    if (options?.keepFocus) {
      const headerInput = document.querySelector('header form[role="search"] input') as HTMLInputElement | null;
      headerInput?.focus();
    }
  };

  const handleAddUnlisted = addUnlisted;
  const handleUpdateQty = updateQty;
  const handleUpdateItemNote = updateNote;
  const handleRemoveItem = removeItem;

  // Nhận yêu cầu "Đặt lại" từ lịch sử đơn sau khi catalog đã sẵn sàng.
  useEffect(() => {
    if (catalogProducts.length === 0) return;
    const raw = sessionStorage.getItem('tps1_reorder_request_v1');
    if (!raw) return;
    sessionStorage.removeItem('tps1_reorder_request_v1');
    try {
      const requested = JSON.parse(raw) as Array<{ productId: string; quantity: number; note?: string }>;
      const productsById = new Map(catalogProducts.map((product) => [product.id, product]));
      const items = requested
        .map((item) => {
          const product = productsById.get(item.productId);
          return product
            ? { product, quantity: Math.max(0.1, Number(item.quantity) || 1), note: item.note || '' }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      if (items.length === 0) {
        setErrorMessage(t('Các mặt hàng trong đơn cũ hiện không còn trong danh mục. Vui lòng tìm và chọn lại.'));
        return;
      }
      updateActiveTab((tab) => ({ ...tab, items }));
      if (items.length < requested.length) {
        setErrorMessage(t('Một số mặt hàng cũ không còn trong danh mục và đã được bỏ qua.'));
      }
    } catch {
      setErrorMessage(t('Không đọc được dữ liệu đơn cũ. Vui lòng thử lại.'));
    }
  }, [catalogProducts, updateActiveTab, t]);

  // Danh sách gợi ý từ catalog và lịch sử
  const frequentProducts = useMemo(
    () =>
      frequentItems.slice(0, 10).map((item) => ({
        id: item.productId,
        sku: item.sku || '',
        name: item.name,
        category: item.category || null,
        unit: item.unit || 'Kg',
        price: Number(item.price) || 0,
        priceOnRequest: Boolean(item.priceOnRequest),
        imageUrl: item.imageUrl || null,
        thumbUrl: item.imageUrl || null,
        available: true,
      } satisfies Product)),
    [frequentItems]
  );

  const favoriteProducts = useMemo(
    () =>
      favoriteIds
        .map((id) => catalogProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 10),
    [catalogProducts, favoriteIds]
  );

  const latestOrder = recentOrders[0];

  const displayedProducts = useMemo(() => {
    return hasSubmittedSearch ? searchResults : [];
  }, [hasSubmittedSearch, searchResults]);

  const searchResultCategories = useMemo(() => {
    if (!hasSubmittedSearch) return [];
    return Array.from(new Set(searchResults.map((p) => (p.category || '').trim()).filter(Boolean)));
  }, [hasSubmittedSearch, searchResults]);

  const filteredSearchResults = useMemo(() => {
    if (!searchCategoryFilter) return displayedProducts;
    return displayedProducts.filter((p) => (p.category || '').trim() === searchCategoryFilter);
  }, [displayedProducts, searchCategoryFilter]);

  const categories = useMemo(() => [...new Set(catalogProducts.map(p => String(p.category || '').trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b,'vi')), [catalogProducts]);
  const browseProducts = useMemo(
    () => {
      const products = catalogProducts.length ? catalogProducts : initialProducts;
      return selectedCategory ? products.filter(product => product.category === selectedCategory) : products;
    },
    [catalogProducts, initialProducts, selectedCategory]
  );
  const sourceProducts = hasSubmittedSearch ? filteredSearchResults : browseProducts;
  const totalPages = Math.max(1, Math.ceil(sourceProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleProducts = sourceProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Khớp chiều cao CartSummarySidebar trên Desktop với Lưới sản phẩm (chống lệch OCD)
  useEffect(() => {
    if (!productGridWrapRef.current) return;
    const el = productGridWrapRef.current;
    const updateHeight = () => {
      if (window.innerWidth >= 1024 && visibleProducts.length >= 5) {
        const h = Math.round(el.getBoundingClientRect().height);
        if (h > 400) {
          setSidebarHeight(h);
          return;
        }
      }
      setSidebarHeight(undefined);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleProducts.length]);

  // Số sản phẩm/trang theo số cột thực tế của lưới (1/2/3/4 cột)
  useEffect(() => {
    const updatePageSize = () => {
      const w = window.innerWidth;
      if (w >= 1536) setPageSize(12); // 4 cột x 3 hàng
      else if (w >= 1280) setPageSize(9); // 3 cột x 3 hàng
      else setPageSize(8); // 2 cột x 4 hàng / mobile
    };
    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  // Về trang 1 khi đổi nhóm hàng hoặc từ khóa
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pageNumbers: (number | string)[] = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (safePage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
  })();


  const addOrderAgain = (order: Order) => {
    const productsById = new Map(catalogProducts.map((p) => [p.id, p]));
    order.items.forEach((item) => {
      const p = productsById.get(item.productId);
      if (p) handleAddProduct(p, Number(item.quantity) || 1);
    });
  };

  const loadLatestOrderAndAdd = async () => {
    if (latestOrder) {
      addOrderAgain(latestOrder);
      return;
    }
    setLoadingLatestOrder(true);
    try {
      const res = await api.orders();
      const order = (res.orders || [])[0];
      if (order) {
        setRecentOrders([order]);
        addOrderAgain(order);
      }
    } catch {
    } finally {
      setLoadingLatestOrder(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (await submit()) setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col min-w-0 w-full max-w-full gap-3.5 sm:gap-4 pb-24 lg:pb-0">
      {/* 1. Header trang: Lời chào & Giờ chốt đơn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-0.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17231d] tracking-tight">
            {t('Đặt hàng cho bếp')}
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-semibold text-[#8a5729]">
          <Clock size={13} className="text-[#e0742f]" />
          <span>{cutoffInfo ? `${t('Giao')}: ${cutoffInfo.earliestDate} · ${t('Chốt')}: ${cutoffInfo.cutoffTimeStr}` : t('Đang tải lịch giao')}</span>
        </div>
      </div>

      {/* Thao tác đặt nhanh và danh mục chỉ hiện khi chưa gửi từ khóa. */}
      {!hasSubmittedSearch && <QuickOrderSections latestOrder={latestOrder} loadingLatestOrder={loadingLatestOrder} onReorderLatest={loadLatestOrderAndAdd}
        frequentProducts={frequentProducts} favoriteProducts={favoriteProducts} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite}
        categories={categories} selectedCategory={selectedCategory} onSelectCategory={(category) => { setSelectedCategory(category); }} onAddProduct={handleAddProduct} />}

      {/* 2. Tiêu đề khu vực sản phẩm & Thanh lọc nhóm hàng khi tìm kiếm */}
      <div ref={gridTopRef} className="space-y-2.5 min-w-0 w-full scroll-mt-44">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#17231d] uppercase tracking-wider flex items-center gap-2">
            <span>
              {hasSubmittedSearch
                ? `${t('Kết quả tìm kiếm')} ("${searchQuery}")`
                : selectedCategory ? productName(selectedCategory) : t('Tất cả sản phẩm')}
            </span>
            <span className="text-xs font-mono font-normal text-[#59665f]">
              ({hasSubmittedSearch ? (searchCategoryFilter ? filteredSearchResults.length : displayedProducts.length) : browseProducts.length} {t('mặt hàng')})
            </span>
          </h2>
          {hasSubmittedSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('q');
                  return next;
                }, { replace: true });
                setSearchQuery('');
                setSearchResults([]);
                setSearchCategoryFilter('');
              }}
              className="text-xs font-bold text-[#0f7a4f] hover:underline flex items-center gap-1 transition"
            >
              ✕ {t('Xóa tìm kiếm')}
            </button>
          )}
        </div>

        {/* Thanh lọc nhóm hàng nhanh khi tìm kiếm trên trang Đặt hàng */}
        {hasSubmittedSearch && searchResultCategories.length > 0 && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 overscroll-contain select-none">
            <button
              type="button"
              onClick={() => setSearchCategoryFilter('')}
              className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-bold ring-1 transition cursor-pointer ${
                !searchCategoryFilter
                  ? 'bg-[#eaf6ef] text-[#0f7a4f] ring-[#0f7a4f]'
                  : 'bg-white text-[#17231d] ring-[#17231d]/15 hover:ring-[#0f7a4f]'
              }`}
            >
              {t('Tất cả')} ({searchResults.length})
            </button>
            {searchResultCategories.map((cat) => {
              const count = searchResults.filter((p) => (p.category || '').trim() === cat).length;
              const isActive = searchCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSearchCategoryFilter(isActive ? '' : cat)}
                  className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-bold ring-1 transition cursor-pointer ${
                    isActive
                      ? 'bg-[#eaf6ef] text-[#0f7a4f] ring-[#0f7a4f]'
                      : 'bg-white text-[#17231d] ring-[#17231d]/15 hover:ring-[#0f7a4f]'
                  }`}
                >
                  {productName(cat)} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start min-w-0 w-full">
        <div ref={productGridWrapRef} className="space-y-3 min-w-0">
          <ProductGrid
            products={visibleProducts}
            itemsInCart={activeTab.items}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onAddProduct={handleAddProduct}
            onUpdateQty={handleUpdateQty}
            onUpdateNote={handleUpdateItemNote}
            searchQuery={hasSubmittedSearch ? searchQuery : selectedCategory}
            loading={hasSubmittedSearch ? searchLoading : catalogLoading}
          />
          {totalPages > 1 && (
            <nav aria-label="Phân trang" className="flex flex-col items-center gap-2.5 border-t border-[#17231d]/8 pt-4 sm:flex-row sm:justify-between">
              <p className="text-xs font-medium text-[#59665f]">
                {t('Trang')} <span className="font-bold text-[#0f7a4f]">{safePage}</span> / {totalPages} ({sourceProducts.length} {t('mặt hàng')})
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="h-9 rounded-lg border border-[#17231d]/12 bg-white px-3 text-xs font-bold text-[#17231d] hover:border-[#0f7a4f] hover:text-[#0f7a4f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('Trước')}
                </button>
                {pageNumbers.map((p, idx) =>
                  typeof p === 'string' ? (
                    <span key={`dots-${idx}`} className="px-1 text-xs text-[#8a9690]">...</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      aria-current={p === safePage ? 'page' : undefined}
                      className={`size-9 rounded-lg border text-xs transition ${
                        p === safePage
                          ? 'border-[#0f7a4f] bg-[#0f7a4f] font-bold text-white'
                          : 'border-[#17231d]/12 bg-white font-semibold text-[#17231d] hover:border-[#0f7a4f] hover:text-[#0f7a4f]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="h-9 rounded-lg border border-[#17231d]/12 bg-white px-3 text-xs font-bold text-[#17231d] hover:border-[#0f7a4f] hover:text-[#0f7a4f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('Sau')}
                </button>
              </div>
            </nav>
          )}
        </div>

        {/* CỘT PHẢI (Desktop): Sidebar Tóm tắt đơn & Gửi đơn */}
        <div className="hidden lg:block min-w-0">
          <CartSummarySidebar
            matchedHeight={sidebarHeight}
            session={session}
            earliestDate={cutoffInfo?.earliestDate}
            cutoffTimeStr={cutoffInfo?.cutoffTimeStr}
            activeTab={activeTab}
            onUpdateTab={updateActiveTab}
            onUpdateQty={handleUpdateQty}
            onUpdateNote={handleUpdateItemNote}
            onRemoveItem={handleRemoveItem}
            onAddUnlisted={handleAddUnlisted}
            onSubmitOrder={handleSubmitOrder}
            submitting={submitting}
            errorMessage={errorMessage}
          />
        </div>
      </div>

      {/* 5. Mobile Floating Cart Bar (khi có sản phẩm) */}
      <CartFloatingBar
        activeTab={activeTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* 6. Mobile Slide-up Checkout Drawer */}
      <CartCheckoutDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        session={session}
        earliestDate={cutoffInfo?.earliestDate}
        cutoffTimeStr={cutoffInfo?.cutoffTimeStr}
        activeTab={activeTab}
        onUpdateTab={updateActiveTab}
        onUpdateQty={handleUpdateQty}
        onUpdateNote={handleUpdateItemNote}
        onRemoveItem={handleRemoveItem}
        onAddUnlisted={handleAddUnlisted}
        onSubmitOrder={handleSubmitOrder}
        submitting={submitting}
        errorMessage={errorMessage}
      />

      {/* 7. Modal thông báo đặt hàng thành công */}
      <OrderSuccessModal
        order={successOrder}
        pendingVerification={session?.verificationStatus === 'pending'}
        onClose={clearSuccess}
      />
    </div>
  );
}
