import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Trash2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Info,
} from 'lucide-react';
import type { CustomerSession, Product } from '../../lib/api';
import type { OrderTab } from './OrderTabsBar';
import ProductThumbnail from './ProductThumbnail';
import UnlistedItemEntry from './UnlistedItemEntry';
import LineNoteEditor from './LineNoteEditor';
import { useLanguage } from '../../contexts/LanguageContext';

function money(v: number) {
  return new Intl.NumberFormat('vi-VN').format(Number(v) || 0) + 'đ';
}

interface CartSummarySidebarProps {
  session: CustomerSession | null;
  activeTab: OrderTab;
  onUpdateTab: (updater: (prev: OrderTab) => OrderTab) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  /** Có truyền => hiện ô ghi chú từng dòng (Enter khóa + nút Sửa). */
  onUpdateNote?: (productId: string, note: string) => void;
  onRemoveItem: (productId: string) => void;
  onAddUnlisted: (product: Product, quantity: number, note: string) => void;
  onSubmitOrder: () => void;
  submitting: boolean;
  errorMessage: string;
  earliestDate?: string;
  cutoffTimeStr?: string;
  /** Khách chưa đăng nhập: ẩn thông tin nhận hàng, nút chính chuyển sang đăng nhập. */
  guest?: boolean;
  /** false khi đặt trong trang giỏ hàng (không cần dính khi cuộn). */
  sticky?: boolean;
  /** false khi trang đã hiện danh sách hàng riêng (trang Giỏ hàng). */
  showItems?: boolean;
  /** Chiều cao đồng bộ với danh sách sản phẩm bên trái trên Desktop để chống lệch OCD */
  matchedHeight?: number;
}

export default function CartSummarySidebar({
  session,
  activeTab,
  onUpdateTab,
  onUpdateQty,
  onUpdateNote,
  onRemoveItem,
  onAddUnlisted,
  onSubmitOrder,
  submitting,
  errorMessage,
  earliestDate,
  cutoffTimeStr,
  guest = false,
  sticky = true,
  showItems = true,
  matchedHeight,
}: CartSummarySidebarProps) {
  const { t, productName, productUnit } = useLanguage();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const itemsListRef = useRef<HTMLDivElement | null>(null);
  const [isFillingInfo, setIsFillingInfo] = useState(false);

  // Lắng nghe sự kiện lăn chuột trên sidebar: Chỉ khóa cuộn trang khi đang thực sự điền thông tin
  useEffect(() => {
    const sidebarEl = sidebarRef.current;
    if (!sidebarEl) return;

    const handleWheel = (e: WheelEvent) => {
      const itemsEl = itemsListRef.current;

      // Khi người dùng ĐANG ĐIỀN THÔNG TIN trong input/textarea/select: Khóa cuộn trang
      if (isFillingInfo) {
        if (itemsEl && itemsEl.contains(e.target as Node)) {
          const { scrollTop, scrollHeight, clientHeight } = itemsEl;
          const canScroll = scrollHeight > clientHeight;
          if (!canScroll) {
            e.preventDefault();
            return;
          }
          if (
            (scrollTop <= 0 && e.deltaY < 0) ||
            (scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0)
          ) {
            e.preventDefault();
          }
        } else {
          e.preventDefault();
        }
        return;
      }

      // Khi KHÔNG điền thông tin: Rê chuột vào khung vẫn cuộn trang web mượt mà tự nhiên
    };

    sidebarEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => sidebarEl.removeEventListener('wheel', handleWheel);
  }, [isFillingInfo]);

  const totalItemsCount = activeTab.items.length;
  const totalQuantity = activeTab.items.reduce((sum, item) => sum + item.quantity, 0);
  const pendingPriceCount = activeTab.items.filter(item => item.product.priceOnRequest || item.product.price <= 0).length;
  const subtotalAmount = activeTab.items.reduce(
    (sum, item) => sum + item.quantity * (item.product.price || 0),
    0
  );

  return (
    <aside className={`space-y-3 ${sticky ? 'sticky top-34 z-20' : ''}`}>
      <div
        ref={sidebarRef}
        className="bg-white rounded-2xl border border-[#17231d]/12 shadow-sm overflow-hidden flex flex-col"
        style={matchedHeight ? { minHeight: matchedHeight } : undefined}
        onFocusCapture={(e) => {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            setIsFillingInfo(true);
          }
        }}
        onBlurCapture={(e) => {
          const next = e.relatedTarget as HTMLElement | null;
          const nextTag = next?.tagName;
          if (
            !next ||
            !e.currentTarget.contains(next) ||
            (nextTag !== 'INPUT' && nextTag !== 'TEXTAREA' && nextTag !== 'SELECT')
          ) {
            setIsFillingInfo(false);
          }
        }}
      >
        {/* 1. HEADER (shrink-0): Tab title & Item Count */}
        <div className="p-3.5 sm:p-4 border-b border-[#17231d]/10 bg-linear-to-r from-[#0b4f34]/5 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0f7a4f] text-white flex items-center justify-center shrink-0">
              <ShoppingBag size={16} />
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#17231d] leading-tight">
                {activeTab.title.startsWith('Đặt hàng ') ? `${t('Đặt hàng')} ${activeTab.title.slice('Đặt hàng '.length)}` : t(activeTab.title)}
              </h3>
              <p className="text-[11px] text-[#2c3a33] font-semibold">
                {totalItemsCount} {t('mặt hàng')} ({totalQuantity.toFixed(1)} {t('ĐVT')})
              </p>
            </div>
          </div>

          <span className="font-mono font-bold text-sm text-[#0f7a4f]">
            {money(subtotalAmount)}
          </span>
        </div>

        {/* 2. BODY: Danh sách món, thêm ngoài danh mục, ghi chú, giao nhận */}
        <div className="flex-1 divide-y divide-[#17231d]/8">
          {/* Danh sách các món trong đơn (scrollable khi >= 2 món) */}
          {showItems && (
            <div
              ref={itemsListRef}
              className="divide-y divide-[#17231d]/8 max-h-41.25 overflow-y-auto overscroll-contain px-2.5 py-1.5 space-y-1.5 scroll-smooth"
            >
              {activeTab.items.length === 0 ? (
                <div className="py-6 text-center text-[#2c3a33] font-semibold space-y-1">
                  <p className="text-xs font-bold text-[#17231d]">{t('Đơn hàng này chưa có món')}</p>
                  <p className="text-[11px] text-[#2c3a33] font-medium">{t('Chọn hàng từ danh mục hoặc thêm hàng ngoài danh mục.')}</p>
                </div>
              ) : (
                activeTab.items.map((item) => {
                  const lineTotal = item.quantity * (item.product.price || 0);
                  return (
                    <div
                      key={item.lineKey || item.product.id}
                      className="p-2 rounded-xl border border-[#17231d]/8 bg-[#fbfcfb] hover:bg-[#f4f8f5] transition-colors space-y-1.5"
                    >
                      {/* Hàng 1: Ảnh, Tên + ĐVT/Đơn giá, Stepper nằm cạnh, Nút Xóa */}
                      <div className="flex items-center justify-between gap-2.5">
                        <ProductThumbnail product={item.product} size="sm" className="w-10 h-10 rounded-lg shrink-0" />
                        <div className="min-w-0 flex-1 pr-1">
                          <p className="font-bold text-xs text-[#17231d] leading-snug line-clamp-1" title={item.product.name}>
                            {productName(item.product.name)}
                          </p>
                          <p className="text-[11px] font-semibold text-[#2c3a33] mt-0.5">
                            {productUnit(item.product.unit || 'Kg')} ·{' '}
                            <span className={item.product.priceOnRequest ? 'text-[#e0742f]' : 'text-[#0f7a4f]'}>
                              {item.product.isUnlisted ? t('Ngoài danh mục') : item.product.priceOnRequest ? t('Chờ báo giá') : money(item.product.price)}
                            </span>
                          </p>
                        </div>

                        {/* Bộ tăng giảm số lượng nằm ngay kế bên tên sản phẩm */}
                        <div className="shrink-0 flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-[#17231d]/15 shadow-2xs">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(
                                item.lineKey || item.product.id,
                                Math.max(0, Number((item.quantity - 1).toFixed(2)))
                              )
                            }
                            aria-label={t('Giảm')}
                            className="w-6 h-6 rounded-md bg-[#f5f7f3] font-bold text-xs text-[#17231d] hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center cursor-pointer select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0.001}
                            step="any"
                            value={item.quantity}
                            onWheel={(e) => (e.currentTarget as HTMLElement).blur()}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              onUpdateQty(item.lineKey || item.product.id, isNaN(v) ? 0 : v);
                            }}
                            className="w-9 text-center font-extrabold text-xs text-[#0b4f34] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(
                                item.lineKey || item.product.id,
                                Number((item.quantity + 1).toFixed(2))
                              )
                            }
                            aria-label={t('Tăng')}
                            className="w-6 h-6 rounded-md bg-[#0f7a4f] font-bold text-xs text-white hover:bg-[#0b4f34] flex items-center justify-center cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.lineKey || item.product.id)}
                          className="text-[#59665f] hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={t('Xóa món')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Hàng 2: Ghi chú sơ chế & Thành tiền dòng */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[#17231d]/10">
                        <div className="min-w-0 flex-1">
                          {item.note || onUpdateNote ? (
                            onUpdateNote ? (
                              <LineNoteEditor note={item.note} onSave={(value) => onUpdateNote(item.lineKey || item.product.id, value)} />
                            ) : (
                              <p className="text-[10px] text-[#0f7a4f] bg-[#0f7a4f]/5 px-2 py-0.5 rounded border border-[#0f7a4f]/15 italic">
                                📝 {item.note}
                              </p>
                            )
                          ) : null}
                        </div>
                        <div className="shrink-0 font-mono font-extrabold text-xs text-[#0f7a4f]">
                          {item.product.isUnlisted ? '0đ' : item.product.priceOnRequest ? t('Chờ báo giá') : money(lineTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {showItems && <div className="p-2.5"><UnlistedItemEntry onAdd={onAddUnlisted}/></div>}

          {/* Ghi chú chung cho toàn bộ đơn hàng */}
          <div className="p-3 bg-[#fbfcfb]">
            <input
              type="text"
              value={activeTab.note}
              onChange={(e) => onUpdateTab((t) => ({ ...t, note: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              placeholder={t('Ghi chú đơn (sơ chế, giao sớm, chia bao...)')}
              className="w-full bg-white border border-[#17231d]/15 rounded-xl px-3 py-2 text-xs text-[#17231d] placeholder:text-[#59665f]/60 focus:outline-none focus:border-[#0f7a4f]"
            />
          </div>

          {/* Thông tin giao nhận */}
          {!guest && (
            <div>
              <div className="w-full px-3.5 py-2.5 bg-[#f8faf7] flex items-center gap-1.5 text-xs font-bold text-[#17231d] border-b border-[#17231d]/8">
                <MapPin size={14} className="text-[#0f7a4f]" />
                <span>{t('Thông tin nhận hàng')}</span>
              </div>

              <div className="p-3.5 space-y-3 bg-white text-xs">
                  {/* Ngày & Ca giao hàng */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#2c3a33] uppercase tracking-wider mb-1">
                      {t('Ngày giao mong muốn')}
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#59665f]/60"
                        size={14}
                      />
                      <input
                        type="date"
                        min={earliestDate}
                        value={activeTab.deliveryDate}
                        onChange={(e) => onUpdateTab((t) => ({ ...t, deliveryDate: e.target.value }))}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-[#f8faf7] border border-[#17231d]/15 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#0f7a4f]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2c3a33] uppercase tracking-wider mb-1">
                      {t('Khung giờ / Ca giao')}
                    </label>
                    <div className="relative">
                      <Clock
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#59665f]/60"
                        size={14}
                      />
                      <select
                        value={activeTab.deliveryShift}
                        onChange={(e) => onUpdateTab((t) => ({ ...t, deliveryShift: e.target.value }))}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-[#f8faf7] border border-[#17231d]/15 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#0f7a4f] cursor-pointer"
                      >
                        <option value="Ca sáng sớm (05:00 - 07:00)">{t('Ca sáng sớm (05:00 - 07:00)')}</option>
                        <option value="Ca sáng (07:00 - 09:00)">{t('Ca sáng (07:00 - 09:00)')}</option>
                        <option value="Ca trưa (09:30 - 11:00)">{t('Ca trưa (09:30 - 11:00)')}</option>
                        <option value="Ca chiều (14:00 - 16:00)">{t('Ca chiều (14:00 - 16:00)')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Tên & SĐT người nhận */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block truncate text-[11px] font-bold text-[#2c3a33] uppercase tracking-wider mb-1">
                        {t('Người nhận')}
                      </label>
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 -translate-y-1/2 text-[#59665f]/50" size={13} />
                        <input
                          type="text"
                          value={activeTab.deliveryName}
                          onChange={(e) => onUpdateTab((t) => ({ ...t, deliveryName: e.target.value }))}
                          placeholder={t('Tên người nhận')}
                          className="w-full pl-7 pr-2 py-1.5 bg-[#f8faf7] border border-[#17231d]/15 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-[#0f7a4f]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block truncate text-[11px] font-bold text-[#2c3a33] uppercase tracking-wider mb-1">
                        {t('SĐT nhận')}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2 top-1/2 -translate-y-1/2 text-[#59665f]/50" size={13} />
                        <input
                          type="tel"
                          value={activeTab.deliveryPhone}
                          onChange={(e) => onUpdateTab((t) => ({ ...t, deliveryPhone: e.target.value }))}
                          placeholder={t('SĐT người nhận')}
                          className="w-full pl-7 pr-2 py-1.5 bg-[#f8faf7] border border-[#17231d]/15 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-[#0f7a4f]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ giao hàng */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#2c3a33] uppercase tracking-wider mb-1">
                      {t('Địa chỉ giao hàng')}
                    </label>
                    <textarea
                      rows={2}
                      value={activeTab.deliveryAddress}
                      onChange={(e) => onUpdateTab((t) => ({ ...t, deliveryAddress: e.target.value }))}
                      placeholder={t('Số nhà, đường, xưởng, bếp ăn...')}
                      className="w-full px-2.5 py-1.5 bg-[#f8faf7] border border-[#17231d]/15 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-[#0f7a4f] resize-none"
                    />
                  </div>

                  {/* Nút dùng địa chỉ mặc định */}
                  {session?.defaultShippingAddress?.address && (
                    <button
                      type="button"
                      onClick={() => {
                        const d = session.defaultShippingAddress!;
                        onUpdateTab((t) => ({
                          ...t,
                          deliveryName: d.name || t.deliveryName,
                          deliveryPhone: d.phone || t.deliveryPhone,
                          deliveryAddress: d.address || t.deliveryAddress,
                        }));
                      }}
                      className="text-[11px] text-[#0f7a4f] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin size={12} />
                      <span>{t('Dùng địa chỉ giao mặc định')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* 3. FOOTER CỐ ĐỊNH Ở ĐÁY (shrink-0 mt-auto): Tổng tiền, Tạm tính, Lưu ý, Nút Đặt hàng */}
        <div className="p-3.5 bg-[#fbfcfb] border-t border-[#17231d]/10 space-y-2.5 shrink-0 mt-auto">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#2c3a33] font-semibold">
              <span>{t('Tổng tiền hàng:')}</span>
              <span className="font-mono font-bold text-[#17231d]">{money(subtotalAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#17231d]/10">
              <span className="text-sm font-bold text-[#17231d]">{t('Tạm tính:')}</span>
              <span className="text-xl font-black font-mono text-[#0f7a4f]">
                {money(subtotalAmount)}
              </span>
            </div>
            <p className="text-[10px] text-[#59665f] flex items-center gap-1 leading-tight pt-0.5">
              <Info size={12} className="text-[#e0742f] shrink-0" />
              <span>{guest
                ? t('Đây là giá tham khảo. Sau khi đăng nhập, giỏ hàng tự cập nhật theo giá hợp đồng của quý khách.')
                : t('Giá đang theo bảng giá hiện hành. Mặt hàng nào cần báo giá, TPS1 sẽ xác nhận lại với quý khách.')}</span>
            </p>
            {!guest && earliestDate && <p className="text-xs text-[#2c3a33] font-semibold">{t('Ngày giao sớm nhất')}: {earliestDate}{cutoffTimeStr ? ` · ${t('Giờ chốt')}: ${cutoffTimeStr}` : ''}</p>}
            {pendingPriceCount > 0 && (
              <p className="text-[11px] font-semibold text-amber-900 rounded-lg bg-amber-50 p-2 leading-snug border border-amber-200">
                {t('Tạm tính chưa gồm hàng chờ giá')} ({pendingPriceCount}). {t('Kinh doanh sẽ báo giá trước khi xác nhận đơn.')}
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onSubmitOrder}
            disabled={submitting || totalItemsCount === 0}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-wider bg-[#0f7a4f] hover:bg-[#0b4f34] text-white shadow-lg shadow-[#0f7a4f]/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer touch-target uppercase"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('Đang gửi đơn...')}</span>
              </>
            ) : (
              <>
                <span>{guest ? t('Đăng nhập để đặt hàng') : t('Xác nhận đặt hàng')}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
