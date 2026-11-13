import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Flame,
  Heart,
  Home,
  LayoutGrid,
  LogOut,
  PackageOpen,
  Phone,
  ShoppingCart,
  Truck,
  UserCircle2,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { LanguageSwitcher, useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import NotificationBell from '../components/NotificationBell';
import TrustMarquee from '../components/store/TrustMarquee';
import SmartSearchBox from '../components/store/SmartSearchBox';
import InstallBanner from '../components/store/InstallBanner';

const HOTLINE = '089 890 2222';

const SUB_CATEGORY_META: Record<string, { bgClass: string; imageUrl?: string }> = {
  'Rau củ quả': {
    bgClass: 'bg-[#e8f8f0]',
    imageUrl: 'https://yntgxollwjemyidizhnn.supabase.co/storage/v1/object/public/product-images/store/category/rau-cu-qua.webp',
  },
  'Trái cây': {
    bgClass: 'bg-[#fff4e6]',
    imageUrl: 'https://yntgxollwjemyidizhnn.supabase.co/storage/v1/object/public/product-images/thumbs/224fa28a-ac49-4338-b4ab-1c899d8e9571.webp',
  },
  'Chay, chả giò': {
    bgClass: 'bg-[#e8f8f0]',
    imageUrl: 'https://yntgxollwjemyidizhnn.supabase.co/storage/v1/object/public/product-images/thumbs/1b3bbc6c-5cd3-4168-bb20-ead5baf5d39b.webp',
  },
  'Đậu hũ': {
    bgClass: 'bg-[#fef9c3]',
    imageUrl: 'https://yntgxollwjemyidizhnn.supabase.co/storage/v1/object/public/product-images/thumbs/a555a572-0a8e-438f-a16c-2bddd2aaca82.webp',
  },
};

function CartButton({ compact = false }: { compact?: boolean }) {
  const { count } = useCart();
  const { t } = useLanguage();
  return (
    <Link to="/gio-hang" aria-label={`${t('Giỏ hàng')} (${count})`} className={`relative inline-flex items-center gap-2 rounded-xl ${compact ? 'size-10 justify-center' : 'h-10 px-3.5'} bg-[#0f7a4f] text-white hover:bg-[#0b4f34]`}>
      <ShoppingCart size={18} />
      {!compact && <span className="text-sm font-bold">{t('Giỏ hàng')}</span>}
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e0742f] px-1 text-[11px] font-black text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export default function StoreLayout() {
  const { session, logout } = useAuth();
  const { count } = useCart();
  const { ids: favoriteIds } = useFavorites();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: home } = useStoreHome();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [mobileShowSub, setMobileShowSub] = useState(false);
  const loginTarget = `/dang-nhap?quay-lai=${encodeURIComponent(location.pathname + location.search)}`;

  const activeCategory = (home?.categories || []).find((c) => c.slug === activeCategorySlug) || null;
  const hasActiveSub = Boolean(activeCategory && activeCategory.productCategories && activeCategory.productCategories.length > 1);
  const subCategories = hasActiveSub ? activeCategory!.productCategories : [];

  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);
  useEffect(() => {
    setCategoryDrawerOpen(false);
    setMobileShowSub(false);
  }, [location.pathname]);

  useEffect(() => {
    if (categoryDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setMobileShowSub(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [categoryDrawerOpen]);

  const bottomTabs = [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/yeu-thich', label: 'Yêu thích', icon: Heart, badge: favoriteIds.length },
    { to: '/don-hang', label: 'Đơn hàng', icon: ClipboardList },
    { to: '/gio-hang', label: 'Giỏ hàng', icon: ShoppingCart, badge: count },
    { to: session ? '/tai-khoan' : loginTarget, label: session ? 'Tài khoản' : 'Đăng nhập', icon: UserCircle2 },
  ];

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-clip flex-col bg-[#f5f7f3] selection:bg-[#0f7a4f] selection:text-white">
      <header className="sticky top-0 z-30 w-full max-w-full border-b border-[#17231d]/8 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <TrustMarquee />

        {/* TẦNG 1: Cùng hàng với Logo */}
        <div className="mx-auto flex max-w-330 items-center justify-between gap-3 sm:gap-4 px-3 py-2.5 sm:px-5 sm:py-3">
          {/* Cụm trái: Logo */}
          <Link to="/" className="shrink-0" aria-label="Thực Phẩm Số Một">
            <img src={`${import.meta.env.BASE_URL}images/tps1-logo-horizontal.png`} alt="Thực Phẩm Số Một" className="h-9 sm:h-10 w-auto object-contain shrink-0" />
          </Link>

          {/* Cụm giữa: 3 thẻ thông tin vận hành B2B chia đều không gian */}
          <div className="hidden lg:grid lg:grid-cols-3 flex-1 max-w-170 items-center gap-2.5 px-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#17231d]/8 bg-[#f8faf7] px-3 py-1.5 min-w-0">
              <Truck size={15} className="text-[#0f7a4f] shrink-0" />
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[10px] font-semibold text-[#59665f]">{t('Khung giờ giao bếp')}</span>
                <span className="block truncate text-xs font-bold text-[#17231d]">{t('Ca sớm: 05:00 – 07:00')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#17231d]/8 bg-[#f8faf7] px-3 py-1.5 min-w-0">
              <PackageOpen size={15} className="text-[#0f7a4f] shrink-0" />
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[10px] font-semibold text-[#59665f]">{t('Điểm giao mặc định')}</span>
                <span className="block truncate text-xs font-bold text-[#0b4f34]">
                  {session?.defaultShippingAddress?.address ? (session.defaultShippingAddress.alias || t('Bếp chính')) : t('TP.HCM · Bình Dương · Đồng Nai')}
                </span>
              </div>
            </div>
            <a
              href={'tel:' + HOTLINE.replace(/\s/g, '')}
              className="flex items-center gap-2 rounded-xl border border-[#e0742f]/20 bg-[#fef5ee]/70 px-3 py-1.5 min-w-0 hover:bg-[#fef5ee] transition"
              title={t('Tổng đài đặt hàng')}
            >
              <Phone size={15} className="text-[#e0742f] shrink-0" />
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[10px] font-semibold text-[#8a5729]">{t('Tổng đài B2B (24/7)')}</span>
                <span className="block truncate text-xs font-black text-[#c4601f]">{HOTLINE}</span>
              </div>
            </a>
          </div>

          {/* Cụm phải: Ngôn ngữ, Thông báo, Yêu thích, Tài khoản, Giỏ hàng */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            {session && <NotificationBell light />}
            <Link
              to="/yeu-thich"
              aria-label={`${t('Hàng yêu thích')} (${favoriteIds.length})`}
              title={t('Hàng yêu thích')}
              className={`relative flex size-9 sm:size-10 items-center justify-center rounded-xl transition ${
                favoriteIds.length > 0
                  ? 'bg-[#fef2f2] text-rose-500 hover:bg-rose-100'
                  : 'bg-[#f8faf7] text-[#2c3a33] hover:bg-[#fef2f2] hover:text-rose-500'
              }`}
            >
              <Heart
                size={19}
                className={favoriteIds.length > 0 ? 'fill-rose-500 text-rose-500' : 'fill-none text-current'}
              />
              {favoriteIds.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                  {favoriteIds.length > 99 ? '99+' : favoriteIds.length}
                </span>
              )}
            </Link>

            {session ? (
              <div className="flex items-center gap-1">
                <Link to="/tai-khoan" className="flex h-9 sm:h-10 items-center gap-2 rounded-xl px-2 hover:bg-[#f5f7f3]">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#eaf6ef] text-sm font-black text-[#0f7a4f]">{(session.company || session.name || 'K').trim().charAt(0).toUpperCase()}</span>
                  <span className="hidden max-w-32.5 truncate text-sm font-semibold text-[#17231d] md:inline">{session.company || session.name}</span>
                </Link>
                <button type="button" onClick={() => { logout(); navigate('/'); }} title={t('Đăng xuất')} aria-label={t('Đăng xuất')} className="hidden sm:flex size-9 items-center justify-center rounded-xl text-[#59665f] hover:bg-[#f5f7f3]">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to={loginTarget} className="flex h-9 sm:h-10 items-center rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[#17231d] hover:bg-[#f5f7f3]">{t('Đăng nhập')}</Link>
                <Link to="/dang-ky" className="hidden sm:flex h-9 sm:h-10 items-center rounded-xl border border-[#0f7a4f]/30 px-3 text-xs sm:text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]">{t('Đăng ký')}</Link>
              </div>
            )}

            <div className="hidden sm:block"><CartButton /></div>
            <div className="sm:hidden"><CartButton compact /></div>
          </div>
        </div>

        {/* TẦNG 2: Tất cả danh mục + Thanh tìm kiếm + Các nút tác vụ nhanh */}
        <div className="border-t border-[#17231d]/8 bg-white">
          <div className="mx-auto flex max-w-330 items-center gap-2.5 px-3 py-2 sm:px-5">
            {/* Nút Tất cả danh mục */}
            <button
              type="button"
              onClick={() => {
                setActiveCategorySlug(null);
                setMobileShowSub(false);
                setCategoryDrawerOpen(true);
              }}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#0f7a4f] px-3 sm:px-3.5 text-[13px] font-bold text-white shadow-xs transition hover:bg-[#0b4f34] whitespace-nowrap"
            >
              <LayoutGrid size={16} />
              <span className="hidden xs:inline sm:inline">{t('Tất cả danh mục')}</span>
              <span className="xs:hidden sm:hidden">{t('Danh mục')}</span>
              <ChevronDown size={15} />
            </button>

            {/* Thanh tìm kiếm thông minh ở giữa - Smart Search Popover kiểu Kamereo */}
            <SmartSearchBox className="flex-1 min-w-0" />

            {/* Nhóm nút tác vụ nhanh bên phải */}
            {session && (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <NavLink
                  to="/dat-hang"
                  end
                  className={({ isActive }) => `flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#e0742f] text-white shadow-xs'
                      : 'bg-[#fef5ee] text-[#c4601f] ring-1 ring-[#e0742f]/25 hover:bg-[#fde8d7]'
                  }`}
                >
                  <Zap size={15} />
                  <span>{t('Đặt nhanh')}</span>
                </NavLink>

                <NavLink
                  to="/gio-hang?excel=1"
                  className={() => {
                    const isExcelActive = location.pathname === '/gio-hang' && searchParams.get('excel') === '1';
                    return `flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold whitespace-nowrap transition ${
                      isExcelActive
                        ? 'bg-[#0f7a4f] text-white shadow-xs'
                        : 'bg-[#eaf6ef] text-[#0b4f34] ring-1 ring-[#0f7a4f]/25 hover:bg-[#dcefe4]'
                    }`;
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>{t('Đặt từ Excel')}</span>
                </NavLink>

                <NavLink
                  to="/don-hang"
                  className={({ isActive }) => `flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold whitespace-nowrap transition ${
                    isActive ? 'bg-[#17231d]/8 text-[#0f7a4f]' : 'text-[#2c3a33] hover:bg-[#f5f7f3]'
                  }`}
                >
                  <ClipboardList size={15} />
                  <span>{t('Đơn hàng')}</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SIDEBAR / DRAWER DANH MỤC 2 CỘT KIỂU KAMEREO */}
      {categoryDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity"
            onClick={() => setCategoryDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-row bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-200 max-h-screen"
            aria-label={t('Tất cả danh mục')}
          >
            {/* CỘT 1: Danh mục chính */}
            <div
              className={`w-67.5 sm:w-70 md:w-72.5 border-r border-[#17231d]/8 flex flex-col bg-white shrink-0 ${
                mobileShowSub ? 'hidden sm:flex' : 'flex'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#17231d]/8 bg-[#f8faf7] px-4 py-3 sm:px-5 sm:py-3.5">
                <img src={`${import.meta.env.BASE_URL}images/tps1-logo-horizontal.png`} alt="Thực Phẩm Số Một" className="h-8 w-auto object-contain" />
                <button
                  type="button"
                  onClick={() => setCategoryDrawerOpen(false)}
                  aria-label={t('Đóng')}
                  className="flex size-8 items-center justify-center rounded-full text-[#59665f] hover:bg-black/5 hover:text-[#17231d] sm:hidden"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                <Link
                  to={session ? '/dat-hang' : '/'}
                  onClick={() => setCategoryDrawerOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 transition rounded-xl mx-2 hover:bg-[#eaf6ef]/60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] text-[#d97706] ring-1 ring-amber-200/50">
                    <Flame size={18} />
                  </span>
                  <span className="flex-1 text-[14px] font-bold text-[#17231d] group-hover:text-[#0f7a4f]">
                    {t('Lựa chọn hàng đầu')}
                  </span>
                  <ChevronRight size={16} className="text-[#8a9690] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0f7a4f]" />
                </Link>

                {(home?.categories || []).map((cat) => {
                  const isActive = activeCategorySlug === cat.slug;
                  const hasSub = Boolean(cat.productCategories && cat.productCategories.length > 1);
                  return (
                    <Link
                      key={cat.slug}
                      to={`/danh-muc/${cat.slug}`}
                      onClick={(e) => {
                        if (window.innerWidth < 640 && hasSub) {
                          e.preventDefault();
                          setActiveCategorySlug(cat.slug);
                          setMobileShowSub(true);
                        } else {
                          setCategoryDrawerOpen(false);
                        }
                      }}
                      onMouseEnter={() => {
                        if (window.innerWidth >= 640) {
                          if (hasSub) {
                            setActiveCategorySlug(cat.slug);
                          } else {
                            setActiveCategorySlug(null);
                          }
                        }
                      }}
                      className={`group flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 transition rounded-xl mx-2 my-0.5 ${
                        isActive
                          ? 'bg-[#eaf6ef] text-[#0f7a4f] font-bold'
                          : 'hover:bg-[#eaf6ef]/60 text-[#17231d]'
                      }`}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f6f2] ring-1 ring-black/5">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <PackageOpen size={18} className="text-[#0f7a4f]/50" />
                        )}
                      </span>
                      <span className="flex-1 text-[13.5px] sm:text-[14px] font-semibold group-hover:text-[#0f7a4f]">
                        {t(cat.name)}
                      </span>
                      {hasSub ? (
                        <ChevronRight
                          size={16}
                          className={`transition-transform group-hover:translate-x-0.5 ${
                            isActive ? 'text-[#0f7a4f]' : 'text-[#8a9690] group-hover:text-[#0f7a4f]'
                          }`}
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-[#8a9690]/60 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* CỘT 2: Danh mục con (Chỉ hiện khi danh mục đang chọn có nhóm nhỏ thực tế) */}
            {hasActiveSub && activeCategory && (
              <div
                className={`w-full sm:w-80 md:w-90 flex flex-col bg-white shrink-0 ${
                  mobileShowSub ? 'flex' : 'hidden sm:flex'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#17231d]/8 bg-[#f8faf7] px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileShowSub(false)}
                      className="flex items-center gap-1 text-xs font-bold text-[#59665f] hover:text-[#0f7a4f] sm:hidden"
                    >
                      <ChevronLeft size={16} />
                      <span>{t('Quay lại')}</span>
                    </button>
                    <h3 className="truncate text-sm sm:text-base font-bold text-[#17231d]">
                      {t(activeCategory.name)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                      to={`/danh-muc/${activeCategory.slug}`}
                      onClick={() => setCategoryDrawerOpen(false)}
                      className="text-xs sm:text-[13px] font-bold text-[#0f7a4f] hover:underline whitespace-nowrap"
                    >
                      {t('Xem tất cả')} →
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCategoryDrawerOpen(false)}
                      aria-label={t('Đóng')}
                      className="flex size-8 items-center justify-center rounded-full text-[#59665f] hover:bg-black/5 hover:text-[#17231d]"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-5 sm:gap-y-6">
                    {/* Ô Tất cả danh mục này */}
                    <Link
                      to={`/danh-muc/${activeCategory.slug}`}
                      onClick={() => setCategoryDrawerOpen(false)}
                      className="group flex flex-col items-center text-center"
                    >
                      <div className="flex size-20 sm:size-24 items-center justify-center overflow-hidden rounded-full p-2.5 sm:p-3 transition duration-200 group-hover:scale-105 shadow-xs ring-1 ring-black/5 bg-[#f3f6f2]">
                        {activeCategory.imageUrl ? (
                          <img src={activeCategory.imageUrl} alt={activeCategory.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <PackageOpen size={28} className="text-[#0f7a4f]/50" />
                        )}
                      </div>
                      <span className="mt-2 text-[12.5px] sm:text-[13.5px] font-bold leading-snug text-[#17231d] group-hover:text-[#0f7a4f]">
                        {t(`Tất cả ${activeCategory.name}`)}
                      </span>
                    </Link>

                    {/* Các nhóm nhỏ thực tế từ API */}
                    {subCategories.map((subName) => {
                      const meta = SUB_CATEGORY_META[subName];
                      const imageUrl = meta?.imageUrl || activeCategory.imageUrl;
                      const bgClass = meta?.bgClass || 'bg-[#f3f6f2]';
                      return (
                        <Link
                          key={subName}
                          to={`/danh-muc/${activeCategory.slug}?nhom=${encodeURIComponent(subName)}`}
                          onClick={() => setCategoryDrawerOpen(false)}
                          className="group flex flex-col items-center text-center"
                        >
                          <div className={`flex size-20 sm:size-24 items-center justify-center overflow-hidden rounded-full p-2.5 sm:p-3 transition duration-200 group-hover:scale-105 shadow-xs ring-1 ring-black/5 ${bgClass}`}>
                            {imageUrl ? (
                              <img src={imageUrl} alt={subName} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              <PackageOpen size={28} className="text-[#0f7a4f]/50" />
                            )}
                          </div>
                          <span className="mt-2 text-[12.5px] sm:text-[13.5px] font-bold leading-snug text-[#17231d] group-hover:text-[#0f7a4f]">
                            {t(subName)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-330 min-w-0 flex-1 px-3 py-4 pb-28 sm:px-5 md:pb-8">
        {session?.verificationStatus === 'pending' && (
          <div role="status" className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            {t('Tài khoản của quý khách đang chờ TPS1 xác minh. Quý khách vẫn đặt hàng bình thường, giá sẽ được xác nhận khi chốt đơn.')}
          </div>
        )}
        <Outlet />
      </main>

      <footer className="hidden border-t border-[#17231d]/8 bg-white md:block">
        <div className="mx-auto grid max-w-330 gap-6 px-5 py-8 text-sm text-[#59665f] md:grid-cols-3">
          <div>
            <img src={`${import.meta.env.BASE_URL}images/tps1-logo-horizontal.png`} alt="Thực Phẩm Số Một" className="h-9 w-auto" />
            <p className="mt-3">{t('Đồng hành cùng nhà hàng, bếp ăn công ty và trường học tại Đồng Nai, TP.HCM và các tỉnh lân cận, đưa thực phẩm tươi đến tận bếp.')}</p>
          </div>
          <div>
            <p className="font-bold text-[#17231d]">{t('Liên hệ')}</p>
            <p className="mt-2">{t('Tổng đài đặt hàng')}: <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="font-bold text-[#0f7a4f]">{HOTLINE}</a></p>
            <p>Email: <a href="mailto:contact@thucphamsomot.vn" className="text-[#0f7a4f]">contact@thucphamsomot.vn</a></p>
          </div>
          <div>
            <p className="font-bold text-[#17231d]">{t('Về Thực Phẩm Số Một')}</p>
            <p className="mt-2"><a href="https://thucphamsomot.vn/gioi-thieu" className="hover:text-[#0f7a4f]">{t('Giới thiệu công ty')}</a></p>
            <p><a href="https://thucphamsomot.vn/quy-trinh" className="hover:text-[#0f7a4f]">{t('Quy trình giao nhận')}</a></p>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#17231d]/10 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-lg md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label={t('Điều hướng chính')}>
        <div className="grid grid-cols-5">
          {bottomTabs.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={label} to={to} end={end} className={({ isActive }) => `flex h-15 flex-col items-center justify-center gap-0.5 text-[10.5px] ${isActive ? 'font-bold text-[#0f7a4f]' : 'font-medium text-[#59665f]'}`}>
              {({ isActive }) => {
                const isFavTab = label === 'Yêu thích';
                const hasFavs = favoriteIds.length > 0;
                return (
                  <>
                    <span className={`relative flex h-7 w-10 items-center justify-center rounded-full ${isActive ? 'bg-[#0f7a4f]/12' : ''}`}>
                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isFavTab && hasFavs ? 'fill-rose-500 text-rose-500' : ''}
                      />
                      {Boolean(badge) && (
                        <span className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full ${isFavTab ? 'bg-rose-500' : 'bg-[#e0742f]'} px-1 text-[10px] font-black text-white ring-2 ring-white`}>
                          {badge! > 99 ? '99+' : badge}
                        </span>
                      )}
                    </span>
                    <span className="truncate whitespace-nowrap px-0.5">{t(label)}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </div>
      </nav>

      <InstallBanner />
    </div>
  );
}
