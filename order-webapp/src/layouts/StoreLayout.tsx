import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, FileSpreadsheet, Home, LayoutGrid, LogOut, Phone, Search, ShoppingCart, UserCircle2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { LanguageSwitcher, useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import NotificationBell from '../components/NotificationBell';

const HOTLINE = '089 890 2222';

function SearchBox({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { t } = useLanguage();
  const [value, setValue] = useState(location.pathname === '/tim-kiem' ? params.get('q') || '' : '');
  useEffect(() => {
    if (location.pathname !== '/tim-kiem') setValue('');
  }, [location.pathname]);

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) navigate(`/tim-kiem?q=${encodeURIComponent(q)}`);
      }}
    >
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9690]" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('Tìm rau củ, thịt cá, gia vị...')}
        aria-label={t('Tìm sản phẩm')}
        enterKeyHint="search"
        className="h-11 w-full rounded-xl border border-[#17231d]/12 bg-[#f5f7f3] pl-10 pr-24 text-sm text-[#17231d] placeholder:text-[#8a9690] focus:border-[#0f7a4f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f7a4f]/15"
      />
      <button type="submit" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-[#0f7a4f] px-4 text-xs font-bold text-white hover:bg-[#0b4f34]">
        {t('Tìm')}
      </button>
    </form>
  );
}

function CartButton({ compact = false }: { compact?: boolean }) {
  const { count } = useCart();
  const { t } = useLanguage();
  return (
    <Link to="/gio-hang" aria-label={`${t('Giỏ hàng')} (${count})`} className={`relative inline-flex items-center gap-2 rounded-xl ${compact ? 'size-10 justify-center' : 'h-11 px-3.5'} bg-[#0f7a4f] text-white hover:bg-[#0b4f34]`}>
      <ShoppingCart size={19} />
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: home } = useStoreHome();
  const location = useLocation();
  const loginTarget = `/dang-nhap?quay-lai=${encodeURIComponent(location.pathname + location.search)}`;

  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  const bottomTabs = [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/danh-muc', label: 'Danh mục', icon: LayoutGrid },
    { to: '/don-hang', label: 'Đơn hàng', icon: ClipboardList },
    { to: '/gio-hang', label: 'Giỏ hàng', icon: ShoppingCart, badge: count },
    { to: session ? '/tai-khoan' : loginTarget, label: session ? 'Tài khoản' : 'Đăng nhập', icon: UserCircle2 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f3] selection:bg-[#0f7a4f] selection:text-white">
      <header className="sticky top-0 z-30 border-b border-[#17231d]/8 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-3 py-2.5 sm:px-5 lg:gap-6">
          <Link to="/" className="shrink-0" aria-label="Thực Phẩm Số Một">
            <img src={`${import.meta.env.BASE_URL}images/tps1-logo-horizontal.png`} alt="Thực Phẩm Số Một" className="h-9 w-auto object-contain sm:h-10" />
          </Link>

          <SearchBox className="hidden flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="hidden items-center gap-2 rounded-xl px-2.5 py-1.5 text-[#17231d] hover:bg-[#f5f7f3] xl:flex" title={t('Tổng đài đặt hàng')}>
              <span className="flex size-9 items-center justify-center rounded-full bg-[#fef5ee] text-[#e0742f]"><Phone size={16} /></span>
              <span className="leading-tight"><span className="block text-[10.5px] font-semibold text-[#59665f]">{t('Tổng đài đặt hàng')}</span><span className="text-sm font-black">{HOTLINE}</span></span>
            </a>
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            {session && <NotificationBell light />}
            {session ? (
              <div className="hidden items-center gap-1 md:flex">
                <Link to="/tai-khoan" className="flex h-11 items-center gap-2 rounded-xl px-2.5 hover:bg-[#f5f7f3]">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#eaf6ef] text-sm font-black text-[#0f7a4f]">{(session.company || session.name || 'K').trim().charAt(0).toUpperCase()}</span>
                  <span className="max-w-[140px] truncate text-sm font-semibold text-[#17231d]">{session.company || session.name}</span>
                </Link>
                <button type="button" onClick={() => { logout(); navigate('/'); }} title={t('Đăng xuất')} aria-label={t('Đăng xuất')} className="flex size-10 items-center justify-center rounded-xl text-[#59665f] hover:bg-[#f5f7f3]">
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to={loginTarget} className="flex h-11 items-center rounded-xl px-3.5 text-sm font-bold text-[#17231d] hover:bg-[#f5f7f3]">{t('Đăng nhập')}</Link>
                <Link to="/dang-ky" className="flex h-11 items-center rounded-xl border border-[#0f7a4f]/30 px-3.5 text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]">{t('Đăng ký')}</Link>
              </div>
            )}
            <div className="hidden md:block"><CartButton /></div>
            <div className="md:hidden"><CartButton compact /></div>
          </div>
        </div>

        <div className="px-3 pb-2.5 md:hidden"><SearchBox /></div>

        <nav className="hidden border-t border-[#17231d]/6 md:block" aria-label={t('Danh mục hàng hóa')}>
          <div className="no-scrollbar mx-auto flex max-w-[1320px] items-center gap-1 overflow-x-auto px-3 py-1.5 sm:px-5">
            <NavLink to="/danh-muc" end className={({ isActive }) => `flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold ${isActive ? 'bg-[#0f7a4f] text-white' : 'bg-[#eaf6ef] text-[#0b4f34] hover:bg-[#dcefe4]'}`}>
              <LayoutGrid size={15} /> {t('Tất cả danh mục')}
            </NavLink>
            {(home?.categories || []).slice(0, 9).map((category) => (
              <NavLink key={category.slug} to={`/danh-muc/${category.slug}`} className={({ isActive }) => `flex h-9 shrink-0 items-center rounded-lg px-3 text-[13px] font-semibold ${isActive ? 'text-[#0f7a4f]' : 'text-[#2c3a33] hover:text-[#0f7a4f]'}`}>
                {t(category.name)}
              </NavLink>
            ))}
            <span className="ml-auto" />
            {session && (
              <>
                <NavLink to="/dat-hang" className={({ isActive }) => `flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold ${isActive ? 'text-[#0f7a4f]' : 'text-[#c4601f] hover:text-[#0f7a4f]'}`}><Zap size={15} /> {t('Đặt nhanh')}</NavLink>
                <NavLink to="/dat-hang/excel" className={({ isActive }) => `flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold ${isActive ? 'text-[#0f7a4f]' : 'text-[#2c3a33] hover:text-[#0f7a4f]'}`}><FileSpreadsheet size={15} /> {t('Đặt từ Excel')}</NavLink>
                <NavLink to="/don-hang" className={({ isActive }) => `flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold ${isActive ? 'text-[#0f7a4f]' : 'text-[#2c3a33] hover:text-[#0f7a4f]'}`}><ClipboardList size={15} /> {t('Đơn hàng')}</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-3 py-4 pb-28 sm:px-5 md:pb-8">
        {session?.verificationStatus === 'pending' && (
          <div role="status" className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            {t('Tài khoản của quý khách đang chờ TPS1 xác minh. Quý khách vẫn đặt hàng bình thường, giá sẽ được xác nhận khi chốt đơn.')}
          </div>
        )}
        <Outlet />
      </main>

      <footer className="hidden border-t border-[#17231d]/8 bg-white md:block">
        <div className="mx-auto grid max-w-[1320px] gap-6 px-5 py-8 text-sm text-[#59665f] md:grid-cols-3">
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
            <NavLink key={label} to={to} end={end} className={({ isActive }) => `flex h-[60px] flex-col items-center justify-center gap-0.5 text-[10.5px] ${isActive ? 'font-bold text-[#0f7a4f]' : 'font-medium text-[#59665f]'}`}>
              {({ isActive }) => (
                <>
                  <span className={`relative flex h-7 w-10 items-center justify-center rounded-full ${isActive ? 'bg-[#0f7a4f]/12' : ''}`}>
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    {Boolean(badge) && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e0742f] px-1 text-[10px] font-black text-white">{badge! > 99 ? '99+' : badge}</span>}
                  </span>
                  <span>{t(label)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
