import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileSpreadsheet, Info, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart, lineKeyOf } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrderSubmit } from '../hooks/useOrderSubmit';
import CartSummarySidebar from '../components/products/CartSummarySidebar';
import UnlistedItemEntry from '../components/products/UnlistedItemEntry';
import { ProductImage, money, stepOf } from '../components/store/StoreProductCard';
import type { OrderItem } from '../components/products/OrderTabsBar';

function CartLineRow({ item }: { item: OrderItem }) {
  const { updateQty, updateNote, removeItem } = useCart();
  const { t, productName, productUnit } = useLanguage();
  const key = lineKeyOf(item);
  const step = stepOf(item.product);
  const priced = !item.product.isUnlisted && !item.product.priceOnRequest && item.product.price > 0;
  const content = (
    <>
      <p className="line-clamp-2 text-sm font-semibold text-[#17231d]">{productName(item.product.name)}</p>
      <p className="mt-0.5 text-xs text-[#59665f]">
        {productUnit(item.product.unit || 'Kg')} ·{' '}
        {item.product.isUnlisted
          ? <span className="text-amber-700">{t('Hàng ngoài danh mục · chờ báo giá')}</span>
          : priced ? money(item.product.price) : <span className="text-[#c4601f]">{t('Chờ báo giá')}</span>}
      </p>
    </>
  );

  return (
    <li className="flex gap-3 p-3 sm:p-4">
      {item.product.isUnlisted
        ? <ProductImage product={item.product} className="size-16 shrink-0 rounded-xl sm:size-20" />
        : <Link to={`/san-pham/${item.product.id}`} className="shrink-0"><ProductImage product={item.product} className="size-16 rounded-xl sm:size-20" /></Link>}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {item.product.isUnlisted ? content : <Link to={`/san-pham/${item.product.id}`} className="block hover:text-[#0b4f34]">{content}</Link>}
          </div>
          <button type="button" onClick={() => removeItem(key)} aria-label={t('Xoá')} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#8a9690] hover:bg-red-50 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex h-10 items-center rounded-xl border border-[#17231d]/12 bg-[#f8faf7]">
            <button type="button" aria-label={t('Giảm')} onClick={() => updateQty(key, Number((item.quantity - step).toFixed(3)))} className="flex size-10 items-center justify-center text-[#0f7a4f]"><Minus size={15} /></button>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={item.quantity}
              onChange={(e) => { const v = parseFloat(e.target.value); updateQty(key, Number.isNaN(v) ? 0 : v); }}
              className="w-14 bg-transparent text-center text-sm font-bold focus:outline-none"
            />
            <button type="button" aria-label={t('Tăng')} onClick={() => updateQty(key, Number((item.quantity + step).toFixed(3)))} className="flex size-10 items-center justify-center text-[#0f7a4f]"><Plus size={15} /></button>
          </div>
          <p className="text-base font-black text-[#0b4f34]">{priced ? money(item.quantity * item.product.price) : '—'}</p>
        </div>
        <input
          type="text"
          value={item.note || ''}
          onChange={(e) => updateNote(key, e.target.value)}
          placeholder={t('Ghi chú cho mặt hàng (cách sơ chế, quy cách...)')}
          className="h-9 w-full rounded-lg border border-transparent bg-[#f5f7f3] px-3 text-xs focus:border-[#0f7a4f]/40 focus:bg-white focus:outline-none"
        />
      </div>
    </li>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  const { tab, updateTab, updateQty, removeItem, addUnlisted, repricedCount, dismissRepriced } = useCart();
  const { submit, submitting, errorMessage, successOrder, clearSuccess, cutoffInfo } = useOrderSubmit();

  if (successOrder) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-2">
        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 text-center shadow-xl shadow-black/5 ring-1 ring-[#17231d]/8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-50 text-[#0f7a4f] ring-1 ring-emerald-200"><CheckCircle2 size={42} /></div>
          <h1 className="text-2xl font-black text-[#17231d]">{t('Cảm ơn quý khách, TPS1 đã nhận được đơn!')}</h1>
          <p className="text-sm text-[#59665f]">
            {t('Mã đơn hàng:')} <strong className="rounded-lg bg-[#0f7a4f]/10 px-2 py-0.5 font-mono text-base text-[#0f7a4f]">{successOrder.code}</strong>. {t('Đội ngũ TPS1 sẽ liên hệ xác nhận giá và lịch giao trong thời gian sớm nhất.')}
          </p>
          {session?.verificationStatus === 'pending' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t('Tài khoản của quý khách đang chờ xác minh. TPS1 sẽ xác minh tài khoản và xác nhận đơn cùng lúc.')}</p>}
          {successOrder.pendingPriceCount > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t('Đơn có mặt hàng chưa có giá. Nhân viên kinh doanh sẽ báo giá, hoặc bỏ món tạm hết hàng, trước khi xác nhận đơn với quý khách.')}</p>}
          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={() => { clearSuccess(); navigate('/'); }} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#17231d]/15 px-5 text-sm font-bold text-[#17231d] hover:bg-[#f5f7f3]"><ShoppingBag size={16} /> {t('Tiếp tục mua hàng')}</button>
            <button type="button" onClick={() => { clearSuccess(); navigate('/don-hang'); }} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0f7a4f] px-5 text-sm font-bold text-white hover:bg-[#0b4f34]">{t('Đơn hàng của tôi')} <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  if (tab.items.length === 0) {
    return (
      <div className="mx-auto my-6 max-w-md space-y-4 rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-[#17231d]/8">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-[#f5f7f3] text-[#59665f]/40"><ShoppingCart size={36} /></div>
        <div>
          <h1 className="text-lg font-bold text-[#17231d]">{t('Giỏ hàng đang trống')}</h1>
          <p className="mt-1 text-sm text-[#59665f]">{t('Quý khách chọn hàng từ danh mục, hoặc ghi tên mặt hàng chưa có sẵn để TPS1 báo giá riêng.')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f7a4f] px-6 text-sm font-bold text-white hover:bg-[#0b4f34]"><ShoppingBag size={16} /> {t('Xem cửa hàng')}</Link>
          {session && <Link to="/dat-hang/excel" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0f7a4f]/30 px-5 text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]"><FileSpreadsheet size={16} /> {t('Đặt từ Excel')}</Link>}
        </div>
        {session && <UnlistedItemEntry onAdd={addUnlisted} />}
      </div>
    );
  }

  const handleSubmit = () => {
    if (!session) { navigate(`/dang-nhap?quay-lai=${encodeURIComponent('/gio-hang')}`); return; }
    void submit();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-[#17231d]">{t('Giỏ hàng')} <span className="text-base font-semibold text-[#59665f]">({tab.items.length} {t('mặt hàng')})</span></h1>

      {repricedCount > 0 && (
        <div className="flex items-start gap-2 rounded-2xl bg-[#eaf6ef] p-3 text-sm text-[#0b4f34] ring-1 ring-[#0f7a4f]/15">
          <Info size={17} className="mt-0.5 shrink-0" />
          <p className="flex-1">{t('Đã cập nhật giá theo hợp đồng của quý khách cho')} {repricedCount} {t('mặt hàng trong giỏ.')}</p>
          <button type="button" onClick={dismissRepriced} aria-label={t('Đóng')} className="text-[#0b4f34]/70"><X size={16} /></button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <ul className="divide-y divide-[#17231d]/6 overflow-hidden rounded-3xl bg-white ring-1 ring-[#17231d]/6">
            {tab.items.map((item) => <CartLineRow key={lineKeyOf(item)} item={item} />)}
          </ul>
          {session && <div className="rounded-2xl bg-white p-3 ring-1 ring-[#17231d]/6"><UnlistedItemEntry onAdd={addUnlisted} /></div>}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0f7a4f] hover:underline"><ShoppingBag size={15} /> {t('Tiếp tục chọn hàng')}</Link>
            {session && <Link to="/dat-hang/excel" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0f7a4f] hover:underline"><FileSpreadsheet size={15} /> {t('Thêm hàng từ file Excel')}</Link>}
          </div>
        </div>

        <div className="lg:sticky lg:top-[150px]">
          <CartSummarySidebar
            session={session}
            activeTab={tab}
            onUpdateTab={updateTab}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onAddUnlisted={addUnlisted}
            onSubmitOrder={handleSubmit}
            submitting={submitting}
            errorMessage={errorMessage}
            earliestDate={cutoffInfo?.earliestDate}
            cutoffTimeStr={cutoffInfo?.cutoffTimeStr}
            guest={!session}
            sticky={false}
            showItems={false}
          />
        </div>
      </div>
    </div>
  );
}
