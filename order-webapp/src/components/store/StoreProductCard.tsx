import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Minus, PackageOpen, Plus, ShoppingCart } from 'lucide-react';
import type { Product } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { productImage } from '../products/ProductThumbnail';

export function money(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0)) + 'đ';
}

/** Bước tăng giảm theo quy cách đặt hàng của sản phẩm. */
export function stepOf(product: Product) {
  const step = Number(product.orderStep) || 1;
  return step > 0 ? step : 1;
}

export function firstQuantityOf(product: Product) {
  return Math.max(Number(product.minOrderQty) || 0, stepOf(product));
}

/** Giá + nhãn "Giá tham khảo" cho khách chưa đăng nhập. */
export function PriceTag({ product, large = false }: { product: Product; large?: boolean }) {
  const { session } = useAuth();
  const { t, productUnit } = useLanguage();
  if (product.priceOnRequest || !(product.price > 0)) {
    return <p className={`${large ? 'text-lg' : 'text-sm'} font-bold text-[#c4601f]`}>{t('Liên hệ báo giá')}</p>;
  }
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-1.5 leading-tight">
        <span className={`${large ? 'text-2xl' : 'text-[15px]'} font-black text-[#0b4f34]`}>
          {money(product.price)}
        </span>
        <span className={`${large ? 'text-sm' : 'text-[11.5px]'} font-semibold text-[#59665f] whitespace-nowrap`}>
          / {productUnit(product.unit || 'Kg')}
        </span>
      </div>
      {!session && <p className="mt-0.5 text-[10.5px] font-medium text-[#8a9690]">{t('Giá tham khảo')}</p>}
    </div>
  );
}

/** Nút "Thêm" chuyển thành bộ tăng/giảm khi đã có trong giỏ. */
export function QuantityStepper({ product, size = 'md' }: { product: Product; size?: 'md' | 'lg' }) {
  const { quantityOf, addProduct, updateQty, tab } = useCart();
  const { t } = useLanguage();
  const quantity = quantityOf(product.id);
  const step = stepOf(product);
  const plainLine = tab.items.find((item) => item.product.id === product.id && !item.note?.trim());
  const height = size === 'lg' ? 'h-12' : 'h-10';

  if (quantity <= 0) {
    return (
      <button
        type="button"
        onClick={() => addProduct(product, firstQuantityOf(product))}
        className={`${height} inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f7a4f] px-3 text-sm font-bold text-white shadow-sm shadow-[#0f7a4f]/20 transition hover:bg-[#0b4f34] active:scale-[0.98]`}
      >
        <ShoppingCart size={size === 'lg' ? 18 : 16} />
        <span>{t('Thêm vào giỏ')}</span>
      </button>
    );
  }

  const change = (delta: number) => {
    if (!plainLine) { addProduct(product, Math.max(step, delta)); return; }
    const next = Number((plainLine.quantity + delta).toFixed(3));
    updateQty(plainLine.lineKey || plainLine.product.id, next < (Number(product.minOrderQty) || 0) ? 0 : next);
  };

  return (
    <div className={`${height} flex w-full items-center justify-between rounded-xl border border-[#0f7a4f]/25 bg-[#eaf6ef] p-1`}>
      <button type="button" aria-label={t('Giảm')} onClick={() => change(-step)} className="flex h-full aspect-square items-center justify-center rounded-lg bg-white text-[#0f7a4f] shadow-sm active:scale-95">
        <Minus size={16} />
      </button>
      <span className="min-w-0 px-1 text-center text-sm font-black text-[#0b4f34]">{Number(quantity.toFixed(3))}</span>
      <button type="button" aria-label={t('Tăng')} onClick={() => change(step)} className="flex h-full aspect-square items-center justify-center rounded-lg bg-[#0f7a4f] text-white shadow-sm active:scale-95">
        <Plus size={16} />
      </button>
    </div>
  );
}

/** Nút tim: thêm/bỏ khỏi danh sách hàng yêu thích. */
export function FavoriteButton({ productId, className = '' }: { productId: string; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const { t } = useLanguage();
  const active = isFavorite(productId);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? t('Bỏ khỏi yêu thích') : t('Thêm vào yêu thích')}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      className={`flex ${/(^| )size-/.test(className) ? '' : 'size-9'} items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition active:scale-90 ${active ? 'text-rose-500' : 'text-[#2c3a33] hover:text-rose-500'} ${className}`}
    >
      <Heart size={16} className={active ? 'fill-rose-500 text-rose-500' : 'fill-none text-[#2c3a33] hover:text-rose-500'} strokeWidth={active ? 2 : 2.2} />
    </button>
  );
}

export function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  const { t } = useLanguage();
  const src = productImage(product);
  const isTinyThumb = /\bsize-(10|11|12|14)\b/.test(className);
  const isCompactThumb = /\bsize-16\b/.test(className);
  const padClass = isTinyThumb ? 'p-0.5' : isCompactThumb ? 'p-1' : 'p-2.5 sm:p-3';
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-white ${padClass} ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain object-center transition-transform duration-200 group-hover:scale-[1.03]"
        />
      ) : (
        <PackageOpen size={36} strokeWidth={1.5} className="text-[#59665f]/35" />
      )}
      {src && !failed && product.imageIsIllustration && !isTinyThumb && (
        <span
          className={`pointer-events-none absolute whitespace-nowrap font-semibold leading-none text-white backdrop-blur-[2px] ${
            isCompactThumb
              ? 'inset-x-0.5 bottom-0.5 rounded bg-black/55 px-1 py-0.5 text-center text-[7.5px]'
              : 'bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9.5px]'
          }`}
        >
          {t('Ảnh minh hoạ')}
        </span>
      )}
    </div>
  );
}

/**
 * Nút thêm gọn đặt ở chân thẻ: "+" tròn khi chưa có trong giỏ,
 * chuyển thành "− số lượng +" khi đã chọn để không che ảnh sản phẩm.
 */
export function CompactAdd({ product, className = '' }: { product: Product; className?: string }) {
  const { quantityOf, addProduct, updateQty, tab } = useCart();
  const { t } = useLanguage();
  const quantity = quantityOf(product.id);
  const step = stepOf(product);
  const plainLine = tab.items.find((item) => item.product.id === product.id && !item.note?.trim());
  const stop = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  if (quantity <= 0) {
    return (
      <button
        type="button"
        aria-label={t('Thêm vào giỏ')}
        onClick={(e) => { stop(e); addProduct(product, firstQuantityOf(product)); }}
        className={`flex size-7.5 sm:size-8 items-center justify-center rounded-full bg-[#0f7a4f] text-white shadow-xs transition hover:bg-[#0b4f34] active:scale-90 ${className}`}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    );
  }

  const change = (e: MouseEvent, delta: number) => {
    stop(e);
    if (!plainLine) { addProduct(product, Math.max(step, delta)); return; }
    const next = Number((plainLine.quantity + delta).toFixed(3));
    updateQty(plainLine.lineKey || plainLine.product.id, next < (Number(product.minOrderQty) || 0) ? 0 : next);
  };

  return (
    <div className={`flex h-7.5 sm:h-8 items-center rounded-full bg-[#0f7a4f] text-white shadow-xs ${className}`}>
      <button type="button" aria-label={t('Giảm')} onClick={(e) => change(e, -step)} className="flex size-7.5 sm:size-8 items-center justify-center rounded-full active:scale-90"><Minus size={14} strokeWidth={2.5} /></button>
      <span className="min-w-4.5 px-0.5 text-center text-[11.5px] sm:text-xs font-bold">{Number(quantity.toFixed(3))}</span>
      <button type="button" aria-label={t('Tăng')} onClick={(e) => change(e, step)} className="flex size-7.5 sm:size-8 items-center justify-center rounded-full active:scale-90"><Plus size={14} strokeWidth={2.5} /></button>
    </div>
  );
}

export default function StoreProductCard({ product }: { product: Product }) {
  const { session } = useAuth();
  const { t, productName, productUnit } = useLanguage();
  const name = productName(product.name);
  const priced = !product.priceOnRequest && product.price > 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[#17231d]/7 transition hover:shadow-[0_8px_22px_rgba(16,40,30,0.10)]">
      <div className="relative border-b border-[#17231d]/6 bg-white">
        <Link to={`/san-pham/${product.id}`} className="block">
          <ProductImage product={product} className="aspect-square w-full" />
        </Link>
        <FavoriteButton productId={product.id} className="absolute right-1.5 top-1.5 size-7 sm:size-7.5 bg-white/90" />
      </div>
      <div className="flex flex-1 flex-col justify-between px-2.5 pb-2.5 pt-2 sm:px-3">
        <Link to={`/san-pham/${product.id}`} className="block min-w-0">
          {priced ? (
            <p className="text-[13.5px] font-bold leading-tight sm:text-[14.5px] text-[#0b4f34]">
              {money(product.price)}
              {!session && <span className="ml-1 text-[10px] font-semibold text-[#8a9690] whitespace-nowrap">{t('Giá tham khảo')}</span>}
            </p>
          ) : (
            <p className="truncate text-[12px] font-bold leading-[1.4] text-[#c4601f]">{t('Liên hệ báo giá')}</p>
          )}
          <h3 className="mt-1 line-clamp-2 min-h-[2.4em] text-[12px] font-semibold leading-tight sm:text-[12.5px] text-[#17231d] group-hover:text-[#0b4f34]">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-1.5 pt-1 border-t border-[#17231d]/6">
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#6e7d75]" title={product.packagingNote || productUnit(product.unit || 'Kg')}>
            {product.packagingNote || productUnit(product.unit || 'Kg')}
          </span>
          <CompactAdd product={product} className="shrink-0" />
        </div>
      </div>
    </article>
  );
}
