import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import type { StoreBanner } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function isInternal(url: string) {
  return url.startsWith('/');
}

/** Khung thương hiệu khi admin chưa thêm banner: gọn trên điện thoại để gian hàng hiện sớm. */
function BrandHero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#0b4f34] text-white sm:rounded-3xl">
      <img src={`${import.meta.env.BASE_URL}images/store-hero.webp`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#062b1c] via-[#0b4f34]/90 to-transparent" />
      <div className="relative max-w-[680px] px-4 py-4 sm:px-8 sm:py-8">
        <p className="hidden items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-white/20 sm:inline-flex">
          <BadgeCheck size={14} /> {t('Đạt chuẩn ISO 22000 & HACCP')}
        </p>
        <h1 className="text-balance text-[18px] font-black leading-[1.25] sm:mt-3 sm:text-[28px] lg:text-[32px]">
          <span className="sm:block sm:whitespace-nowrap">{t('Nguồn thực phẩm sạch cho bếp ăn,')}</span>{' '}
          <span className="sm:block sm:whitespace-nowrap">{t('giao tận nơi theo nhu cầu của bếp.')}</span>
        </h1>
        <p className="mt-2.5 hidden max-w-[540px] text-pretty text-sm leading-relaxed text-emerald-50/85 sm:block lg:text-[15px]">
          {t('Hơn 5.000 mặt hàng, từ rau củ, thịt cá đến gia vị và đồ khô, để bếp của quý khách chỉ cần đặt hàng một nơi.')}
        </p>
        <Link to="/danh-muc" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#e0742f] px-4 text-[13px] font-bold text-white shadow-lg shadow-black/20 hover:bg-[#c4601f] sm:mt-5 sm:h-11 sm:px-5 sm:text-sm">
          {t('Bắt đầu chọn hàng')} <ArrowRight size={16} />
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
      <div ref={row} onScroll={onScroll} className="tps1-snap-row -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 lg:mx-0 lg:gap-0 lg:px-0">
        {banners.map((banner) => {
          const image = (
            <picture className="block aspect-[2/1] w-full overflow-hidden rounded-2xl bg-[#eaf6ef] lg:aspect-[21/8] lg:rounded-3xl">
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
