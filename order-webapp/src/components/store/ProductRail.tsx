import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import StoreProductCard from './StoreProductCard';

/** Khối sản phẩm trượt ngang (bộ sưu tập, gợi ý, hàng hay đặt). */
export default function ProductRail({
  title,
  subtitle,
  products,
  moreTo,
  icon,
  autoScroll = true,
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  moreTo?: string;
  icon?: ReactNode;
  autoScroll?: boolean;
}) {
  const { t } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  useHorizontalScroll(scroller);

  const posRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<number | undefined>(undefined);

  const pauseAutoScroll = () => {
    pausedRef.current = true;
    window.clearTimeout(resumeTimerRef.current);
    const el = scroller.current;
    if (el) posRef.current = el.scrollLeft;
  };

  const resumeAutoScroll = (delay = 1200) => {
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      const el = scroller.current;
      if (el) posRef.current = el.scrollLeft;
      pausedRef.current = false;
    }, delay);
  };

  useEffect(() => {
    if (!autoScroll || products.length === 0) return;
    const el = scroller.current;
    if (!el) return;

    posRef.current = el.scrollLeft;
    let lastTime: number | null = null;
    let rafId: number;
    const SPEED = 26; // Tốc độ trôi êm ái: ~26px / giây

    const tick = (now: number) => {
      if (lastTime === null) lastTime = now;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!pausedRef.current && el) {
        const width = el.getBoundingClientRect().width;
        const maxScrollLeft = el.scrollWidth - width;

        if (maxScrollLeft > 5) {
          posRef.current += dirRef.current * SPEED * dt;

          if (posRef.current >= maxScrollLeft - 1) {
            posRef.current = maxScrollLeft - 1;
            dirRef.current = -1;
          } else if (posRef.current <= 1) {
            posRef.current = 1;
            dirRef.current = 1;
          }

          el.scrollLeft = Math.round(posRef.current);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(resumeTimerRef.current);
    };
  }, [autoScroll, products.length]);

  if (products.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    pauseAutoScroll();
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
    resumeAutoScroll(2000);
  };

  return (
    <section className="rounded-2xl bg-white p-3 ring-1 ring-[#17231d]/6 sm:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-base font-black text-[#17231d] sm:text-lg">
            {icon}
            <span className="truncate">{t(title)}</span>
          </h2>
          {subtitle && <p className="line-clamp-1 hidden text-xs text-[#59665f] sm:block">{t(subtitle)}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {moreTo && (
            <Link to={moreTo} className="whitespace-nowrap text-xs sm:text-sm font-bold text-[#0f7a4f] hover:underline">
              {t('Xem tất cả')}
            </Link>
          )}
          <div className="hidden gap-1.5 md:flex">
            <button type="button" aria-label={t('Trước')} onClick={() => scrollBy(-1)} className="flex size-9 items-center justify-center rounded-full border border-[#17231d]/10 bg-white text-[#17231d] hover:bg-[#f5f7f3]">
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label={t('Sau')} onClick={() => scrollBy(1)} className="flex size-9 items-center justify-center rounded-full border border-[#17231d]/10 bg-white text-[#17231d] hover:bg-[#f5f7f3]">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scroller}
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={() => resumeAutoScroll(1200)}
        onPointerDown={pauseAutoScroll}
        onPointerUp={() => resumeAutoScroll(1200)}
        onTouchStart={pauseAutoScroll}
        onTouchEnd={() => resumeAutoScroll(1200)}
        onWheel={pauseAutoScroll}
        className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:gap-2.5 overscroll-contain select-none cursor-grab"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[42%] shrink-0 sm:w-[23%] md:w-[18.5%] lg:w-[15.5%] xl:w-[13.4%]">
            <StoreProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
