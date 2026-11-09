import { useId, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function UnlistedItemEntry({ onAdd, initialOpen = false }: { onAdd: (product: Product, quantity: number, note: string) => void; initialOpen?: boolean }) {
  const { t } = useLanguage();
  const unitsId = useId();
  const [open, setOpen] = useState(initialOpen);
  const [name, setName] = useState('');
  const [quantityText, setQuantityText] = useState('1');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const quantity = Number(quantityText.trim().replace(',', '.'));
    if (!name.trim() || !unit.trim()) { setError(t('Nhập tên và đơn vị hàng ngoài danh mục')); return; }
    if (!Number.isFinite(quantity) || quantity < 0.001 || quantity > 999999
      || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 1e-7) {
      setError(t('Số lượng từ 0,001 đến 999.999, tối đa 3 chữ số thập phân')); return;
    }
    onAdd({ id: `unlisted:${crypto.randomUUID()}`, sku: '', name: name.trim(), category: null,
      unit: unit.trim(), imageUrl: '/product-unlisted.svg', price: 0, priceOnRequest: true,
      isUnlisted: true, available: true }, quantity, note.trim());
    setName(''); setQuantityText('1'); setUnit(''); setNote(''); setError(''); setOpen(false);
  };

  return <section className="rounded-2xl border border-dashed border-[#0f7a4f]/40 bg-white p-3.5 sm:p-4 text-left">
    <button type="button" aria-expanded={open} onClick={() => { setOpen((value) => !value); setError(''); }}
      className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-bold text-[#0b4f34]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50"><Plus size={18}/></span>
      {t('Thêm sản phẩm ngoài danh mục')}
    </button>
    {open && <form onSubmit={submit} className="mt-3 space-y-3 border-t border-[#17231d]/10 pt-3">
      <p className="text-xs text-[#59665f]">{t('Tạm tính 0đ · Sale sẽ xác nhận hàng và báo giá')}</p>
      <label className="block text-xs font-semibold text-[#17231d]">{t('Tên sản phẩm')}
        <input required autoFocus maxLength={200} value={name} onChange={(event) => setName(event.target.value)}
          placeholder={t('Nhập tên sản phẩm cần mua')} className="mt-1 min-h-11 w-full rounded-xl border border-[#17231d]/15 px-3 text-sm font-normal focus:border-[#0f7a4f] focus:outline-none"/>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block min-w-0 text-xs font-semibold text-[#17231d]">{t('Số lượng')}
          <input required inputMode="decimal" value={quantityText} onChange={(event) => setQuantityText(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-[#17231d]/15 px-3 text-sm font-normal focus:border-[#0f7a4f] focus:outline-none"/>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[#17231d]">{t('Đơn vị tính')}
          <input required maxLength={50} list={unitsId} value={unit} onChange={(event) => setUnit(event.target.value)}
            placeholder={t('Ví dụ: Kg, thùng')} className="mt-1 min-h-11 w-full rounded-xl border border-[#17231d]/15 px-3 text-sm font-normal focus:border-[#0f7a4f] focus:outline-none"/>
          <datalist id={unitsId}>{['Kg', 'Cái', 'Bịch', 'Thùng', 'Hộp', 'Chai', 'Gói', 'Lít', 'Bộ'].map((value) => <option key={value} value={value}/>)}</datalist>
        </label>
      </div>
      <label className="block text-xs font-semibold text-[#17231d]">{t('Ghi chú')} <span className="font-normal text-[#59665f]">({t('không bắt buộc')})</span>
        <input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-[#17231d]/15 px-3 text-sm font-normal focus:border-[#0f7a4f] focus:outline-none"/>
      </label>
      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
      <button type="submit" className="min-h-11 w-full rounded-xl bg-[#0f7a4f] px-4 text-sm font-bold text-white">{t('Thêm vào giỏ hàng')}</button>
    </form>}
  </section>;
}
