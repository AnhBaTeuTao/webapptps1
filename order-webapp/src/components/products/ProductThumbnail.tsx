import { useState } from 'react';
import { PackageOpen } from 'lucide-react';
import type { Product } from '../../lib/api';
import { getDemoProductThumb, IS_DEMO_MODE } from '../../lib/demoMock';

interface ProductThumbnailProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function productImage(product: Product): string {
  const src = product.thumbUrl || product.imageUrl || '';
  if (src) return src;
  return IS_DEMO_MODE ? getDemoProductThumb(product.category, product.sku) : '';
}

export default function ProductThumbnail({ product, size = 'md', className = '' }: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const src = productImage(product);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl',
    lg: 'w-18 h-18 sm:w-20 sm:h-20 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 16,
    md: 22,
    lg: 28,
  }[size];

  return (
    <div
      className={`${sizeClasses} border border-[#17231d]/10 bg-[#f5f7f3] overflow-hidden shrink-0 flex items-center justify-center text-[#59665f]/40 relative select-none ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <PackageOpen size={iconSizes} strokeWidth={1.75} />
      )}
    </div>
  );
}
