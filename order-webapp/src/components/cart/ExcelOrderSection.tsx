import { forwardRef, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  ShoppingCart,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  api,
  ApiError,
  requestFile,
  type ExcelMapping,
  type ExcelMatchResult,
  type ExcelPreviewResponse,
  type ExcelProduct,
  type Product,
} from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { saveDocument } from '../../lib/android-document';

const columns = ['sku', 'name', 'quantity', 'unit', 'note'] as const;
type RowEdit = { name: string; quantity: string; unit: string; note: string };
const keyFor = (row: ExcelMatchResult) => `${row.sourceSheet}:${row.row}`;
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
const displayNumber = (value: number | null) => (value == null ? '' : String(value));
const parseQuantity = (value: string) => Number(value.trim().replace(',', '.'));
const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

function SummaryTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#14231c]/10 bg-white p-2.5 text-center shadow-xs">
      <div className={`flex items-center justify-center gap-1 font-bold ${color}`}>
        {icon}
        {value}
      </div>
      <p className="mt-1 text-xs text-[#59665f]">{label}</p>
    </div>
  );
}

function StatusBadge({
  status,
  selected,
  unlisted,
  t,
}: {
  status: ExcelMatchResult['status'];
  selected: boolean;
  unlisted: boolean;
  t: (key: string) => string;
}) {
  const label = unlisted
    ? 'Ngoài danh mục'
    : selected || status === 'matched'
    ? 'Đã khớp'
    : status === 'ambiguous'
    ? 'Cần chọn'
    : status === 'not_found'
    ? 'Chưa tìm thấy'
    : 'Sai số lượng/đơn vị';
  const color = unlisted
    ? 'bg-amber-50 text-amber-800'
    : selected || status === 'matched'
    ? 'bg-emerald-50 text-emerald-700'
    : status === 'ambiguous'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-red-50 text-red-700';
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{t(label)}</span>;
}

interface ExcelOrderSectionProps {
  autoFocusHighlight?: boolean;
}

export const ExcelOrderSection = forwardRef<HTMLDivElement, ExcelOrderSectionProps>(
  function ExcelOrderSection({ autoFocusHighlight }, ref) {
    const { addItem } = useCart();
    const { session } = useAuth();
    const { t, errorText, productName } = useLanguage();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<File | null>(null);

    const [preview, setPreview] = useState<ExcelPreviewResponse | null>(null);
    const [mapping, setMapping] = useState<ExcelMapping | null>(null);
    const [mappingOpen, setMappingOpen] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [edits, setEdits] = useState<Record<string, RowEdit>>({});
    const [chosen, setChosen] = useState<Record<string, ExcelProduct | Product>>({});
    const [unlisted, setUnlisted] = useState<Set<string>>(new Set());
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
    const [successMessage, setSuccessMessage] = useState('');

    const duplicateKey = preview && session ? `tps1_excel_added_${session.id}_${preview.fileHash}` : '';
    const duplicate = Boolean(duplicateKey && localStorage.getItem(duplicateKey) === '1');

    const downloadTemplate = async () => {
      if (downloading) return;
      setDownloading(true);
      setError('');
      setDownloadMessage('');
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
          anchor.href = url;
          anchor.download = 'mau-dat-hang.xlsx';
          anchor.style.display = 'none';
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1500);
          setDownloadMessage(t('File mẫu đã được tải xuống'));
        }
      } catch (cause) {
        setError(cause instanceof ApiError ? errorText(cause) : t('Không tải được file mẫu, vui lòng thử lại'));
      } finally {
        setDownloading(false);
      }
    };

    const loadFile = async (file: File, customMapping?: ExcelMapping) => {
      setLoading(true);
      setError('');
      setRowErrors({});
      setAllowRepeat(false);
      setSuccessMessage('');
      try {
        if (file.size > 4 * 1024 * 1024) throw new Error(t('Chỉ nhận file Excel tối đa 4 MB'));
        const response = await api.importExcel(file, customMapping);
        setPreview(response);
        const nextMapping =
          response.mapping ||
          response.sheets[0]?.detectedMapping || {
            sheet: response.sheets[0]?.name || '',
            headerRow: 0,
            columns: {},
          };
        setMapping(nextMapping);
        setMappingOpen(response.needsMapping);
        setVisibleCount(30);
        setChosen({});
        setUnlisted(new Set());
        setSearchText({});
        setSearchResults({});
        setSelected(new Set(response.results.filter((row) => row.status === 'matched').map(keyFor)));
        setEdits(
          Object.fromEntries(
            response.results.map((row) => [
              keyFor(row),
              {
                name: row.name || row.sku,
                quantity: displayNumber(row.requestedQuantity),
                unit: row.unit || row.product?.unit || '',
                note: row.note,
              },
            ])
          )
        );
      } catch (cause) {
        setError(
          cause instanceof ApiError
            ? errorText(cause)
            : cause instanceof Error && cause.message === t('Chỉ nhận file Excel tối đa 4 MB')
            ? cause.message
            : t('Không đọc được file, vui lòng thử lại')
        );
      } finally {
        setLoading(false);
      }
    };

    const editRow = (key: string, change: Partial<RowEdit>) => {
      setEdits((current) => ({ ...current, [key]: { ...current[key], ...change } }));
      setRowErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    };

    const chooseProduct = (row: ExcelMatchResult, product: ExcelProduct | Product) => {
      const key = keyFor(row);
      setChosen((current) => ({ ...current, [key]: product }));
      setUnlisted((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      setSelected((current) => new Set(current).add(key));
      setSearchResults((current) => ({ ...current, [key]: [] }));
    };

    const chooseUnlisted = (row: ExcelMatchResult) => {
      const key = keyFor(row);
      setUnlisted((current) => new Set(current).add(key));
      setChosen((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSelected((current) => new Set(current).add(key));
      setRowErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
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
          products = catalog.items
            .filter(([, sku, name]) =>
              words.every((word) => normalizeSearch(`${sku} ${name} ${productName(name)}`).includes(word))
            )
            .slice(0, 30)
            .map(([id, sku, name, category, unit, price, priceOnRequest]) => ({
              id,
              sku,
              name,
              category,
              unit,
              price,
              priceOnRequest,
              imageUrl: null,
              available: true,
            }));
        }
        setSearchResults((current) => ({ ...current, [key]: products }));
      } catch (cause) {
        setError(cause instanceof ApiError ? errorText(cause) : t('Không tìm được sản phẩm'));
      } finally {
        setSearching('');
      }
    };

    const addSelected = async () => {
      if (!preview || adding || (duplicate && !allowRepeat)) return;
      const source = preview.results.filter((row) => selected.has(keyFor(row)));
      if (!source.length) {
        setError(t('Chọn ít nhất một mặt hàng'));
        return;
      }
      const invalid: Record<string, string> = {};
      const items = source.flatMap((row) => {
        const key = keyFor(row);
        const product = unlisted.has(key) ? null : chosen[key] || row.product;
        const edit = edits[key];
        const quantity = parseQuantity(edit?.quantity || '');
        if (!product && !unlisted.has(key)) {
          invalid[key] = t('Chọn sản phẩm TPS1');
          return [];
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
          invalid[key] = t('Số lượng phải lớn hơn 0');
          return [];
        }
        if (unlisted.has(key) && (!edit?.name.trim() || !edit?.unit.trim())) {
          invalid[key] = t('Nhập tên và đơn vị hàng ngoài danh mục');
          return [];
        }
        return [
          {
            sourceSheet: row.sourceSheet,
            row: row.row,
            productId: product?.id || '',
            quantity,
            unit: (edit?.unit || product?.unit || '').trim(),
            note: edit?.note || '',
            unlisted: unlisted.has(key),
            name: unlisted.has(key) ? edit.name.trim() : undefined,
          },
        ];
      });
      if (Object.keys(invalid).length) {
        setRowErrors(invalid);
        setError(t('Kiểm tra lại các dòng được đánh dấu'));
        return;
      }
      setAdding(true);
      setError('');
      setRowErrors({});
      try {
        const response = await api.resolveExcel(items);
        const grouped = new Map<string, { item: (typeof response.items)[number]; quantity: number; notes: string[] }>();
        for (const item of response.items) {
          const existing = item.isUnlisted ? undefined : grouped.get(item.id);
          if (existing) {
            existing.quantity += item.quantity;
            if (item.note && !existing.notes.includes(item.note)) existing.notes.push(item.note);
          } else grouped.set(item.id, { item, quantity: item.quantity, notes: item.note ? [item.note] : [] });
        }
        for (const { item, quantity, notes } of grouped.values()) {
          addItem(
            {
              id: item.id,
              sku: item.sku,
              name: item.name,
              category: null,
              unit: item.unit,
              imageUrl: item.isUnlisted ? '/product-unlisted.svg' : null,
              price: item.price,
              priceOnRequest: item.priceOnRequest,
              isUnlisted: item.isUnlisted,
              available: true,
              minOrderQty: item.minOrderQty,
              orderStep: item.orderStep,
              enforceOrderStep: item.enforceOrderStep,
            },
            quantity,
            notes.join('; ').slice(0, 500)
          );
        }
        if (duplicateKey) localStorage.setItem(duplicateKey, '1');
        setSuccessMessage(`${t('Đã thêm thành công')} ${grouped.size} ${t('mặt hàng từ file Excel vào giỏ hàng!')}`);
        setPreview(null);
        fileRef.current = null;
      } catch (cause) {
        if (cause instanceof ApiError && Array.isArray(cause.details)) {
          setRowErrors(
            Object.fromEntries(
              cause.details.map((issue: { sourceSheet: string; row: number; message: string }) => [
                `${issue.sourceSheet}:${issue.row}`,
                issue.message,
              ])
            )
          );
        }
        setError(cause instanceof ApiError ? errorText(cause) : t('Không thêm được hàng, vui lòng thử lại'));
      } finally {
        setAdding(false);
      }
    };

    const selectedCount = selected.size;
    const skippedCount = (preview?.results.length || 0) - selectedCount;

    return (
      <div
        ref={ref}
        id="excel-order-section"
        className={`scroll-mt-36 sm:scroll-mt-40 rounded-3xl border-2 border-dashed transition-all duration-300 p-4 sm:p-5 ${
          autoFocusHighlight
            ? 'border-[#0f7a4f] bg-emerald-50/60 ring-4 ring-[#0f7a4f]/20 shadow-md'
            : 'border-[#0f7a4f]/40 bg-linear-to-r from-emerald-50/40 via-white to-emerald-50/20'
        }`}
      >
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f7a4f] text-white shadow-xs">
              <FileSpreadsheet size={24} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-base sm:text-lg font-black text-[#17231d]">
                  {t('Đặt hàng nhanh bằng file Excel')}
                </h2>
                <span className="inline-flex items-center rounded-md bg-[#0f7a4f]/10 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-[#0f7a4f]">
                  {t('Bếp ăn & Trường học')}
                </span>
              </div>
              <p className="mt-0.5 text-xs sm:text-[13px] text-[#59665f]">
                {t('Tải file mẫu Excel, điền số lượng và tải lên để hệ thống tự động thêm nguyên liệu vào giỏ hàng.')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:shrink-0 sm:self-center">
            <button
              type="button"
              onClick={downloadTemplate}
              disabled={downloading}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#bfd8c9] bg-white px-3 py-2 text-[11.5px] sm:text-xs font-semibold text-[#0f7a4f] transition hover:bg-[#f0f8f3] disabled:opacity-60 shadow-xs whitespace-nowrap"
            >
              <Download size={15} className="shrink-0" />
              <span>{t(downloading ? 'Đang tải...' : 'Tải file mẫu')}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-[#0f7a4f] px-3 py-2 text-[11.5px] sm:text-xs font-semibold text-white shadow-xs transition hover:bg-[#0c613e] disabled:opacity-60 whitespace-nowrap"
            >
              <Upload size={15} className="shrink-0" />
              <span>{t(loading ? 'Đang đọc...' : 'Chọn file Excel tải lên')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  fileRef.current = file;
                  void loadFile(file);
                }
                event.target.value = '';
              }}
            />
          </div>
        </div>

        {/* Status messages */}
        {downloadMessage && (
          <div role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            {downloadMessage}
          </div>
        )}
        {successMessage && (
          <div role="status" className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-100/70 p-3 text-xs font-bold text-[#0b4f34]">
            <span className="flex items-center gap-1.5"><Check size={16} />{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage('')} className="text-[#0b4f34]/70 hover:text-[#0b4f34]"><X size={15} /></button>
          </div>
        )}
        {error && (
          <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {fileRef.current && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#0f7a4f]">
            <FileSpreadsheet size={15} />
            <span>{fileRef.current.name}</span>
            <span className="text-[#59665f] font-normal">({(fileRef.current.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {/* Sheet / Column Mapping Section */}
        {preview && mapping && (mappingOpen || preview.sheets.length > 1) && (
          <section className="mt-4 space-y-4 rounded-2xl border border-[#14231c]/10 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-[#14231c] text-sm">{t('Chọn bảng và cột hàng')}</h3>
              {!preview.needsMapping && (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#0f7a4f] hover:underline"
                  onClick={() => setMappingOpen((open) => !open)}
                >
                  {t(mappingOpen ? 'Thu gọn' : 'Đổi sheet hoặc cột')}
                </button>
              )}
            </div>
            {mappingOpen && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <label className="font-semibold">
                    {t('Sheet')}
                    <select
                      value={mapping.sheet}
                      onChange={(event) => {
                        const sheet = preview.sheets.find((entry) => entry.name === event.target.value);
                        setMapping(sheet?.detectedMapping || { sheet: event.target.value, headerRow: 0, columns: {} });
                      }}
                      className="mt-1 block h-9 w-full rounded-lg border px-2 text-xs"
                    >
                      {preview.sheets.map((sheet) => (
                        <option key={sheet.name} value={sheet.name}>
                          {sheet.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="font-semibold">
                    {t('Dòng tiêu đề')}
                    <select
                      value={mapping.headerRow}
                      onChange={(event) => setMapping({ ...mapping, headerRow: Number(event.target.value) })}
                      className="mt-1 block h-9 w-full rounded-lg border px-2 text-xs"
                    >
                      <option value={0}>{t('Không có tiêu đề')}</option>
                      {(preview.sheets.find((sheet) => sheet.name === mapping.sheet)?.rows || []).map((entry) => (
                        <option key={entry.row} value={entry.row}>
                          {t('Dòng')} {entry.row}: {entry.cells.filter(Boolean).slice(0, 3).join(' · ').slice(0, 70)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {columns.map((column) => (
                    <label key={column} className="font-semibold">
                      {t(
                        ({
                          sku: 'Mã hàng',
                          name: 'Tên hàng',
                          quantity: 'Số lượng',
                          unit: 'Đơn vị',
                          note: 'Ghi chú',
                        } as const)[column]
                      )}
                      <select
                        value={mapping.columns[column] ?? -1}
                        onChange={(event) =>
                          setMapping({
                            ...mapping,
                            columns: {
                              ...mapping.columns,
                              [column]: Number(event.target.value) < 0 ? undefined : Number(event.target.value),
                            },
                          })
                        }
                        className="mt-1 block h-9 w-full rounded-lg border px-2 text-xs"
                      >
                        <option value={-1}>{t('Không dùng')}</option>
                        {Array.from({ length: 20 }, (_, index) => (
                          <option key={index} value={index}>
                            {String.fromCharCode(65 + index)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current && void loadFile(fileRef.current, mapping)}
                  disabled={loading}
                  className="h-9 rounded-xl bg-[#0f7a4f] px-4 text-xs font-bold text-white hover:bg-[#0b4f34] disabled:opacity-50"
                >
                  {t('Đọc lại theo cột đã chọn')}
                </button>
              </>
            )}
          </section>
        )}

        {/* Summary badges */}
        {preview?.summary && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryTile label={t('Đã khớp')} value={preview.summary.matched || 0} icon={<CheckCircle2 size={16} />} color="text-emerald-700" />
            <SummaryTile label={t('Cần chọn')} value={preview.summary.ambiguous || 0} icon={<AlertTriangle size={16} />} color="text-amber-700" />
            <SummaryTile label={t('Chưa tìm thấy')} value={preview.summary.notFound || 0} icon={<XCircle size={16} />} color="text-red-700" />
            <SummaryTile label={t('Sai số lượng')} value={preview.summary.invalidQuantity || 0} icon={<XCircle size={16} />} color="text-red-700" />
          </div>
        )}

        {/* Row checking & editing */}
        {preview && preview.results.length > 0 && (
          <section className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#14231c] text-sm">
                {t('Kiểm tra mặt hàng nhận diện')} ({preview.results.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (selected.size === preview.results.length) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(preview.results.map(keyFor)));
                  }
                }}
                className="text-xs font-semibold text-[#0f7a4f] hover:underline"
              >
                {selected.size === preview.results.length ? t('Bỏ chọn tất cả') : t('Chọn tất cả')}
              </button>
            </div>

            <div className="space-y-2.5 max-h-105 overflow-y-auto pr-1">
              {preview.results.slice(0, visibleCount).map((row) => {
                const key = keyFor(row);
                const product = unlisted.has(key) ? null : chosen[key] || row.product;
                const edit = edits[key];
                const isSelected = selected.has(key);
                return (
                  <article
                    key={key}
                    className={`rounded-2xl border bg-white p-3 sm:p-3.5 transition ${
                      rowErrors[key] ? 'border-red-300 bg-red-50/20' : isSelected ? 'border-emerald-300 ring-1 ring-emerald-300/30' : 'border-[#14231c]/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        aria-label={`${t('Chọn dòng')} ${row.row}`}
                        checked={isSelected}
                        onChange={(event) =>
                          setSelected((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(key);
                            else next.delete(key);
                            return next;
                          })
                        }
                        className="mt-1 size-4.5 shrink-0 accent-[#0f7a4f]"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex flex-wrap items-start justify-between gap-1.5">
                          <div>
                            <p className="text-[11px] font-semibold text-[#59665f]">
                              {row.sourceSheet} · {t('Dòng')} {row.row}
                            </p>
                            <p className="font-bold text-[#14231c] wrap-break-word text-sm">{row.name || row.sku}</p>
                            {row.sku && row.name !== row.sku && <p className="text-[11px] text-[#59665f]">{row.sku}</p>}
                          </div>
                          <StatusBadge status={row.status} selected={Boolean(chosen[key])} unlisted={unlisted.has(key)} t={t} />
                        </div>

                        {product && (
                          <p className="mt-1.5 text-xs font-semibold text-[#0f7a4f]">
                            → {productName(product.name)} ({product.sku}) ·{' '}
                            {chosen[key] && row.suggestions?.some((candidate) => candidate.id === product.id)
                              ? t('Giá kiểm tra khi thêm vào giỏ')
                              : product.priceOnRequest
                              ? t('Chờ sale báo giá')
                              : money(product.price)}
                          </p>
                        )}
                        {row.warning && <p className="mt-1 text-xs text-amber-800">{t(row.warning)}</p>}
                        {rowErrors[key] && <p className="mt-1 text-xs font-semibold text-red-700">{rowErrors[key]}</p>}

                        {unlisted.has(key) && (
                          <>
                            <p className="mt-1.5 text-xs font-semibold text-amber-800">
                              {t('Hàng ngoài danh mục · Tạm tính 0đ · TPS1 sẽ báo giá')}
                            </p>
                            <label className="mt-1.5 block text-xs text-[#59665f]">
                              {t('Tên hàng cần mua')}
                              <input
                                value={edit?.name ?? ''}
                                onChange={(event) => editRow(key, { name: event.target.value })}
                                className="mt-1 h-8 w-full rounded-lg border px-2 text-xs text-[#14231c]"
                              />
                            </label>
                          </>
                        )}

                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[100px_100px_1fr]">
                          <label className="text-[11px] text-[#59665f]">
                            {t('Số lượng')}
                            <input
                              inputMode="decimal"
                              value={edit?.quantity ?? ''}
                              onChange={(event) => editRow(key, { quantity: event.target.value })}
                              className="mt-0.5 h-8 w-full rounded-lg border px-2 text-xs font-bold text-[#14231c]"
                            />
                          </label>
                          <label className="text-[11px] text-[#59665f]">
                            {t('Đơn vị')}
                            <input
                              value={edit?.unit ?? ''}
                              onChange={(event) => editRow(key, { unit: event.target.value })}
                              className="mt-0.5 h-8 w-full rounded-lg border px-2 text-xs text-[#14231c]"
                            />
                          </label>
                          <label className="col-span-2 text-[11px] text-[#59665f] sm:col-span-1">
                            {t('Ghi chú')}
                            <input
                              value={edit?.note ?? ''}
                              onChange={(event) => editRow(key, { note: event.target.value })}
                              placeholder={t('Sơ chế, đóng gói...')}
                              className="mt-0.5 h-8 w-full rounded-lg border px-2 text-xs text-[#14231c]"
                            />
                          </label>
                        </div>

                        {row.suggestions?.length || row.status !== 'matched' || unlisted.has(key) ? (
                          <div className="mt-2 space-y-1.5">
                            {unlisted.has(key) && row.product && (
                              <button
                                type="button"
                                onClick={() => chooseProduct(row, row.product!)}
                                className="rounded-lg border border-[#14231c]/15 px-2 py-1 text-left text-xs hover:bg-[#f5f7f3]"
                              >
                                {t('Dùng sản phẩm đã khớp')} · {productName(row.product.name)}
                              </button>
                            )}
                            {Boolean(row.suggestions?.length) && (
                              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-[#14231c]/10 p-1">
                                {row.suggestions?.map((candidate) => (
                                  <button
                                    type="button"
                                    key={candidate.id}
                                    onClick={() => chooseProduct(row, candidate)}
                                    className={`block w-full rounded-lg border px-2 py-1 text-left text-xs ${
                                      product?.id === candidate.id ? 'border-emerald-600 bg-emerald-50' : 'border-[#14231c]/15 hover:bg-[#f5f7f3]'
                                    }`}
                                  >
                                    {productName(candidate.name)} · {candidate.sku} · {candidate.unit}
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-1.5">
                              <input
                                value={searchText[key] ?? ''}
                                onChange={(event) => setSearchText((current) => ({ ...current, [key]: event.target.value }))}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void searchProducts(row);
                                  }
                                }}
                                placeholder={t('Tìm sản phẩm TPS1')}
                                className="h-8 min-w-0 flex-1 rounded-lg border px-2.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => void searchProducts(row)}
                                disabled={searching === key}
                                className="h-8 rounded-lg border px-2.5 text-xs font-semibold hover:bg-[#f5f7f3] disabled:opacity-50"
                              >
                                <Search size={14} />
                              </button>
                            </div>
                            {searchResults[key]?.length > 0 && (
                              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border p-1.5">
                                {searchResults[key].map((candidate) => (
                                  <button
                                    type="button"
                                    key={candidate.id}
                                    onClick={() => chooseProduct(row, candidate)}
                                    className="block w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-emerald-50"
                                  >
                                    {productName(candidate.name)} · {candidate.sku} · {candidate.unit}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => chooseUnlisted(row)}
                          className={`mt-2 h-7 rounded-lg border px-2.5 text-left text-[11px] font-semibold transition ${
                            unlisted.has(key) ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-[#14231c]/15 text-[#59665f] hover:bg-[#f5f7f3]'
                          }`}
                        >
                          {t('Không có trong danh mục · 0đ')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {preview.results.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 30)}
                className="w-full rounded-xl border bg-white py-2 text-xs font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]"
              >
                {t('Hiện thêm mặt hàng')} (+30)
              </button>
            )}

            {/* Bottom Add-to-cart Bar */}
            <div className="rounded-2xl border border-emerald-300 bg-white p-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <p className="text-xs text-[#59665f]">
                  {t('Đã chọn')} <strong className="text-[#0f7a4f] font-bold">{selectedCount}</strong> {t('mặt hàng')}.{' '}
                  {skippedCount > 0 && <span className="text-amber-800">({skippedCount} {t('dòng không chọn sẽ bỏ qua')})</span>}
                </p>
                {duplicate && (
                  <label className="flex items-center gap-1.5 text-xs text-amber-800">
                    <input type="checkbox" checked={allowRepeat} onChange={(event) => setAllowRepeat(event.target.checked)} />
                    {t('File này đã thêm trước đó. Thêm lại.')}
                  </label>
                )}
              </div>
              <button
                type="button"
                onClick={() => void addSelected()}
                disabled={adding || !selectedCount || (duplicate && !allowRepeat)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f7a4f] font-bold text-white hover:bg-[#0b4f34] transition disabled:opacity-50 text-sm shadow-xs"
              >
                <ShoppingCart size={17} />
                <span>{t(adding ? 'Đang kiểm tra và thêm...' : 'Thêm mặt hàng đã chọn vào giỏ')} ({selectedCount})</span>
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }
);

/**
 * Cuộn chính xác tới khung Đặt hàng nhanh bằng file Excel (#excel-order-section)
 * bất kể khung đang nằm ở đâu (giỏ hàng trống, giỏ hàng có nhiều món, hay bất kỳ trang nào),
 * tự động trừ đi chiều cao thanh Header bám dính (sticky header).
 */
export function scrollToExcelOrderSection() {
  const run = () => {
    const el = document.getElementById('excel-order-section');
    if (!el) return;
    const header = document.querySelector('header');
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 120;
    const rect = el.getBoundingClientRect();
    const targetY = Math.max(0, window.scrollY + rect.top - headerBottom - 16);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    el.classList.add('ring-4', 'ring-[#0f7a4f]/25', 'border-[#0f7a4f]');
    window.setTimeout(() => {
      el.classList.remove('ring-4', 'ring-[#0f7a4f]/25');
    }, 2200);
  };
  requestAnimationFrame(run);
  window.setTimeout(run, 120);
}

export default ExcelOrderSection;
