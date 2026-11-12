import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ClipboardList, FileSpreadsheet, Flame, Heart, RotateCcw, ShieldCheck, Sparkles, Truck, Zap } from 'lucide-react';
import { api, type FrequentItem, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import BannerCarousel from '../components/store/BannerCarousel';
import CategoryRail from '../components/store/CategoryRail';
import ProductRail from '../components/store/ProductRail';

function frequentToProduct(item: FrequentItem): Product {
  return {
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
  };
}

function RailSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-[#17231d]/6">
      <div className="mb-4 h-6 w-48 animate-pulse rounded-lg bg-[#eef2ee]" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[46%] shrink-0 sm:w-[31%] md:w-[23%] lg:w-[15.8%]">
            <div className="aspect-square animate-pulse rounded-2xl bg-[#eef2ee]" />
            <div className="mt-2 h-4 animate-pulse rounded bg-[#eef2ee]" />
            <div className="mt-2 h-9 animate-pulse rounded-xl bg-[#eef2ee]" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TRUST = [
  { icon: ShieldCheck, title: 'ISO 22000 & HACCP', text: 'Kiểm soát an toàn từng khâu' },
  { icon: Truck, title: 'Xe lạnh giao tận bếp', text: 'Đồng Nai, TP.HCM và lân cận' },
  { icon: BadgeCheck, title: 'Hóa đơn VAT đầy đủ', text: 'Công nợ theo thỏa thuận' },
  { icon: Zap, title: 'Hơn 5.000 mặt hàng', text: 'Cả bếp chỉ cần đặt một nơi' },
];

export default function StoreHomePage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { data, error, loading } = useStoreHome();
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [frequent, setFrequent] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    api.storeRecommendations(controller.signal)
      .then((res) => setRecommended(res.products || []))
      .catch(() => undefined);
    if (session?.id) {
      api.frequentItems(controller.signal)
        .then((res) => setFrequent((res.items || []).slice(0, 12).map(frequentToProduct)))
        .catch(() => undefined);
    } else {
      setFrequent([]);
    }
    return () => controller.abort();
  }, [session?.id]);

  // Hàng hay đặt đã có khối riêng → bỏ khỏi gợi ý để không trùng lặp.
  const recommendedOnly = useMemo(() => {
    const seen = new Set(frequent.map((p) => p.id));
    return recommended.filter((p) => !seen.has(p.id));
  }, [recommended, frequent]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <BannerCarousel banners={data?.banners || []} />
        <aside className="hidden flex-col gap-3 lg:flex">
          {session ? (
            <div className="flex flex-1 flex-col justify-between rounded-3xl bg-white p-5 ring-1 ring-[#17231d]/6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#59665f]">{t('Xin chào')}</p>
                <p className="mt-1 line-clamp-2 text-lg font-black text-[#17231d]">{session.company || session.name}</p>
                <p className="mt-1 text-xs text-[#59665f]">{t('Giá trên cửa hàng đã là giá hợp đồng của quý khách.')}</p>
              </div>
              <div className="mt-4 grid gap-2">
                <Link to="/dat-hang" className="flex h-11 items-center gap-2 rounded-xl bg-[#0f7a4f] px-4 text-sm font-bold text-white hover:bg-[#0b4f34]"><RotateCcw size={16} /> {t('Đặt nhanh hoặc đặt lại đơn cũ')}</Link>
                <Link to="/dat-hang/excel" className="flex h-11 items-center gap-2 rounded-xl border border-[#0f7a4f]/25 px-4 text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]"><FileSpreadsheet size={16} /> {t('Đặt hàng từ file Excel')}</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between rounded-3xl bg-gradient-to-br from-[#fef5ee] to-white p-5 ring-1 ring-[#e0742f]/15">
              <div>
                <p className="text-lg font-black leading-snug text-[#17231d]">{t('Giá riêng cho bếp của quý khách')}</p>
                <p className="mt-2 text-sm text-[#59665f]">{t('Đăng ký tài khoản miễn phí để xem đúng giá hợp đồng, gửi đơn bằng file Excel và biết đơn đang giao tới đâu.')}</p>
              </div>
              <div className="mt-4 grid gap-2">
                <Link to="/dat-hang/excel" className="flex items-center gap-1.5 text-xs font-bold text-[#0f7a4f] hover:underline"><FileSpreadsheet size={14} /> {t('Đặt hàng từ file Excel')}</Link>
                <Link to="/dang-ky" className="flex h-11 items-center justify-center rounded-xl bg-[#e0742f] px-4 text-sm font-bold text-white hover:bg-[#c4601f]">{t('Đăng ký tài khoản')}</Link>
                <Link to="/dang-nhap" className="flex h-11 items-center justify-center rounded-xl border border-[#17231d]/12 bg-white px-4 text-sm font-bold text-[#17231d] hover:bg-[#f5f7f3]">{t('Đăng nhập')}</Link>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Lối tắt trên điện thoại/tablet (máy tính đã có khung bên cạnh banner và thanh menu). */}
      {session ? (
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          {[
            { to: '/dat-hang', icon: RotateCcw, label: 'Đặt nhanh' },
            { to: '/dat-hang/excel', icon: FileSpreadsheet, label: 'Đặt từ Excel' },
            { to: '/don-hang', icon: ClipboardList, label: 'Đơn hàng' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center text-[12.5px] font-bold text-[#0b4f34] ring-1 ring-[#17231d]/6 active:scale-[0.98]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#0f7a4f]"><Icon size={20} /></span>
              {t(label)}
            </Link>
          ))}
        </div>
      ) : null}
      <Link to="/dat-hang/excel" className={`items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#0f7a4f]/15 active:scale-[0.99] ${session ? 'hidden' : 'flex lg:hidden'}`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#0f7a4f]"><FileSpreadsheet size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#17231d]">{t('Có sẵn danh sách hàng trong file Excel?')}</span>
          <span className="block text-xs text-[#59665f]">{t('Tải file lên, hệ thống tự khớp mặt hàng và đưa vào giỏ cho quý khách.')}</span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-[#0f7a4f]" />
      </Link>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-[#17231d]/6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#0f7a4f]"><Icon size={20} /></span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#17231d]">{t(title)}</p>
              <p className="truncate text-[11.5px] text-[#59665f]">{t(text)}</p>
            </div>
          </div>
        ))}
      </div>

      {data && data.categories.length > 0 && (
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#17231d]/6 sm:p-5">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-black text-[#17231d] sm:text-xl">{t('Danh mục hàng hóa')}</h2>
            <Link to="/danh-muc" className="text-sm font-bold text-[#0f7a4f] hover:underline">{t('Xem tất cả')}</Link>
          </div>
          <CategoryRail categories={data.categories} />
        </section>
      )}

      {frequent.length > 0 && (
        <ProductRail title="Những món quý khách hay đặt" subtitle="Thêm lại vào giỏ chỉ với một lần bấm" products={frequent} icon={<Heart size={20} className="text-[#e0742f]" />} moreTo="/dat-hang" />
      )}

      {loading && <><RailSkeleton /><RailSkeleton /></>}
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
            ? <Flame size={20} className="text-[#e0742f]" />
            : collection.source === 'new_arrivals'
              ? <Sparkles size={20} className="text-[#0f7a4f]" />
              : undefined}
        />
      ))}

      <ProductRail
        title={session ? 'Gợi ý dành riêng cho bếp của quý khách' : 'Được nhiều bếp ăn tin chọn'}
        subtitle={session ? 'Dựa trên những mặt hàng bếp của quý khách vẫn thường dùng' : 'Những mặt hàng các bếp ăn khác thường chọn'}
        products={recommendedOnly}
        icon={<Sparkles size={20} className="text-[#0f7a4f]" />}
      />
    </div>
  );
}
