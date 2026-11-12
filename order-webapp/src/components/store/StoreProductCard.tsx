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
      <p className={`${large ? 'text-2xl' : 'text-[15px]'} font-black leading-tight text-[#0b4f34]`}>
        {money(product.price)}
        <span className={`${large ? 'text-sm' : 'text-[11px]'} font-semibold text-[#59665f]`}> / {productUnit(product.unit || 'Kg')}</span>
      </p>
      {!session && <p className="text-[10.5px] font-semibold text-[#8a9690]">{t('Giá tham khảo')}</p>}
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
      className={`flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition active:scale-90 ${active ? 'text-[#e0742f]' : 'text-[#59665f] hover:text-[#e0742f]'} ${className}`}
    >
      <Heart size={17} fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2 : 2.2} />
    </button>
  );
}

export function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  const { t } = useLanguage();
  const src = productImage(product);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#f3f6f2] ${className}`}>
      {src && !failed ? (
        <img src={src} alt={product.name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <PackageOpen size={36} strokeWidth={1.5} className="text-[#59665f]/35" />
      )}
      {src && !failed && product.imageIsIllustration && (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9.5px] font-semibold text-white backdrop-blur-sm">
          {t('Ảnh minh hoạ')}
        </span>
      )}
    </div>
  );
}

/**
 * Nút thêm gọn đặt trên ảnh (kiểu sàn bán sỉ): "+" tròn khi chưa có trong
 * giỏ, chuyển thành "− số lượng +" khi đã chọn — thẻ sản phẩm thấp hơn,
 * mỗi hàng hiện được nhiều món hơn.
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
        className={`flex size-9 items-center justify-center rounded-full bg-[#0f7a4f] text-white shadow-md shadow-black/15 transition hover:bg-[#0b4f34] active:scale-90 ${className}`}
      >
        <Plus size={19} strokeWidth={2.6} />
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
    <div className={`flex h-9 items-center rounded-full bg-[#0f7a4f] text-white shadow-md shadow-black/15 ${className}`}>
      <button type="button" aria-label={t('Giảm')} onClick={(e) => change(e, -step)} className="flex size-9 items-center justify-center rounded-full active:scale-90"><Minus size={16} strokeWidth={2.6} /></button>
      <span className="min-w-6 text-center text-[13px] font-black">{Number(quantity.toFixed(3))}</span>
      <button type="button" aria-label={t('Tăng')} onClick={(e) => change(e, step)} className="flex size-9 items-center justify-center rounded-full active:scale-90"><Plus size={16} strokeWidth={2.6} /></button>
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
      <div className="relative">
        <Link to={`/san-pham/${product.id}`} className="block">
          <ProductImage product={product} className="aspect-square w-full" />
        </Link>
        <FavoriteButton productId={product.id} className="absolute right-1.5 top-1.5 size-8" />
        <CompactAdd product={product} className="absolute bottom-1.5 right-1.5" />
      </div>
      <Link to={`/san-pham/${product.id}`} className="flex flex-1 flex-col px-2 pb-2 pt-1.5 sm:px-2.5">
        {priced ? (
          <p className="text-[14.5px] font-black leading-tight text-[#0b4f34]">
            {money(product.price)}
            {!session && <span className="ml-1 text-[10px] font-semibold text-[#8a9690]">{t('Giá tham khảo')}</span>}
          </p>
        ) : (
          <p className="truncate text-[12px] font-bold leading-[1.45] text-[#c4601f]">{t('Liên hệ báo giá')}</p>
        )}
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.4em] text-[12.5px] font-medium leading-[1.2] text-[#17231d] group-hover:text-[#0b4f34]">{name}</h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#8a9690]">
          {product.packagingNote || productUnit(product.unit || 'Kg')}
        </p>
      </Link>
    </article>
  );
}
