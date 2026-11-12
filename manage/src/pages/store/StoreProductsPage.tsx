import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImagePlus, Loader2, Pencil, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/permissions';
import { STORE_URL, errorText, useStoreApi, type ContentProduct } from '../../lib/storeAdmin';
import { Notice, Panel, Toggle, ghostButton, inputClass, primaryButton } from './StoreAdminLayout';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'missing_image', label: 'Thiếu ảnh' },
  { key: 'missing_description', label: 'Thiếu mô tả' },
  { key: 'hidden', label: 'Đang ẩn' },
];

function ProductImageCell({ product, editable, onChanged }: { product: ContentProduct; editable: boolean; onChanged: (url: string) => void }) {
  const { uploadProductImage } = useStoreApi();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const src = product.thumb_url || product.image_url;
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { onChanged(await uploadProductImage(file, product.id)); } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={!editable}
        title={editable ? 'Bấm để đổi ảnh' : undefined}
        onClick={() => input.current?.click()}
        className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200 enabled:hover:ring-green-400"
      >
        {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImagePlus size={18} />}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 size={18} className="animate-spin text-green-700" /></span>}
      </button>
      {error && <p className="mt-1 w-24 text-[10px] text-red-600">{error}</p>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

export default function StoreProductsPage() {
  const { user } = useAuth();
  const editable = can(user?.role, 'products.edit_content');
  const { call } = useStoreApi();
  const [params, setParams] = useSearchParams();
  const filter = params.get('loc') || 'all';
  const [searchInput, setSearchInput] = useState(params.get('q') || '');
  const search = params.get('q') || '';
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<ContentProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ContentProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ filter, page: String(page) });
      if (search) qs.set('search', search);
      const data = await call<{ products: ContentProduct[]; total: number }>(`/api/admin/products/content?${qs}`);
      setProducts(data.products);
      setTotal(data.total);
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [call, filter, page, search]);
  useEffect(() => { void load(); }, [load]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
    setPage(0);
  };

  const replace = (updated: Partial<ContentProduct> & { id: string }) =>
    setProducts((current) => current.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));

  const patch = async (id: string, fields: Record<string, unknown>) => {
    setError('');
    try {
      const data = await call<{ product: ContentProduct }>('/api/admin/products/content', { method: 'PATCH', json: { id, ...fields } });
      replace(data.product);
      return true;
    } catch (e) { setError(errorText(e)); return false; }
  };

  const saveEditing = async () => {
    if (!editing) return;
    setSaving(true);
    const ok = await patch(editing.id, {
      short_description: editing.short_description || '',
      description: editing.description || '',
      online_sort: editing.online_sort == null || Number.isNaN(editing.online_sort) ? null : Math.round(editing.online_sort),
    });
    setSaving(false);
    if (ok) setEditing(null);
  };

  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      {!editable && <Notice kind="info">Tài khoản của bạn chỉ xem được; cần quyền sửa nội dung sản phẩm để thay ảnh, mô tả hoặc ẩn/hiện.</Notice>}
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" onClick={() => setParam('loc', f.key)} className={`h-9 rounded-full px-4 text-sm font-semibold transition ${filter === f.key ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-50'}`}>{f.label}</button>
            ))}
          </div>
          <form className="relative ml-auto w-full sm:w-72" onSubmit={(e) => { e.preventDefault(); setParam('q', searchInput.trim()); }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm tên hoặc mã hàng, Enter" />
          </form>
        </div>
        <p className="mt-3 text-xs text-slate-500">{loading ? 'Đang tải...' : `${total.toLocaleString('vi-VN')} sản phẩm`}{editable && ' · Bấm vào ảnh để thay ảnh mới.'}</p>

        <ul className="mt-2 divide-y divide-slate-100">
          {products.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center gap-3 py-3">
              <ProductImageCell product={product} editable={editable} onChanged={(url) => replace({ id: product.id, image_url: url, thumb_url: url })} />
              <div className="min-w-0 flex-1">
                <a href={`${STORE_URL}/san-pham/${product.id}`} target="_blank" rel="noreferrer" className="block truncate font-semibold text-slate-800 hover:text-green-700">{product.name}</a>
                <p className="truncate text-xs text-slate-400">{product.sku} · {product.category || 'Chưa phân nhóm'} · {product.unit || ''}</p>
                <p className={`mt-0.5 line-clamp-1 text-xs ${product.short_description ? 'text-slate-600' : 'italic text-slate-400'}`}>{product.short_description || 'Chưa có mô tả ngắn'}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Toggle label="Hiện trên cửa hàng" checked={product.online_visible} disabled={!editable} onChange={(value) => void patch(product.id, { online_visible: value })} />
                  {product.online_visible ? 'Đang hiện' : 'Đang ẩn'}
                </label>
                {editable && <button type="button" title="Sửa mô tả" onClick={() => setEditing({ ...product })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>}
              </div>
            </li>
          ))}
          {!loading && products.length === 0 && <li className="py-10 text-center text-sm text-slate-400">Không có sản phẩm nào</li>}
        </ul>

        {pages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button type="button" className={ghostButton} disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>Trước</button>
            <span className="text-sm text-slate-500">Trang {page + 1}/{pages}</span>
            <button type="button" className={ghostButton} disabled={page + 1 >= pages || loading} onClick={() => setPage((p) => p + 1)}>Sau</button>
          </div>
        )}
      </Panel>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => !saving && setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editing.name}</h3>
                <p className="text-xs text-slate-400">{editing.sku} · chỉ sửa nội dung hiển thị, không đổi giá</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="flex justify-between text-sm font-semibold text-slate-700">Mô tả ngắn <span className="font-normal text-slate-400">{(editing.short_description || '').length}/200</span></span>
                <input className={inputClass} maxLength={200} value={editing.short_description || ''} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} placeholder="VD: Rau thu hoạch sáng sớm, đóng túi 1kg" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Mô tả chi tiết</span>
                <textarea rows={6} className={`${inputClass} h-auto py-2`} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Nguồn gốc, quy cách, cách bảo quản…" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Thứ tự ưu tiên trong danh mục</span>
                <input type="number" className={inputClass} value={editing.online_sort ?? ''} onChange={(e) => setEditing({ ...editing, online_sort: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Số nhỏ hiện trước; bỏ trống = theo tên" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setEditing(null)} disabled={saving}>Huỷ</button>
              <button type="button" className={primaryButton} onClick={() => void saveEditing()} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
