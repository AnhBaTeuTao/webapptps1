import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, PackageOpen, Plus, ShoppingCart } from 'lucide-react';
import type { Product } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
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

export function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = productImage(product);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#f3f6f2] ${className}`}>
      {src && !failed ? (
        <img src={src} alt={product.name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <PackageOpen size={36} strokeWidth={1.5} className="text-[#59665f]/35" />
      )}
    </div>
  );
}

export default function StoreProductCard({ product }: { product: Product }) {
  const { productName, productUnit } = useLanguage();
  const name = productName(product.name);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#17231d]/8 bg-white shadow-[0_1px_2px_rgba(16,40,30,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(16,40,30,0.10)]">
      <Link to={`/san-pham/${product.id}`} className="block">
        <ProductImage product={product} className="aspect-square w-full transition duration-300 group-hover:scale-[1.02]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/san-pham/${product.id}`} className="min-h-[2.6rem]">
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#17231d] group-hover:text-[#0b4f34]">{name}</h3>
        </Link>
        <p className="line-clamp-1 text-[11.5px] text-[#59665f]">
          {product.packagingNote || product.shortDescription || productUnit(product.unit || 'Kg')}
        </p>
        <div className="mt-auto space-y-2">
          <PriceTag product={product} />
          <QuantityStepper product={product} />
        </div>
      </div>
    </article>
  );
}
