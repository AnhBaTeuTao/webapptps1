import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import type { StoreBanner } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

function isInternal(url: string) {
  return url.startsWith('/');
}

/** Khung thương hiệu khi admin chưa thêm banner: gọn trên điện thoại để gian hàng hiện sớm. */
function BrandHero() {
  const { session } = useAuth();
  const { t } = useLanguage();

  const handleStartShopping = (e: MouseEvent) => {
    if (!session) {
      const el = document.getElementById('store-home-catalog');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#0b4f34] text-white sm:rounded-3xl">
      <img src={`${import.meta.env.BASE_URL}images/store-hero.webp`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-linear-to-r from-[#062b1c] via-[#0b4f34]/90 to-transparent" />
      <div className="relative max-w-160 px-4 py-4 sm:px-7 sm:py-6">
        <p className="hidden items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-white/20 sm:inline-flex">
          <BadgeCheck size={14} /> {t('Đạt chuẩn ISO 22000 & HACCP')}
        </p>
        <h1 className="text-balance text-[18px] sm:text-[22px] lg:text-[26px] font-black leading-[1.28] sm:mt-2.5">
          <span>{t('Nguồn thực phẩm sạch cho')}</span> <span className="inline-block">{t('bếp ăn,')}</span>{' '}
          <span>{t('giao')}</span> <span className="inline-block">{t('tận nơi')}</span> <span>{t('theo nhu cầu của bếp.')}</span>
        </h1>
        <p className="mt-2 hidden max-w-130 text-pretty text-[13.5px] leading-relaxed text-emerald-50/85 sm:block">
          {t('Hơn 5.000 mặt hàng, từ rau củ, thịt cá đến gia vị và đồ khô, để bếp của quý khách chỉ cần đặt hàng')} <span className="inline-block">{t('một nơi.')}</span>
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-[12px] font-medium text-emerald-100/90">
          <span className="inline-flex items-center gap-1">✓ {t('Chuẩn ISO 22000 & HACCP')}</span>
          <span className="inline-flex items-center gap-1">✓ {t('Hơn 5.000+ mặt hàng sẵn có')}</span>
          <span className="inline-flex items-center gap-1">✓ {t('Giao đúng hẹn 99,8% ca sáng')}</span>
        </div>
        <Link
          to={session ? '/dat-hang' : '#store-home-catalog'}
          onClick={handleStartShopping}
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#e0742f] px-5 text-[13px] font-bold text-white whitespace-nowrap shadow-lg shadow-black/20 hover:bg-[#c4601f] sm:mt-4 sm:text-sm"
        >
          <span>{t('Bắt đầu chọn hàng')}</span> <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

/**
 * Banner dạng slide do admin bán hàng quản lý (bảng store_banners): vuốt
 * ngang trên điện thoại (hé slide kế tiếp), tự chuyển sau vài giây.
 */
export default function BannerCarousel({ banners }: { banners: StoreBanner[] }) {
  const { t } = useLanguage();
  const row = useRef<HTMLDivElement>(null);
  useHorizontalScroll(row);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const goTo = (i: number) => {
    const el = row.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      if (!paused.current) goTo((index + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length, index]);

  if (banners.length === 0) return <BrandHero />;

  const onScroll = () => {
    const el = row.current;
    if (!el) return;
    const width = (el.children[0] as HTMLElement | undefined)?.offsetWidth || el.clientWidth;
    setIndex(Math.min(banners.length - 1, Math.round(el.scrollLeft / width)));
  };

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; }}
    >
      <div ref={row} onScroll={onScroll} className="tps1-snap-row -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 lg:mx-0 lg:gap-0 lg:px-0 overscroll-contain select-none cursor-grab">
        {banners.map((banner) => {
          const image = (
            <picture className="block aspect-[2/1] w-full overflow-hidden rounded-2xl bg-[#eaf6ef] lg:aspect-[3/1] lg:rounded-2xl">
              <source media="(max-width: 1023px)" srcSet={banner.imageMobileUrl} />
              <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" draggable={false} />
            </picture>
          );
          return (
            <div key={banner.id} className={`shrink-0 snap-start ${banners.length > 1 ? 'w-[88%] sm:w-[70%]' : 'w-full'} lg:w-full`}>
              {banner.linkUrl ? (
                isInternal(banner.linkUrl)
                  ? <Link to={banner.linkUrl} aria-label={banner.title}>{image}</Link>
                  : <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" aria-label={banner.title}>{image}</a>
              ) : image}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5 lg:absolute lg:inset-x-0 lg:bottom-3 lg:mt-0">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`${t('Banner')} ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-[#0f7a4f] lg:bg-white' : 'w-1.5 bg-[#0f7a4f]/30 lg:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
