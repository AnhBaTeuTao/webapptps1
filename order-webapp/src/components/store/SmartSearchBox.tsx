import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Zap,
  FileSpreadsheet,
  Flame,
  LayoutGrid,
  Clock,
  Trash2,
  Plus,
  ChevronRight,
  PackageOpen,
  Loader2,
} from 'lucide-react';
import { api, type Product } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreHome } from '../../hooks/useStoreHome';
import { searchProducts } from '../../lib/productSearch';
import ProductThumbnail from '../products/ProductThumbnail';

const RECENT_SEARCHES_KEY = 'tps1_recent_searches_v1';
const MAX_RECENT_SEARCHES = 8;

const TRENDING_KEYWORDS = [
  'Ba rọi heo',
  'Cá nục',
  'Trứng gà',
  'Cà chua',
  'Chanh',
  'Hành tây',
  'Cà rốt',
  'Dưa leo',
  'Hành lá',
  'Xà lách',
  'Dầu ăn',
  'Đậu hũ',
];

function getStoredRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string' && Boolean(s.trim())) : [];
  } catch {
    return [];
  }
}

function money(v: number) {
  return new Intl.NumberFormat('vi-VN').format(Number(v) || 0) + 'đ';
}

interface SmartSearchBoxProps {
  className?: string;
}

export default function SmartSearchBox({ className = '' }: SmartSearchBoxProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { t, productName, productUnit } = useLanguage();
  const { addItem, quantityOf } = useCart();
  const { data: home } = useStoreHome();

  const isQuickOrderPage = location.pathname === '/dat-hang';
  const isSearchPage = location.pathname === '/tim-kiem';

  const [value, setValue] = useState(
    isSearchPage || isQuickOrderPage ? params.get('q') || '' : ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ giá trị input khi url thay đổi
  useEffect(() => {
    if (isSearchPage || isQuickOrderPage) {
      setValue(params.get('q') || '');
    } else {
      setValue('');
    }
  }, [location.pathname, params, isSearchPage, isQuickOrderPage]);

  // Nạp lịch sử tìm kiếm khi mở popover
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getStoredRecentSearches());
    }
  }, [isOpen]);

  // Click ngoài đóng popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Search khi value có nội dung
  useEffect(() => {
    const query = value.trim();
    if (!query || !isOpen) {
      setLiveProducts([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .products({ search: query, page: 0 }, controller.signal)
        .then((res) => {
          const raw = res.products || [];
          const strict = searchProducts(
            raw,
            query,
            (p) => ({ text: `${p.sku || ''} ${p.name} ${t(p.name)} ${p.category || ''}`, name: t(p.name) }),
            (p) => Boolean(p.thumbUrl || p.imageUrl),
            20
          );
          setLiveProducts(strict.length > 0 ? strict : raw);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setLiveProducts([]);
          }
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, isOpen]);

  const saveRecent = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const current = getStoredRecentSearches();
    const updated = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // Bỏ qua nếu storage đầy
    }
  };

  const handleRemoveRecent = (itemToRemove: string) => {
    const current = getStoredRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== itemToRemove.toLowerCase());
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // ignore
    }
  };

  const handleClearAllRecent = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (text: string) => {
    const q = text.trim();
    if (q) {
      saveRecent(q);
    }
    setIsOpen(false);

    if (isQuickOrderPage) {
      if (q) {
        navigate(`/dat-hang?q=${encodeURIComponent(q)}`, { replace: true });
      } else {
        navigate('/dat-hang', { replace: true });
      }
    } else {
      if (q) {
        navigate(`/tim-kiem?q=${encodeURIComponent(q)}`);
      }
    }
  };

  const handleClear = () => {
    setValue('');
    setLiveProducts([]);
    if (isQuickOrderPage) {
      navigate('/dat-hang', { replace: true });
    } else if (isSearchPage) {
      navigate('/tim-kiem', { replace: true });
    }
  };

  const trendingCategories = (home?.categories || []).slice(0, 6);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        role="search"
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit(value);
        }}
      >
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9690]" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={t('Tìm rau củ, thịt cá...')}
          aria-label={t('Tìm sản phẩm')}
          enterKeyHint="search"
          autoComplete="off"
          className={`h-10 w-full rounded-xl border border-[#17231d]/12 bg-[#f5f7f3] pl-8.5 sm:pl-9 ${value ? 'pr-21 sm:pr-24' : 'pr-14 sm:pr-16'} text-[12.5px] sm:text-[13px] text-[#17231d] placeholder:text-[#6e7a73] focus:border-[#0f7a4f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f7a4f]/15 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden`}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={t('Xóa tìm kiếm')}
            className="absolute right-13 sm:right-[3.75rem] top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-[#59665f] hover:bg-[#17231d]/8 hover:text-[#17231d] cursor-pointer"
          >
            <X size={15} />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-[#0f7a4f] px-2.5 sm:px-3.5 text-[11.5px] sm:text-xs font-bold text-white hover:bg-[#0b4f34] cursor-pointer"
        >
          {t('Tìm')}
        </button>
      </form>

      {/* POPOVER GỢI Ý THÔNG MINH B2B KIỂU KAMEREO */}
      {isOpen && (
        <div className="fixed inset-x-2.5 top-[106px] sm:absolute sm:inset-x-0 sm:top-[calc(100%+6px)] z-50 rounded-2xl border border-[#17231d]/12 bg-white shadow-2xl overflow-hidden max-h-[75vh] sm:max-h-[82vh] overflow-y-auto divide-y divide-[#17231d]/6">
          {/* TRẠNG THÁI A: KHI Ô TÌM KIẾM ĐANG RỖNG */}
          {!value.trim() ? (
            <div>
              {/* Phân khu 1: Thanh Tiện ích Đặt Bếp B2B */}
              <div className="bg-linear-to-r from-[#f8faf7] via-white to-[#f5fbf7] p-3 border-b border-[#17231d]/6">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Zap size={15} className="text-[#e0742f] fill-[#e0742f]" />
                    <span className="text-xs font-bold text-[#17231d]">{t('Tiện ích đặt bếp nhanh')}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0f7a4f] bg-[#0f7a4f]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {t('Chuẩn ISO 22000 · Giao sớm 05:00')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/dat-hang"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-[#17231d]/10 hover:border-[#0f7a4f] hover:text-[#0f7a4f] text-xs font-bold text-[#17231d] shadow-2xs transition group"
                  >
                    <Zap size={14} className="text-[#e0742f] group-hover:scale-110 transition-transform" />
                    <span>{t('Bảng đặt nhanh')}</span>
                  </Link>
                  <Link
                    to="/gio-hang?excel=1"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-[#17231d]/10 hover:border-[#0f7a4f] hover:text-[#0f7a4f] text-xs font-bold text-[#17231d] shadow-2xs transition group"
                  >
                    <FileSpreadsheet size={14} className="text-[#0f7a4f] group-hover:scale-110 transition-transform" />
                    <span>{t('Đặt từ file Excel')}</span>
                  </Link>
                </div>
              </div>

              {/* Phân khu 2: Lịch sử tìm kiếm gần đây */}
              {recentSearches.length > 0 && (
                <div className="p-3 sm:p-3.5 border-b border-[#17231d]/6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[#59665f]">
                      <Clock size={13} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{t('Bạn đã tìm')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-[11px] text-[#8a9690] hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors"
                      title={t('Xóa toàn bộ lịch sử tìm kiếm')}
                    >
                      <Trash2 size={12} />
                      <span>{t('Xóa tất cả')}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => {
                          setValue(term);
                          handleSearchSubmit(term);
                        }}
                        className="cursor-pointer bg-[#f5f7f3] hover:bg-[#eaf6ef] hover:text-[#0f7a4f] text-[#17231d] text-xs px-2.5 py-1.5 rounded-lg border border-[#17231d]/8 flex items-center gap-1.5 transition-colors group"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecent(term);
                          }}
                          className="text-[#8a9690] hover:text-rose-500 rounded p-0.5 -mr-1"
                          title={t('Xóa')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phân khu 3: Tìm kiếm thịnh hành */}
              <div className="p-3 sm:p-3.5 border-b border-[#17231d]/6">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Flame size={15} className="text-[#e0742f] fill-[#e0742f]" />
                  <span className="text-xs font-bold text-[#17231d]">{t('Tìm kiếm thịnh hành')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_KEYWORDS.map((kw) => (
                    <button
                      type="button"
                      key={kw}
                      onClick={() => {
                        setValue(kw);
                        handleSearchSubmit(kw);
                      }}
                      className="cursor-pointer bg-[#f8faf7] hover:bg-[#fef5ee] hover:border-[#e0742f]/30 hover:text-[#c4601f] text-[#2c3a33] text-xs font-medium px-3 py-1.5 rounded-xl border border-[#17231d]/8 transition-all"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phân khu 4: Nhóm hàng xu hướng cho bếp */}
              {trendingCategories.length > 0 && (
                <div className="p-3 sm:p-3.5 bg-[#fcfdfa]">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <LayoutGrid size={15} className="text-[#0f7a4f]" />
                    <span className="text-xs font-bold text-[#17231d]">{t('Nhóm hàng xu hướng cho bếp')}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {trendingCategories.map((cat) => (
                      <Link
                        to={`/danh-muc/${cat.slug}`}
                        key={cat.slug}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-xl border border-[#17231d]/8 bg-white hover:bg-[#f1f7f3] hover:border-[#0f7a4f]/30 transition group"
                      >
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#17231d]/6"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#0f7a4f]/10 flex items-center justify-center text-[#0f7a4f] shrink-0">
                            <PackageOpen size={16} />
                          </div>
                        )}
                        <span className="text-xs font-semibold text-[#17231d] group-hover:text-[#0f7a4f] truncate">
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TRẠNG THÁI B: KHI Ô TÌM KIẾM CÓ TỪ KHÓA */
            <div>
              {/* Nút tìm kiếm nhanh khớp từ khóa */}
              <button
                type="button"
                onClick={() => handleSearchSubmit(value)}
                className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-[#f8faf7] transition-colors cursor-pointer border-b border-[#17231d]/6 text-xs sm:text-sm font-semibold text-[#0f7a4f]"
              >
                <Search size={16} className="shrink-0 text-[#0f7a4f]" />
                <span className="flex-1 truncate">
                  {t('Tìm tất cả mặt hàng khớp với')} <span className="font-bold underline">"{value.trim()}"</span>
                </span>
                <ChevronRight size={16} className="text-[#8a9690] shrink-0" />
              </button>

              {/* Danh sách kết quả gợi ý trực tiếp */}
              {isSearching ? (
                <div className="p-6 flex flex-col items-center justify-center gap-2 text-[#59665f]">
                  <Loader2 size={24} className="animate-spin text-[#0f7a4f]" />
                  <span className="text-xs">{t('Đang tìm kiếm kho hàng 5.000+ sản phẩm...')}</span>
                </div>
              ) : liveProducts.length > 0 ? (
                <div className="divide-y divide-[#17231d]/6">
                  {liveProducts.slice(0, 8).map((product) => {
                    const qtyInCart = quantityOf(product.id);
                    const unitLabel = productUnit(product.unit || 'Kg');
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          saveRecent(product.name);
                          handleSearchSubmit(product.name);
                        }}
                        className="flex items-center gap-3 p-2.5 sm:p-3 hover:bg-[#f5fbf7] transition-colors cursor-pointer group"
                      >
                        {/* Thumbnail */}
                        <ProductThumbnail product={product} size="sm" className="w-11 h-11 rounded-lg shrink-0" />

                        {/* Thông tin sản phẩm */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-[13px] font-bold text-[#17231d] group-hover:text-[#0f7a4f] transition-colors line-clamp-1">
                            {productName(product.name)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#59665f] mt-0.5">
                            {product.sku && (
                              <span className="font-mono text-[10px] font-bold bg-[#17231d]/6 px-1.5 py-0.2 rounded shrink-0">
                                {product.sku}
                              </span>
                            )}
                            <span className="whitespace-nowrap">{unitLabel}</span>
                            {product.category && (
                              <span className="truncate">· {productName(product.category)}</span>
                            )}
                          </div>
                        </div>

                        {/* Giá sản phẩm */}
                        <div className="text-right shrink-0">
                          {product.priceOnRequest ? (
                            <span className="block text-xs font-bold text-[#e0742f]">
                              {t('Chờ sale báo giá')}
                            </span>
                          ) : (
                            <span className="block text-sm font-extrabold text-[#0f7a4f]">
                              {money(product.price)}
                            </span>
                          )}
                          <span className="block text-[10px] text-[#8a9690]">/{unitLabel}</span>
                        </div>

                        {/* Nút thêm nhanh vào giỏ */}
                        <div className="shrink-0 flex items-center gap-1.5 pl-1">
                          {qtyInCart > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0f7a4f]/15 text-[#0f7a4f]">
                              x{qtyInCart}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(product, 1);
                              saveRecent(product.name);
                            }}
                            className="size-8 rounded-lg bg-[#0f7a4f] text-white hover:bg-[#0b4f34] flex items-center justify-center transition-transform active:scale-95 shadow-xs cursor-pointer"
                            title={`+1 ${unitLabel} vào đơn`}
                            aria-label={`Thêm 1 ${unitLabel} ${product.name} vào đơn`}
                          >
                            <Plus size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#59665f]">
                  <p className="font-semibold text-[#17231d]">
                    {t('Không tìm thấy mặt hàng phù hợp với')} "{value.trim()}"
                  </p>
                  <p className="text-[11px] text-[#8a9690] mt-1">
                    {t('Thử tìm bằng các từ khóa phổ biến: thịt, cá, rau củ, trứng, gia vị...')}
                  </p>
                </div>
              )}

              {/* Dòng cuối cùng: Xem tất cả kết quả */}
              <button
                type="button"
                onClick={() => handleSearchSubmit(value)}
                className="w-full p-2.5 text-center text-xs font-bold text-[#0f7a4f] hover:bg-[#eaf6ef] transition-colors border-t border-[#17231d]/6 cursor-pointer"
              >
                {t('Xem tất cả kết quả cho')} "{value.trim()}" →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
