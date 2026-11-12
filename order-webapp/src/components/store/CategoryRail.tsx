import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import type { StoreCategory } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

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
  if (categories.length === 0) return null;
  const wrapper = layout === 'grid'
    ? 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5'
    : 'no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-10 lg:overflow-visible';

  return (
    <div className={wrapper}>
      {categories.map((category) => (
        <Link
          key={category.slug}
          to={`/danh-muc/${category.slug}`}
          className={`group flex flex-col items-center gap-2 text-center ${layout === 'rail' ? 'w-[78px] shrink-0 lg:w-auto' : ''}`}
        >
          <span className={`flex items-center justify-center overflow-hidden rounded-2xl bg-[#eaf6ef] ring-1 ring-[#0f7a4f]/10 ${layout === 'grid' ? 'aspect-square w-full' : 'size-[72px] lg:size-20'}`}>
            <CategoryImage category={category} />
          </span>
          <span className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#17231d] group-hover:text-[#0b4f34] sm:text-[13px]">
            {t(category.name)}
          </span>
        </Link>
      ))}
    </div>
  );
}
