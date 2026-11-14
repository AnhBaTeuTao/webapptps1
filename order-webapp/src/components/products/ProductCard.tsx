import { useEffect, useState } from 'react';
import { Plus, Minus, Heart, MessageSquarePlus, Check } from 'lucide-react';
import type { Product } from '../../lib/api';
import ProductThumbnail from './ProductThumbnail';
import { useLanguage } from '../../contexts/LanguageContext';

function money(v: number) {
  return new Intl.NumberFormat('vi-VN').format(Number(v) || 0) + 'đ';
}

const NO_SPINNER =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  itemNote?: string;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onAdd: (product: Product, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onUpdateNote: (productId: string, note: string) => void;
}

export default function ProductCard({
  product,
  quantityInCart,
  itemNote = '',
  isFavorite,
  onToggleFavorite,
  onAdd,
  onUpdateQty,
  onUpdateNote,
}: ProductCardProps) {
  const { t, productName, productUnit } = useLanguage();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(itemNote);
  const [draftQuantity, setDraftQuantity] = useState('1');

  useEffect(() => {
    setTempNote(itemNote);
  }, [itemNote]);

  const isInCart = quantityInCart > 0;

  // Rời khỏi giỏ => đóng chế độ sửa ghi chú
  useEffect(() => {
    if (!isInCart) setIsEditingNote(false);
  }, [isInCart]);

  const handleNoteSave = () => {
    onUpdateNote(product.id, tempNote.trim());
    setIsEditingNote(false);
  };

  const unitLabel = productUnit(product.unit || 'Kg');

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full overflow-hidden group ${
        isInCart
          ? 'border-[#0f7a4f]/40 shadow-sm shadow-[#0f7a4f]/5 ring-1 ring-[#0f7a4f]/20 bg-linear-to-b from-white to-[#f5fbf7]'
          : 'border-[#17231d]/10 hover:border-[#0f7a4f]/30 hover:shadow-md'
      }`}
    >
      {/* PHẦN TRÊN */}
      <div className="p-2 sm:p-3.5 flex-1 flex flex-col min-w-0">
        {/* TẦNG 1: Khung thông tin đầu thẻ */}
        <div className="min-w-0">
          {/* Hàng trên Tầng 1: Ảnh + Mã SKU + ĐVT + Nút tim */}
          <div className="relative flex items-start gap-1.5 sm:gap-2 min-h-10.5 sm:min-h-13">
            {/* Nút yêu thích góc trên phải */}
            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              className="absolute -right-1 -top-1 z-10 p-0.5 sm:p-1 text-[#59665f]/60 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title={isFavorite ? t('Bỏ yêu thích') : t('Thêm vào món yêu thích của bếp')}
              aria-label={`${t(isFavorite ? 'Bỏ yêu thích' : 'Thêm vào món yêu thích của bếp')} ${productName(product.name)}`}
            >
              <Heart size={14} className={isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
            </button>

            {/* Ảnh đại diện sản phẩm */}
            <ProductThumbnail product={product} size="md" className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl shrink-0" />

            {/* Cụm bên phải ảnh: SKU & ĐVT */}
            <div className="min-w-0 flex-1 pr-4 sm:pr-5 flex flex-col justify-center gap-1">
              {/* Dòng 1: Mã SKU (không dùng truncate để không bị ... theo yêu cầu) */}
              <div className="min-w-0">
                {product.sku ? (
                  <span className="inline-block text-[8px] sm:text-[9.5px] font-sans font-bold tracking-tighter sm:tracking-tight text-[#17231d] bg-[#eaf0ec] px-1 sm:px-1.5 py-0.5 rounded leading-none whitespace-nowrap">
                    {product.sku}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8a9690] leading-none">—</span>
                )}
              </div>

              {/* Dòng 2: Đơn vị tính */}
              <div className="text-[10px] sm:text-[10.5px] text-[#2c3a33] font-semibold leading-none whitespace-nowrap">
                {t('ĐVT:')} <strong className="text-[#17231d] font-bold">{unitLabel}</strong>
              </div>
            </div>
          </div>

          {/* Hàng dưới Tầng 1: Nhóm hàng + Trạng thái chọn hàng full chiều ngang thẻ */}
          <div className="mt-1.5 space-y-1 min-w-0">
            {/* Dòng 3: Phân nhóm hàng */}
            <div className="h-4 flex items-center text-[9.5px] sm:text-[10.5px] tracking-tight text-[#2c3a33] font-semibold leading-none whitespace-nowrap overflow-hidden">
              <span className="shrink-0">{t('Nhóm:')}</span>
              <span className="ml-1 font-bold text-[#17231d] truncate">{product.category ? productName(product.category) : t('Khác')}</span>
            </div>

            {/* Dòng 4: Trạng thái chọn hàng */}
            <div className="h-4.5 flex items-center">
              {isInCart ? (
                <span className="inline-flex items-center text-[9.5px] sm:text-[10px] font-bold text-[#0f7a4f] bg-[#0f7a4f]/12 px-2 py-0.5 rounded-full leading-none whitespace-nowrap">
                  {t('Đã chọn:')} {quantityInCart} {unitLabel}
                </span>
              ) : (
                <span className="text-[9.5px] sm:text-[10px] text-[#0f7a4f] font-semibold leading-none whitespace-nowrap">
                  {t('Sẵn hàng giao bếp')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TẦNG 2: Tên sản phẩm khóa chuẩn 2 dòng h-9 sm:h-10 */}
        <div className="mt-2">
          <h3
            className="font-bold text-[12.5px] sm:text-sm text-[#17231d] leading-4.5 sm:leading-5 line-clamp-2 h-9 sm:h-10 overflow-hidden"
            title={product.name}
          >
            {productName(product.name)}
          </h3>
        </div>

        {/* TẦNG 3: Giá / Chờ sale báo giá khóa chuẩn h-7.5 sm:h-8.5 */}
        <div className="mt-1.5 pt-1.5 border-t border-dashed border-[#17231d]/10 h-7.5 sm:h-8.5 flex items-center justify-between">
          <div className="flex items-baseline min-w-0 overflow-hidden">
            {product.priceOnRequest ? (
              <span className="text-[#e0742f] text-[11px] sm:text-[13px] font-bold whitespace-nowrap truncate">
                {t('Chờ sale báo giá')}
              </span>
            ) : (
              <span className="text-[#0f7a4f] text-[13.5px] sm:text-base font-extrabold whitespace-nowrap">
                {money(product.price)}
              </span>
            )}
            <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold text-[#17231d]/80 ml-0.5 sm:ml-1 whitespace-nowrap">/{unitLabel}</span>
          </div>
        </div>

        {/* Hàng 4 (TẦNG 4): Ghi chú quy cách sơ chế */}
        {isInCart && (
          <div className="mt-2 min-h-8 flex items-center">
            {isEditingNote ? (
              <div className="w-full flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNoteSave();
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setTempNote(itemNote);
                      setIsEditingNote(false);
                    }
                  }}
                  placeholder={t('Vd: Sơ chế sẵn, thái lát mỏng...')}
                  className="min-w-0 flex-1 text-xs py-1 px-2.5 bg-[#f8faf7] border border-[#0f7a4f]/40 rounded-lg focus:outline-none focus:border-[#0f7a4f] focus:bg-white text-[#17231d]"
                />
                <button
                  type="button"
                  onClick={handleNoteSave}
                  className="shrink-0 p-1.5 text-[#0f7a4f] bg-[#0f7a4f]/10 rounded-lg hover:bg-[#0f7a4f]/20 cursor-pointer"
                  title={t('Lưu ghi chú')}
                  aria-label={t('Lưu ghi chú')}
                >
                  <Check size={14} />
                </button>
              </div>
            ) : itemNote ? (
              <div className="w-full flex items-center justify-between gap-1.5 rounded-lg border border-[#0f7a4f]/25 bg-[#eaf6ef]/70 px-2.5 py-1 text-[11px] text-[#0b4f34]">
                <span className="truncate font-medium" title={itemNote}>📝 {itemNote}</span>
                <button
                  type="button"
                  onClick={() => setIsEditingNote(true)}
                  className="shrink-0 font-bold text-[#0f7a4f] hover:underline cursor-pointer"
                >
                  {t('Sửa')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="inline-flex w-full items-center justify-start gap-1 rounded-lg bg-[#f4f8f5] px-2 py-1 text-left text-[10.5px] sm:text-[11px] font-semibold text-[#2c3a33] hover:bg-[#eaf6ef] hover:text-[#0f7a4f] transition-colors cursor-pointer whitespace-nowrap overflow-hidden"
              >
                <MessageSquarePlus size={12} className="shrink-0 text-[#0f7a4f]" />
                <span className="truncate">+ {t('Ghi chú / quy cách')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* PHẦN DƯỚI: Nút Thêm hoặc Stepper */}
      <div className="p-2 sm:p-3 pt-2 sm:pt-3 border-t border-[#17231d]/5 mt-auto bg-white/60">
        {!isInCart ? (
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex h-9 sm:h-11 min-w-0 flex-1 items-center justify-between gap-0.5 rounded-xl border border-[#17231d]/12 bg-[#f8faf7] px-0.5 sm:px-1 overflow-hidden">
              <button
                type="button"
                onClick={() => setDraftQuantity((value) => String(Math.max(0.1, (Number(value) || 1) - 1)))}
                aria-label={t('Giảm số lượng')}
                className="flex size-6.5 sm:size-8 shrink-0 items-center justify-center rounded-lg text-[#466253] hover:bg-white cursor-pointer"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <input
                type="number"
                min="0.1"
                step="any"
                value={draftQuantity}
                onChange={(e) => setDraftQuantity(e.target.value)}
                aria-label={`Số lượng ${product.name}`}
                className={`w-full min-w-0 flex-1 bg-transparent text-center text-xs sm:text-sm font-extrabold text-[#17382a] outline-none ${NO_SPINNER}`}
              />
              <button
                type="button"
                onClick={() => setDraftQuantity((value) => String((Number(value) || 0) + 1))}
                aria-label={t('Tăng số lượng')}
                className="flex size-6.5 sm:size-8 shrink-0 items-center justify-center rounded-lg text-[#0f7a4f] hover:bg-white cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onAdd(product, Math.max(0.1, Number(draftQuantity) || 1))}
              aria-label={t('Thêm vào đơn')}
              className="flex h-9 w-9 sm:h-11 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#0f7a4f] text-white shadow-sm hover:bg-[#0b4f34] cursor-pointer"
            >
              <Plus size={18} className="sm:size-5" />
            </button>
          </div>
        ) : (
          <div className="flex h-9 sm:h-10 w-full min-w-0 items-center justify-between gap-1 rounded-xl border border-[#0f7a4f]/25 bg-[#f3f8f5] p-1 overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateQty(product.id, Math.max(0, Number((quantityInCart - 1).toFixed(2))))}
              className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#17231d]/10 text-[#17231d] hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-colors cursor-pointer"
              aria-label={t('Giảm số lượng')}
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>

            <input
              type="number"
              min={0}
              step="any"
              value={quantityInCart}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateQty(product.id, isNaN(val) ? 0 : Math.max(0, val));
              }}
              className={`w-full min-w-0 flex-1 text-center font-extrabold text-xs sm:text-base text-[#0b4f34] bg-transparent focus:outline-none ${NO_SPINNER}`}
              aria-label={`Số lượng ${product.name}`}
            />

            <button
              type="button"
              onClick={() => onUpdateQty(product.id, Number((quantityInCart + 1).toFixed(2)))}
              className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-[#0f7a4f] text-white hover:bg-[#0b4f34] active:scale-95 transition-colors cursor-pointer shadow-xs"
              aria-label={t('Tăng số lượng')}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
