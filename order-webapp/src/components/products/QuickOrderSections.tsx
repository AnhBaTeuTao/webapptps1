import type { RefObject } from 'react';
import { Repeat2, Heart, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, Order } from '../../lib/api';
import ProductThumbnail from './ProductThumbnail';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

function money(v: number) {
  return new Intl.NumberFormat('vi-VN').format(Number(v) || 0) + 'đ';
}

function scrollByAmount(ref: RefObject<HTMLDivElement | null>, direction: 'left' | 'right') {
  const el = ref.current;
  if (!el) return;
  const step = Math.max(160, Math.round(el.getBoundingClientRect().width * 0.7));
  el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
}

function RailArrows({ targetRef }: { targetRef: RefObject<HTMLDivElement | null> }) {
  const base =
    'flex size-7 items-center justify-center rounded-full border border-[#17231d]/12 bg-white text-[#59665f] hover:border-[#0f7a4f] hover:text-[#0f7a4f] transition cursor-pointer';
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button type="button" onClick={() => scrollByAmount(targetRef, 'left')} className={base} aria-label="Cuộn sang trái">
        <ChevronLeft size={15} />
      </button>
      <button type="button" onClick={() => scrollByAmount(targetRef, 'right')} className={base} aria-label="Cuộn sang phải">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

interface QuickOrderSectionsProps {
  latestOrder?: Order;
  loadingLatestOrder: boolean;
  onReorderLatest: () => void;
  frequentProducts: Product[];
  favoriteProducts: Product[];
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddProduct: (product: Product, qty?: number) => void;
}

export default function QuickOrderSections({
  latestOrder,
  loadingLatestOrder,
  onReorderLatest,
  frequentProducts,
  favoriteProducts,
  favoriteIds,
  onToggleFavorite,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddProduct,
}: QuickOrderSectionsProps) {
  const { t, productName, productUnit } = useLanguage();
  const frequentRail = useHorizontalScroll<HTMLDivElement>();
  const favoriteRail = useHorizontalScroll<HTMLDivElement>();
  const categoryRail = useHorizontalScroll<HTMLDivElement>();
  const hasAnyQuickSection =
    Boolean(latestOrder) ||
    frequentProducts.length > 0 ||
    favoriteProducts.length > 0 ||
    categories.length > 0;

  if (!hasAnyQuickSection) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-[#17231d]/10 bg-white p-3 shadow-sm sm:p-4">
      {latestOrder && <button
          type="button"
          onClick={onReorderLatest}
          disabled={loadingLatestOrder}
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#0f7a4f] hover:bg-[#f1f7f3] disabled:opacity-60"
        >
          <Repeat2 size={15} className={loadingLatestOrder ? 'animate-spin' : ''} />
          <span>{t(loadingLatestOrder ? 'Đang nạp' : 'Đặt lại đơn gần nhất')}</span>
        </button>}

      {/* 1. Mặt hàng thường mua */}
      {frequentProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#17231d] flex items-center gap-1">
              <span>{t('Hàng thường mua')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#0f7a4f]/10 text-[#0f7a4f] text-[10px] font-mono">
                {frequentProducts.length}
              </span>
            </p>
            <RailArrows targetRef={frequentRail} />
          </div>
          <div ref={frequentRail} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 overscroll-x-contain select-none cursor-grab active:cursor-grabbing">
            {frequentProducts.map((product) => {
              const isFavorite = favoriteIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  className="min-w-57.5 max-w-65 flex items-center gap-2 p-2 rounded-xl border border-[#17231d]/10 bg-[#f8faf7] hover:border-[#0f7a4f]/30 hover:bg-[#f3f7f4] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onAddProduct(product, 1)}
                    className="min-w-0 flex-1 flex items-center gap-2 text-left cursor-pointer group"
                    title={`Thêm ${product.name} vào đơn`}
                  >
                    <ProductThumbnail product={product} size="sm" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold truncate text-[#17231d] group-hover:text-[#0f7a4f] transition-colors">
                        {productName(product.name)}
                      </span>
                      {product.sku && <span className="block text-[10px] text-[#2c3a33] font-semibold">{product.sku}</span>}
                      <span className="block text-[11px] text-[#2c3a33] font-semibold mt-0.5">
                        {productUnit(product.unit || 'Kg')} •{' '}
                        <strong className="text-[#0f7a4f]">
                          {product.priceOnRequest ? t('Chờ sale báo giá') : money(product.price)}
                        </strong>
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(product.id)}
                    className="p-2 rounded-lg text-[#59665f]/60 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    aria-label={isFavorite ? `Bỏ yêu thích ${product.name}` : `Yêu thích ${product.name}`}
                  >
                    <Heart
                      size={15}
                      className={isFavorite ? 'fill-rose-500 text-rose-500' : ''}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Sản phẩm yêu thích */}
      {favoriteProducts.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#17231d] flex items-center gap-1.5">
              <Heart size={13} className="fill-rose-500 text-rose-500" />
              <span>{t('Món yêu thích của bếp')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[10px] font-mono border border-rose-200">
                {favoriteProducts.length}
              </span>
            </p>
            <RailArrows targetRef={favoriteRail} />
          </div>
          <div ref={favoriteRail} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 overscroll-x-contain select-none cursor-grab active:cursor-grabbing">
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-57.5 max-w-65 flex items-center gap-2 p-2 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/80 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onAddProduct(product, 1)}
                  className="min-w-0 flex-1 flex items-center gap-2 text-left cursor-pointer group"
                >
                  <ProductThumbnail product={product} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold truncate text-[#17231d] group-hover:text-rose-700">
                      {productName(product.name)}
                    </span>
                    {product.sku && <span className="block text-[10px] text-[#2c3a33] font-semibold">{product.sku}</span>}
                    <span className="block text-[11px] text-[#0f7a4f] font-bold mt-0.5">
                      {product.priceOnRequest ? t('Chờ sale báo giá') : money(product.price)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(product.id)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Bỏ yêu thích"
                  aria-label={`Bỏ yêu thích ${product.name}`}
                >
                  <Heart size={15} className="fill-rose-500 text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Danh mục sản phẩm (Category chips) */}
      {categories.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#17231d] flex items-center gap-1">
              <FolderOpen size={13} className="text-[#0f7a4f]" />
              <span>{t('Duyệt theo nhóm hàng')}</span>
            </p>
            <RailArrows targetRef={categoryRail} />
          </div>
          <div ref={categoryRail} className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 overscroll-x-contain select-none cursor-grab active:cursor-grabbing">
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer touch-target ${
                !selectedCategory
                  ? 'bg-[#0f7a4f] text-white border-[#0f7a4f] shadow-sm shadow-[#0f7a4f]/20 font-bold'
                  : 'bg-white text-[#17231d] font-bold border border-[#17231d]/20 shadow-2xs hover:border-[#0f7a4f] hover:text-[#0f7a4f] hover:bg-[#eaf6ef]/40'
              }`}
            >
              {t('Tất cả nhóm')}
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer touch-target ${
                    isSelected
                      ? 'bg-[#0f7a4f] text-white border-[#0f7a4f] shadow-sm shadow-[#0f7a4f]/20 font-bold'
                      : 'bg-white text-[#17231d] font-bold border border-[#17231d]/20 shadow-2xs hover:border-[#0f7a4f] hover:text-[#0f7a4f] hover:bg-[#eaf6ef]/40'
                  }`}
                >
                  {productName(cat)}
                </button>
              );
            })}
          </div>

        </div>
      )}
    </section>
  );
}
