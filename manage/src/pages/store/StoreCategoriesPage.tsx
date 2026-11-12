import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { errorText, slugify, useStoreApi, type StoreCategory } from '../../lib/storeAdmin';
import { Notice, Panel, Toggle, ghostButton, inputClass, primaryButton } from './StoreAdminLayout';

type Draft = { id?: string; name: string; image_url: string; product_categories: string[] };

export default function StoreCategoriesPage() {
  const { call, upload } = useStoreApi();
  const [items, setItems] = useState<StoreCategory[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await call<{ items: StoreCategory[] }>('/api/admin/store/categories');
      setItems(data.items);
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [call]);

  useEffect(() => {
    void load();
    call<{ categories: string[] }>('/api/admin/products?meta=1')
      .then((data) => setGroups(data.categories || []))
      .catch(() => undefined);
  }, [call, load]);

  // Nhóm KiotViet chưa được gom vào danh mục nào → hàng thuộc nhóm đó không có lối vào từ menu.
  const usedGroups = new Set(items.flatMap((c) => c.product_categories || []));
  const unassigned = groups.filter((g) => !usedGroups.has(g));

  const patch = async (id: string, fields: Partial<StoreCategory>) => {
    setError('');
    try {
      const data = await call<{ item: StoreCategory }>(`/api/admin/store/categories?id=${id}`, { method: 'PATCH', json: fields });
      setItems((current) => current.map((c) => (c.id === id ? data.item : c)));
    } catch (e) { setError(errorText(e)); }
  };

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await Promise.all(next.map((c, i) => (c.sort_order === (i + 1) * 10 ? null : call(`/api/admin/store/categories?id=${c.id}`, { method: 'PATCH', json: { sort_order: (i + 1) * 10 } }))));
    } catch (e) { setError(errorText(e)); }
    void load();
  };

  const remove = async (category: StoreCategory) => {
    if (!window.confirm(`Xoá danh mục "${category.name}"? Hàng hoá không bị xoá, chỉ mất lối vào từ menu.`)) return;
    try {
      await call(`/api/admin/store/categories?id=${category.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((c) => c.id !== category.id));
    } catch (e) { setError(errorText(e)); }
  };

  const pickImage = async (file?: File) => {
    if (!file || !draft) return;
    setUploading(true); setError('');
    try {
      const url = await upload(file, 'category');
      setDraft((current) => (current ? { ...current, image_url: url } : current));
    } catch (e) { setError(errorText(e)); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { setError('Danh mục cần có tên'); return; }
    if (draft.product_categories.length === 0) { setError('Chọn ít nhất một nhóm hàng cho danh mục'); return; }
    setSaving(true); setError('');
    const body = { name: draft.name, image_url: draft.image_url, product_categories: draft.product_categories };
    try {
      if (draft.id) await call(`/api/admin/store/categories?id=${draft.id}`, { method: 'PATCH', json: body });
      else await call('/api/admin/store/categories', { method: 'POST', json: { ...body, slug: slugify(draft.name), sort_order: (items.length + 1) * 10 } });
      setDraft(null);
      await load();
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  };

  const toggleGroup = (group: string) => {
    if (!draft) return;
    const has = draft.product_categories.includes(group);
    setDraft({ ...draft, product_categories: has ? draft.product_categories.filter((g) => g !== group) : [...draft.product_categories, group] });
  };

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      {unassigned.length > 0 && (
        <Notice kind="info">
          {unassigned.length} nhóm hàng chưa nằm trong danh mục nào nên khách chỉ tìm thấy qua ô tìm kiếm: {unassigned.slice(0, 8).join(', ')}{unassigned.length > 8 ? '…' : ''}
        </Notice>
      )}
      <Panel
        title={`Danh mục hàng hoá (${items.length})`}
        action={<button type="button" className={primaryButton} onClick={() => setDraft({ name: '', image_url: '', product_categories: [] })}><Plus size={16} /> Thêm danh mục</button>}
      >
        <p className="mb-3 text-xs text-slate-500">Danh mục có ảnh ở đầu trang chủ và trên menu. Mỗi danh mục gom một hoặc nhiều nhóm hàng từ KiotViet.</p>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((category, index) => (
              <li key={category.id} className="flex flex-wrap items-center gap-3 py-3">
                {category.image_url
                  ? <img src={category.image_url} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200" />
                  : <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ImagePlus size={18} /></span>}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">{category.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(category.product_categories || []).map((g) => <span key={g} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{g}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" title="Lên" disabled={index === 0} onClick={() => void move(index, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button type="button" title="Xuống" disabled={index === items.length - 1} onClick={() => void move(index, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={16} /></button>
                  <Toggle label="Hiện/ẩn danh mục" checked={category.is_active} onChange={(value) => void patch(category.id, { is_active: value })} />
                  <button type="button" title="Sửa" onClick={() => setDraft({ id: category.id, name: category.name, image_url: category.image_url || '', product_categories: category.product_categories || [] })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                  <button type="button" title="Xoá" onClick={() => void remove(category)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => !saving && setDraft(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{draft.id ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button type="button" onClick={() => setDraft(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <button type="button" onClick={() => fileInput.current?.click()} className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-green-400">
                  {draft.image_url ? <img src={draft.image_url} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={24} />}
                  {uploading && <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="animate-spin text-green-700" /></span>}
                </button>
                <label className="block flex-1 space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Tên danh mục *</span>
                  <input className={inputClass} value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="VD: Rau củ quả" />
                  <span className="block text-xs text-slate-400">Bấm vào ô ảnh để tải ảnh vuông (ví dụ 400×400 px).</span>
                </label>
              </div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = ''; }} />
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Nhóm hàng KiotViet trong danh mục này *</p>
                <div className="flex max-h-60 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-100 p-2">
                  {groups.map((group) => {
                    const on = draft.product_categories.includes(group);
                    const elsewhere = !on && usedGroups.has(group);
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${on ? 'bg-green-700 text-white ring-green-700' : elsewhere ? 'bg-white text-slate-400 ring-slate-200' : 'bg-white text-slate-700 ring-slate-300 hover:ring-green-400'}`}
                        title={elsewhere ? 'Nhóm này đã nằm trong danh mục khác' : undefined}
                      >
                        {group}
                      </button>
                    );
                  })}
                  {groups.length === 0 && <p className="p-2 text-xs text-slate-400">Đang tải nhóm hàng...</p>}
                </div>
                <p className="mt-1 text-xs text-slate-400">Nhóm mờ là nhóm đã thuộc danh mục khác (vẫn chọn được nếu muốn hiện ở cả hai).</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setDraft(null)} disabled={saving}>Huỷ</button>
              <button type="button" className={primaryButton} onClick={() => void save()} disabled={saving || uploading}>{saving && <Loader2 size={16} className="animate-spin" />} Lưu danh mục</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
