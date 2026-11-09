import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Search, ShoppingCart, Upload, XCircle } from 'lucide-react';
import { api, ApiError, requestFile, type ExcelMapping, type ExcelMatchResult, type ExcelPreviewResponse, type ExcelProduct, type Product } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { saveDocument } from '../lib/android-document';

const columns = ['sku', 'name', 'quantity', 'unit', 'note'] as const;
type Column = typeof columns[number];
type RowEdit = { quantity: string; unit: string; note: string };
const keyFor = (row: ExcelMatchResult) => `${row.sourceSheet}:${row.row}`;
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
const displayNumber = (value: number | null) => value == null ? '' : String(value);
const parseQuantity = (value: string) => Number(value.trim().replace(',', '.'));
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi-VN')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export default function ExcelOrderPage() {
  const { addItem } = useCart();
  const { session } = useAuth();
  const { t, errorText, productName } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [preview, setPreview] = useState<ExcelPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ExcelMapping | null>(null);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [chosen, setChosen] = useState<Record<string, ExcelProduct | Product>>({});
  const [searchText, setSearchText] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, Product[]>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState('');
  const [error, setError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [allowRepeat, setAllowRepeat] = useState(false);

  const duplicateKey = preview && session ? `tps1_excel_added_${session.id}_${preview.fileHash}` : '';
  const duplicate = Boolean(duplicateKey && localStorage.getItem(duplicateKey) === '1');

  const downloadTemplate = async () => {
    if (downloading) return;
    setDownloading(true); setError(''); setDownloadMessage('');
    try {
      const blob = await requestFile('/api/customer/order/import-excel');
      if (blob.size < 100) throw new Error('Invalid Excel file');
      if (Capacitor.getPlatform() === 'android') {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        const result = await saveDocument.save({ name: 'TPS1-mau-dat-hang.xlsx', data });
        if (result.saved) setDownloadMessage(t('File mẫu đã được lưu trên điện thoại'));
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'mau-dat-hang.xlsx'; anchor.style.display = 'none';
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        setDownloadMessage(t('File mẫu đã được tải xuống'));
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? errorText(cause) : t('Không tải được file mẫu, vui lòng thử lại'));
    } finally { setDownloading(false); }
  };

  const loadFile = async (file: File, customMapping?: ExcelMapping) => {
    setLoading(true); setError(''); setRowErrors({}); setAllowRepeat(false);
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error(t('Chỉ nhận file Excel tối đa 4 MB'));
      const response = await api.importExcel(file, customMapping);
      setPreview(response);
      const nextMapping = response.mapping || response.sheets[0]?.detectedMapping || {
        sheet: response.sheets[0]?.name || '', headerRow: 0, columns: {},
      };
      setMapping(nextMapping);
      setMappingOpen(response.needsMapping);
      setVisibleCount(30);
      setChosen({}); setSearchText({}); setSearchResults({});
      setSelected(new Set(response.results.filter((row) => row.status === 'matched').map(keyFor)));
      setEdits(Object.fromEntries(response.results.map((row) => [keyFor(row), {
        quantity: displayNumber(row.requestedQuantity), unit: row.unit || row.product?.unit || '', note: row.note,
      }])));
    } catch (cause) {
      setError(cause instanceof ApiError ? errorText(cause) : cause instanceof Error && cause.message === t('Chỉ nhận file Excel tối đa 4 MB') ? cause.message : t('Không đọc được file, vui lòng thử lại'));
    } finally { setLoading(false); }
  };

  const editRow = (key: string, change: Partial<RowEdit>) => {
    setEdits((current) => ({ ...current, [key]: { ...current[key], ...change } }));
    setRowErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  };
  const chooseProduct = (row: ExcelMatchResult, product: ExcelProduct | Product) => {
    const key = keyFor(row);
    setChosen((current) => ({ ...current, [key]: product }));
    setSelected((current) => new Set(current).add(key));
    setSearchResults((current) => ({ ...current, [key]: [] }));
  };
  const searchProducts = async (row: ExcelMatchResult) => {
    const key = keyFor(row);
    const query = (searchText[key] || row.name || row.sku).trim();
    if (!query) return;
    setSearching(key);
    try {
      const response = await api.products({ search: query, page: 0 });
      let products = response.products || [];
      if (!products.length) {
        const catalog = await api.productCatalog();
        const words = normalizeSearch(query).split(' ').filter(Boolean);
        products = catalog.items.filter(([, sku, name]) => words.every((word) =>
          normalizeSearch(`${sku} ${name} ${productName(name)}`).includes(word)))
          .slice(0, 30).map(([id, sku, name, category, unit, price, priceOnRequest]) => ({
            id, sku, name, category, unit, price, priceOnRequest, imageUrl: null, available: true,
          }));
      }
      setSearchResults((current) => ({ ...current, [key]: products }));
    } catch (cause) { setError(cause instanceof ApiError ? errorText(cause) : t('Không tìm được sản phẩm')); }
    finally { setSearching(''); }
  };

  const addSelected = async () => {
    if (!preview || adding || (duplicate && !allowRepeat)) return;
    const source = preview.results.filter((row) => selected.has(keyFor(row)));
    if (!source.length) { setError(t('Chọn ít nhất một mặt hàng')); return; }
    const invalid: Record<string, string> = {};
    const items = source.flatMap((row) => {
      const key = keyFor(row);
      const product = chosen[key] || row.product;
      const edit = edits[key];
      const quantity = parseQuantity(edit?.quantity || '');
      if (!product) { invalid[key] = t('Chọn sản phẩm TPS1'); return []; }
      if (!Number.isFinite(quantity) || quantity <= 0) { invalid[key] = t('Số lượng phải lớn hơn 0'); return []; }
      return [{ sourceSheet: row.sourceSheet, row: row.row, productId: product.id, quantity,
        unit: (edit?.unit || product.unit).trim(), note: edit?.note || '' }];
    });
    if (Object.keys(invalid).length) { setRowErrors(invalid); setError(t('Kiểm tra lại các dòng được đánh dấu')); return; }
    setAdding(true); setError(''); setRowErrors({});
    try {
      const response = await api.resolveExcel(items);
      const grouped = new Map<string, { item: typeof response.items[number]; quantity: number; notes: string[] }>();
      for (const item of response.items) {
        const existing = grouped.get(item.id);
        if (existing) { existing.quantity += item.quantity; if (item.note && !existing.notes.includes(item.note)) existing.notes.push(item.note); }
        else grouped.set(item.id, { item, quantity: item.quantity, notes: item.note ? [item.note] : [] });
      }
      for (const { item, quantity, notes } of grouped.values()) {
        addItem({ id: item.id, sku: item.sku, name: item.name, category: null, unit: item.unit,
          imageUrl: null, price: item.price, priceOnRequest: item.priceOnRequest, available: true,
          minOrderQty: item.minOrderQty, orderStep: item.orderStep, enforceOrderStep: item.enforceOrderStep },
          quantity, notes.join('; ').slice(0, 500));
      }
      if (duplicateKey) localStorage.setItem(duplicateKey, '1');
      navigate('/gio-hang');
    } catch (cause) {
      if (cause instanceof ApiError && Array.isArray(cause.details)) {
        setRowErrors(Object.fromEntries(cause.details.map((issue: { sourceSheet: string; row: number; message: string }) =>
          [`${issue.sourceSheet}:${issue.row}`, issue.message])));
      }
      setError(cause instanceof ApiError ? errorText(cause) : t('Không thêm được hàng, vui lòng thử lại'));
    } finally { setAdding(false); }
  };

  const selectedCount = selected.size;
  const skippedCount = (preview?.results.length || 0) - selectedCount;
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-[#14231c]">{t('Đặt hàng bằng file Excel')}</h1>
        <p className="mt-1 text-sm text-[#59665f]">{t('Tải file lên → kiểm tra sản phẩm → thêm vào giỏ')}</p>
      </header>
      <div className="flex flex-wrap gap-3">
        <button onClick={downloadTemplate} disabled={downloading} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#14231c]/15 px-4 font-medium text-[#14231c] disabled:opacity-60">
          <Download size={18}/>{t(downloading ? 'Đang tải file mẫu...' : 'Tải file mẫu')}
        </button>
        <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#0f7a4f] px-4 font-medium text-white disabled:opacity-50">
          <Upload size={18}/>{t(loading ? 'Đang xử lý...' : 'Chọn file Excel')}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) { fileRef.current = file; void loadFile(file); }
          event.target.value = '';
        }}/>
      </div>
      {fileRef.current && <p className="flex items-center gap-2 text-sm text-[#59665f]"><FileSpreadsheet size={16}/>{fileRef.current.name}</p>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {downloadMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{downloadMessage}</div>}

      {preview && mapping && (mappingOpen || preview.sheets.length > 1) && (
        <section className="rounded-2xl border border-[#14231c]/10 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-[#14231c]">{t('Chọn bảng và cột hàng')}</h2>
            {!preview.needsMapping && <button className="text-sm font-semibold text-[#0f7a4f]" onClick={() => setMappingOpen((open) => !open)}>{t(mappingOpen ? 'Thu gọn' : 'Đổi sheet hoặc cột')}</button>}
          </div>
          {mappingOpen && <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">{t('Sheet')}
                <select value={mapping.sheet} onChange={(event) => {
                  const sheet = preview.sheets.find((entry) => entry.name === event.target.value);
                  setMapping(sheet?.detectedMapping || { sheet: event.target.value, headerRow: 0, columns: {} });
                }} className="mt-1 block min-h-10 w-full rounded-lg border px-2">
                  {preview.sheets.map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{t('Dòng tiêu đề')}
                <select value={mapping.headerRow} onChange={(event) => setMapping({ ...mapping, headerRow: Number(event.target.value) })} className="mt-1 block min-h-10 w-full rounded-lg border px-2">
                  <option value={0}>{t('Không có tiêu đề')}</option>
                  {(preview.sheets.find((sheet) => sheet.name === mapping.sheet)?.rows || []).map((entry) => <option key={entry.row} value={entry.row}>{t('Dòng')} {entry.row}: {entry.cells.filter(Boolean).slice(0, 3).join(' · ').slice(0, 70)}</option>)}
                </select>
              </label>
              {columns.map((column) => <label key={column} className="text-sm font-semibold">{t(({ sku: 'Mã hàng', name: 'Tên hàng', quantity: 'Số lượng', unit: 'Đơn vị', note: 'Ghi chú' } as const)[column])}
                <select value={mapping.columns[column] ?? -1} onChange={(event) => setMapping({ ...mapping, columns: { ...mapping.columns, [column]: Number(event.target.value) < 0 ? undefined : Number(event.target.value) } })} className="mt-1 block min-h-10 w-full rounded-lg border px-2">
                  <option value={-1}>{t('Không dùng')}</option>
                  {Array.from({ length: 20 }, (_, index) => <option key={index} value={index}>{String.fromCharCode(65 + index)}</option>)}
                </select>
              </label>)}
            </div>
            <div className="overflow-x-auto rounded-xl border text-xs">
              <table className="min-w-full whitespace-nowrap"><tbody>
                {(preview.sheets.find((sheet) => sheet.name === mapping.sheet)?.rows || []).slice(0, 18).map((entry) => <tr key={entry.row} className={entry.row === mapping.headerRow ? 'bg-emerald-50 font-bold' : 'border-t'}>
                  <th className="sticky left-0 bg-white px-2 py-1.5 text-left">{entry.row}</th>
                  {entry.cells.slice(0, 12).map((cell, index) => <td key={index} className="max-w-44 truncate px-2 py-1.5">{cell}</td>)}
                </tr>)}
              </tbody></table>
            </div>
            <button onClick={() => fileRef.current && void loadFile(fileRef.current, mapping)} disabled={loading} className="min-h-11 rounded-xl bg-[#0f7a4f] px-5 font-bold text-white disabled:opacity-50">{t('Đọc lại theo cột đã chọn')}</button>
          </>}
        </section>
      )}

      {preview?.summary && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile label={t('Đã khớp')} value={preview.summary.matched || 0} icon={<CheckCircle2 size={17}/>} color="text-emerald-700"/>
        <SummaryTile label={t('Cần chọn')} value={preview.summary.ambiguous || 0} icon={<AlertTriangle size={17}/>} color="text-amber-700"/>
        <SummaryTile label={t('Chưa tìm thấy')} value={preview.summary.notFound || 0} icon={<XCircle size={17}/>} color="text-red-700"/>
        <SummaryTile label={t('Sai số lượng/đơn vị')} value={preview.summary.invalidQuantity || 0} icon={<XCircle size={17}/>} color="text-red-700"/>
      </div>}

      {preview && preview.results.length > 0 && <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-bold text-[#14231c]">{t('Kiểm tra mặt hàng')} ({preview.results.length})</h2></div>
        {preview.results.slice(0, visibleCount).map((row) => {
          const key = keyFor(row);
          const product = chosen[key] || row.product;
          const edit = edits[key];
          const isSelected = selected.has(key);
          return <article key={key} className={`rounded-2xl border bg-white p-3.5 sm:p-4 ${rowErrors[key] ? 'border-red-300' : isSelected ? 'border-emerald-200' : 'border-[#14231c]/10'}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" aria-label={`${t('Chọn dòng')} ${row.row}`} checked={isSelected} onChange={(event) => setSelected((current) => {
                const next = new Set(current); if (event.target.checked) next.add(key); else next.delete(key); return next;
              })} className="mt-1 size-5 shrink-0 accent-[#0f7a4f]"/>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="text-xs font-semibold text-[#59665f]">{row.sourceSheet} · {t('Dòng')} {row.row}</p>
                    <p className="font-semibold text-[#14231c] break-words">{row.name || row.sku}</p>
                    {row.sku && row.name !== row.sku && <p className="text-xs text-[#59665f]">{row.sku}</p>}
                  </div><StatusBadge status={row.status} selected={Boolean(chosen[key])} t={t}/>
                </div>
                {product && <p className="mt-2 text-sm text-[#0f7a4f]">→ {productName(product.name)} ({product.sku}) · {chosen[key] && row.suggestions?.some((candidate) => candidate.id === product.id) ? t('Giá kiểm tra khi thêm vào giỏ') : product.priceOnRequest ? t('Chờ sale báo giá') : money(product.price)}</p>}
                {row.warning && <p className="mt-1 text-xs text-amber-800">{t(row.warning)}</p>}
                {rowErrors[key] && <p className="mt-1 text-xs font-semibold text-red-700">{rowErrors[key]}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[110px_110px_1fr]">
                  <label className="text-xs text-[#59665f]">{t('Số lượng')}<input inputMode="decimal" value={edit?.quantity ?? ''} onChange={(event) => editRow(key, { quantity: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm text-[#14231c]"/></label>
                  <label className="text-xs text-[#59665f]">{t('Đơn vị')}<input value={edit?.unit ?? ''} onChange={(event) => editRow(key, { unit: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm text-[#14231c]"/></label>
                  <label className="col-span-2 text-xs text-[#59665f] sm:col-span-1">{t('Ghi chú')}<input value={edit?.note ?? ''} onChange={(event) => editRow(key, { note: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm text-[#14231c]"/></label>
                </div>
                {(row.suggestions?.length || row.status !== 'matched') ? <div className="mt-3 space-y-2">
                  {row.suggestions?.map((candidate) => <button key={candidate.id} onClick={() => chooseProduct(row, candidate)} className={`mr-2 rounded-lg border px-2.5 py-1.5 text-left text-xs ${product?.id === candidate.id ? 'border-emerald-600 bg-emerald-50' : 'border-[#14231c]/15'}`}>{productName(candidate.name)} · {candidate.sku}</button>)}
                  <div className="flex gap-2"><input value={searchText[key] ?? ''} onChange={(event) => setSearchText((current) => ({ ...current, [key]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchProducts(row); } }} placeholder={t('Tìm sản phẩm TPS1')} className="min-w-0 min-h-10 flex-1 rounded-lg border px-3 text-sm"/>
                    <button onClick={() => void searchProducts(row)} disabled={searching === key} className="min-h-10 rounded-lg border px-3 text-sm font-semibold disabled:opacity-50"><Search size={17}/></button></div>
                  {searchResults[key]?.length > 0 && <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">{searchResults[key].map((candidate) => <button key={candidate.id} onClick={() => chooseProduct(row, candidate)} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-emerald-50">{productName(candidate.name)} · {candidate.sku} · {candidate.unit}</button>)}</div>}
                </div> : null}
              </div>
            </div>
          </article>;
        })}
        {preview.results.length > visibleCount && <button onClick={() => setVisibleCount((count) => count + 30)} className="w-full rounded-xl border bg-white py-3 font-semibold text-[#0f7a4f]">{t('Hiện thêm mặt hàng')}</button>}
        <div className="sticky bottom-16 z-10 rounded-2xl border border-emerald-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm md:bottom-3">
          <p className="mb-2 text-xs text-[#59665f]">{t('Đã chọn')} {selectedCount}. {skippedCount > 0 && <>{skippedCount} {t('dòng không chọn sẽ bỏ qua')}.</>}</p>
          {duplicate && <label className="mb-2 flex items-center gap-2 text-sm text-amber-800"><input type="checkbox" checked={allowRepeat} onChange={(event) => setAllowRepeat(event.target.checked)}/>{t('File này đã thêm vào giỏ. Tôi muốn thêm lại.')}</label>}
          <button onClick={() => void addSelected()} disabled={adding || !selectedCount || (duplicate && !allowRepeat)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f7a4f] font-bold text-white disabled:opacity-50"><ShoppingCart size={18}/>{t(adding ? 'Đang kiểm tra...' : 'Thêm mặt hàng đã chọn vào giỏ')} ({selectedCount})</button>
        </div>
      </section>}
    </div>
  );
}

function SummaryTile({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return <div className="rounded-xl border border-[#14231c]/10 bg-white p-3 text-center"><div className={`flex items-center justify-center gap-1 font-bold ${color}`}>{icon}{value}</div><p className="mt-1 text-xs text-[#59665f]">{label}</p></div>;
}
function StatusBadge({ status, selected, t }: { status: ExcelMatchResult['status']; selected: boolean; t: (key: string) => string }) {
  const label = selected || status === 'matched' ? 'Đã khớp' : status === 'ambiguous' ? 'Cần chọn' : status === 'not_found' ? 'Chưa tìm thấy' : 'Sai số lượng/đơn vị';
  const color = selected || status === 'matched' ? 'bg-emerald-50 text-emerald-700' : status === 'ambiguous' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{t(label)}</span>;
}
