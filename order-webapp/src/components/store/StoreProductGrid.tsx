import { useEffect, useState } from 'react';
import type { Product } from '../../lib/api';
import StoreProductCard from './StoreProductCard';

/** Lưới sản phẩm dùng chung: 3 cột điện thoại → 7 cột màn hình lớn. */
export const STORE_GRID = 'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';

// Khớp các mốc màn hình của Tailwind trong STORE_GRID.
function columnsFor(width: number) {
  if (width >= 1280) return 7;
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  if (width >= 640) return 4;
  return 3;
}

export function useGridColumns() {
  const [columns, setColumns] = useState(() => (typeof window === 'undefined' ? 3 : columnsFor(window.innerWidth)));
  useEffect(() => {
    const onResize = () => setColumns(columnsFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return columns;
}

/**
 * Khi còn hàng để "Xem thêm", chỉ hiện đủ số hàng chẵn cột để hàng cuối không bị lẻ;
 * những món dư sẽ hiện ở lần tải kế tiếp.
 */
export default function StoreProductGrid({ products, hasMore = false }: { products: Product[]; hasMore?: boolean }) {
  const columns = useGridColumns();
  const full = Math.floor(products.length / columns) * columns;
  const visible = hasMore && full > 0 ? products.slice(0, full) : products;
  return (
    <div className={STORE_GRID}>
      {visible.map((product) => <StoreProductCard key={product.id} product={product} />)}
    </div>
  );
}

export function StoreGridSkeleton({ count = 14 }: { count?: number }) {
  return (
    <div className={STORE_GRID} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-[#17231d]/6">
          <div className="aspect-square animate-pulse bg-[#eef2ee]" />
          <div className="space-y-1.5 p-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#eef2ee]" />
            <div className="h-3 animate-pulse rounded bg-[#eef2ee]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[#eef2ee]" />
          </div>
        </div>
      ))}
    </div>
  );
}
