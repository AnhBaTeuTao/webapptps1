import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import StoreProductCard from './StoreProductCard';

/** Khối sản phẩm trượt ngang (bộ sưu tập, gợi ý, hàng hay đặt). */
export default function ProductRail({
  title,
  subtitle,
  products,
  moreTo,
  icon,
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  moreTo?: string;
  icon?: ReactNode;
}) {
  const { t } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
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
            <Link to={moreTo} className="text-sm font-bold text-[#0f7a4f] hover:underline">
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
      <div ref={scroller} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:gap-2.5">
        {products.map((product) => (
          <div key={product.id} className="w-[36%] shrink-0 snap-start sm:w-[23%] md:w-[18.5%] lg:w-[15.5%] xl:w-[13.4%]">
            <StoreProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
