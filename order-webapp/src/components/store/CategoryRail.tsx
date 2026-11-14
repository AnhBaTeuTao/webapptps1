import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import type { StoreCategory } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

function CategoryImage({ category }: { category: StoreCategory }) {
  const [failed, setFailed] = useState(false);
  return category.imageUrl && !failed ? (
    <img src={category.imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
  ) : (
    <PackageOpen size={26} className="text-[#0f7a4f]/50" />
  );
}

/** Danh mục có ảnh: hàng trượt ngang trên mobile, lưới trên desktop. */
export default function CategoryRail({ categories, layout = 'rail' }: { categories: StoreCategory[]; layout?: 'rail' | 'grid' }) {
  const { t } = useLanguage();
  const railRef = useHorizontalScroll<HTMLDivElement>();
  if (categories.length === 0) return null;
  const wrapper = layout === 'grid'
    ? 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5'
    : 'no-scrollbar flex gap-1.5 sm:gap-3 overflow-x-auto pb-0.5 lg:grid lg:grid-cols-10 lg:overflow-visible overscroll-contain select-none cursor-grab snap-x snap-mandatory';

  return (
    <div ref={layout === 'rail' ? railRef : undefined} className={wrapper}>
      {categories.map((category) => (
        <Link
          key={category.slug}
          to={`/danh-muc/${category.slug}`}
          className={`group flex flex-col items-center gap-1.5 text-center ${layout === 'rail' ? 'w-[calc((100%-24px)/5)] min-w-[54px] shrink-0 snap-start sm:w-20 lg:w-auto' : ''}`}
        >
          <span className={`flex items-center justify-center overflow-hidden bg-[#eaf6ef] ring-1 ring-[#0f7a4f]/12 shadow-xs transition group-hover:-translate-y-0.5 group-hover:ring-[#0f7a4f]/35 ${layout === 'grid' ? 'aspect-square w-full rounded-2xl' : 'size-11.5 sm:size-15 lg:size-18 rounded-xl sm:rounded-2xl'}`}>
            <CategoryImage category={category} />
          </span>
          <span className="line-clamp-2 text-[12px] font-semibold leading-snug tracking-normal text-[#17231d] antialiased group-hover:text-[#0f7a4f] sm:text-[12.5px]">
            {t(category.name)}
          </span>
        </Link>
      ))}
    </div>
  );
}
