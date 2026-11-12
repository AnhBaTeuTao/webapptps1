import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Clock3, Truck } from 'lucide-react';
import type { StoreBanner } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function isInternal(url: string) {
  return url.startsWith('/');
}

/** Banner trượt; khi admin chưa thêm banner thì hiện banner thương hiệu mặc định. */
export default function BannerCarousel({ banners }: { banners: StoreBanner[] }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), 5500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-[#0b4f34] text-white">
        <img
          src={`${import.meta.env.BASE_URL}images/store-hero.webp`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062b1c] via-[#0b4f34]/90 to-transparent" />
        <div className="relative max-w-[680px] px-5 py-7 sm:px-8 sm:py-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-white/20">
            <BadgeCheck size={14} /> {t('Đạt chuẩn ISO 22000 & HACCP')}
          </p>
          {/* Mỗi vế của tiêu đề một dòng từ tablet trở lên; cỡ chữ theo bề ngang để không tràn khung. */}
          <h1 className="mt-3 text-balance text-[22px] font-black leading-[1.25] sm:text-[28px] lg:text-[32px]">
            <span className="sm:block sm:whitespace-nowrap">{t('Nguồn thực phẩm sạch cho bếp ăn,')}</span>{' '}
            <span className="sm:block sm:whitespace-nowrap">{t('giao tận nơi theo nhu cầu của bếp.')}</span>
          </h1>
          <p className="mt-2.5 max-w-[540px] text-pretty text-[13.5px] leading-relaxed text-emerald-50/85 sm:text-sm lg:text-[15px]">
            {t('Hơn 5.000 mặt hàng, từ rau củ, thịt cá đến gia vị và đồ khô, để bếp của quý khách chỉ cần đặt hàng một nơi.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-emerald-50/90">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1.5"><Truck size={14} /> {t('Xe lạnh giao tận bếp')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1.5"><Clock3 size={14} /> {t('Giao từ 5 giờ sáng')}</span>
          </div>
          <Link to="/danh-muc" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#e0742f] px-5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-[#c4601f]">
            {t('Bắt đầu chọn hàng')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#eaf6ef]" aria-roledescription="carousel">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((banner) => {
          const image = (
            <picture className="block aspect-[16/9] w-full sm:aspect-[21/7]">
              <source media="(max-width: 639px)" srcSet={banner.imageMobileUrl} />
              <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
            </picture>
          );
          return (
            <div key={banner.id} className="w-full shrink-0">
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
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`${t('Banner')} ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
