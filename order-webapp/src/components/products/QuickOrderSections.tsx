import { useState, type RefObject } from 'react';
import { Repeat2, Heart, FolderOpen, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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
  const quickRail = useHorizontalScroll<HTMLDivElement>();
  const categoryRail = useHorizontalScroll<HTMLDivElement>();
  const [selectedQuickTab, setSelectedQuickTab] = useState<'favorites' | 'frequent'>('favorites');

  const hasFavorites = favoriteProducts.length > 0;
  const hasFrequent = frequentProducts.length > 0;
  const hasQuickProducts = hasFavorites || hasFrequent;
  const activeTab: 'favorites' | 'frequent' =
    selectedQuickTab === 'favorites'
      ? (hasFavorites ? 'favorites' : 'frequent')
      : (hasFrequent ? 'frequent' : 'favorites');
  const activeProducts = activeTab === 'favorites' ? favoriteProducts : frequentProducts;

  const hasAnyQuickSection = Boolean(latestOrder) || hasQuickProducts || categories.length > 0;
  if (!hasAnyQuickSection) return null;

  const reorderButton = latestOrder ? (
    <button
      type="button"
      onClick={onReorderLatest}
      disabled={loadingLatestOrder}
      className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#0f7a4f]/25 bg-[#eaf6ef] px-3 text-xs font-semibold text-[#0b4f34] shadow-2xs transition hover:bg-[#0f7a4f] hover:text-white disabled:opacity-60 cursor-pointer shrink-0 whitespace-nowrap"
    >
      <Repeat2 size={14} className={loadingLatestOrder ? 'animate-spin' : ''} />
      <span>{t(loadingLatestOrder ? 'Đang nạp' : 'Đặt lại đơn gần nhất')}</span>
    </button>
  ) : null;

  return (
    <section className="space-y-3.5 min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-[#17231d]/10 bg-white p-3 shadow-sm sm:p-4">
      {/* 1. Truy cập nhanh cho bếp (Món yêu thích / Hàng thường mua + Đặt lại đơn gần nhất cùng 1 hàng) */}
      {hasQuickProducts ? (
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            {hasFavorites && hasFrequent ? (
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedQuickTab('favorites')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'favorites'
                      ? 'bg-[#0f7a4f] text-white shadow-2xs'
                      : 'bg-[#f6f9f7] text-[#17231d] border border-[#17231d]/10 hover:bg-[#eaf6ef]'
                  }`}
                >
                  <Heart size={13} className={activeTab === 'favorites' ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'} />
                  <span>{t('Món yêu thích của bếp')}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'}`}>
                    {favoriteProducts.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuickTab('frequent')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'frequent'
                      ? 'bg-[#0f7a4f] text-white shadow-2xs'
                      : 'bg-[#f6f9f7] text-[#17231d] border border-[#17231d]/10 hover:bg-[#eaf6ef]'
                  }`}
                >
                  <span>{t('Hàng thường mua')}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'frequent' ? 'bg-white/20 text-white' : 'bg-[#0f7a4f]/10 text-[#0f7a4f]'}`}>
                    {frequentProducts.length}
                  </span>
                </button>
              </div>
            ) : (
              <p className="text-xs font-bold uppercase tracking-wider text-[#17231d] flex items-center gap-1.5 min-w-0">
                {activeTab === 'favorites' ? (
                  <>
                    <Heart size={13} className="fill-rose-500 text-rose-500 shrink-0" />
                    <span className="truncate">{t('Món yêu thích của bếp')}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[10px] font-mono border border-rose-200 shrink-0">
                      {favoriteProducts.length}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{t('Hàng thường mua')}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#0f7a4f]/10 text-[#0f7a4f] text-[10px] font-mono shrink-0">
                      {frequentProducts.length}
                    </span>
                  </>
                )}
              </p>
            )}

            <div className="flex items-center gap-2 ml-auto shrink-0">
              {activeProducts.length > 3 && <RailArrows targetRef={quickRail} />}
              {reorderButton}
            </div>
          </div>

          <div ref={quickRail} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 overscroll-x-contain select-none cursor-grab active:cursor-grabbing">
            {activeProducts.map((product) => {
              const isFavorite = favoriteIds.includes(product.id);
              const unitText = productUnit(product.unit || 'Kg');
              return (
                <div
                  key={product.id}
                  className="min-w-[230px] max-w-[265px] sm:min-w-[248px] sm:max-w-[280px] flex items-center gap-2.5 p-2 rounded-xl border border-[#17231d]/10 bg-[#f8faf7] hover:border-[#0f7a4f]/35 hover:bg-[#eff7f2] transition-all shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => onAddProduct(product, 1)}
                    className="min-w-0 flex-1 flex items-center gap-2.5 text-left cursor-pointer group"
                    title={`${t('Thêm vào đơn')} ${productName(product.name)}`}
                  >
                    <ProductThumbnail product={product} size="sm" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold truncate text-[#17231d] group-hover:text-[#0f7a4f] transition-colors">
                        {productName(product.name)}
                      </span>
                      <span className="flex items-center gap-1 text-[10.5px] text-[#4a5a52] font-medium mt-0.5 min-w-0">
                        <span className="truncate">
                          {product.sku ? `${product.sku} · ${unitText}` : unitText}
                        </span>
                        <span className="shrink-0">·</span>
                        <strong className="shrink-0 text-[#0f7a4f] font-bold whitespace-nowrap">
                          {product.priceOnRequest ? t('Chờ sale báo giá') : money(product.price)}
                        </strong>
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(product.id)}
                      className={`size-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isFavorite
                          ? 'text-rose-500 hover:bg-rose-50'
                          : 'text-[#59665f]/60 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={t(isFavorite ? 'Bỏ yêu thích' : 'Thêm vào món yêu thích của bếp')}
                      aria-label={`${t(isFavorite ? 'Bỏ yêu thích' : 'Thêm vào món yêu thích của bếp')} ${productName(product.name)}`}
                    >
                      <Heart
                        size={14}
                        className={isFavorite ? 'fill-rose-500 text-rose-500' : ''}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddProduct(product, 1)}
                      className="size-7.5 rounded-lg bg-[#0f7a4f] text-white hover:bg-[#0b4f34] flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer"
                      title={t('Thêm vào đơn')}
                      aria-label={`${t('Thêm vào đơn')} ${productName(product.name)}`}
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        reorderButton && categories.length === 0 && (
          <div className="flex justify-end">{reorderButton}</div>
        )
      )}

      {/* 2. Duyệt theo nhóm hàng (Category Filter) */}
      {categories.length > 0 && (
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#17231d] flex items-center gap-1.5">
              <FolderOpen size={14} className="text-[#0f7a4f] shrink-0" />
              <span>{t('Duyệt theo nhóm hàng')}</span>
            </p>
            <div className="flex items-center gap-2.5 ml-auto shrink-0">
              {selectedCategory !== '' && (
                <button
                  type="button"
                  onClick={() => onSelectCategory('')}
                  className="text-xs font-semibold text-[#0f7a4f] hover:underline cursor-pointer whitespace-nowrap"
                >
                  {t('Đang lọc:')} {productName(selectedCategory)} ✕
                </button>
              )}
              {!hasQuickProducts && reorderButton}
            </div>
          </div>
          <div
            ref={categoryRail}
            className="flex gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap no-scrollbar pb-1 sm:pb-0 overscroll-x-contain select-none sm:select-auto"
          >
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className={`shrink-0 h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-[#0f7a4f] text-white shadow-xs ring-1 ring-[#0f7a4f]'
                  : 'bg-[#f6f9f7] text-[#17231d] border border-[#17231d]/12 hover:border-[#0f7a4f]/50 hover:bg-[#eaf6ef]/60 hover:text-[#0b4f34]'
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
                  className={`shrink-0 h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0f7a4f] text-white shadow-xs ring-1 ring-[#0f7a4f]'
                      : 'bg-[#f6f9f7] text-[#17231d] border border-[#17231d]/12 hover:border-[#0f7a4f]/50 hover:bg-[#eaf6ef]/60 hover:text-[#0b4f34]'
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
