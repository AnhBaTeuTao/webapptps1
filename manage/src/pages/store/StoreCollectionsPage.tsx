import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, PackageOpen, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  errorText, slugify, useStoreApi,
  type CollectionItem, type ContentProduct, type StoreCollection,
} from '../../lib/storeAdmin';
import { Notice, Panel, Toggle, ghostButton, inputClass, primaryButton } from './StoreAdminLayout';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Chọn tay',
  best_sellers: 'Tự động: hàng bán chạy',
  new_arrivals: 'Tự động: hàng mới về',
};

type Draft = { id?: string; title: string; subtitle: string; slug: string; max_items: number; slugTouched?: boolean };

function ItemsEditor({ collection, onClose, onSaved }: { collection: StoreCollection; onClose: () => void; onSaved: () => void }) {
  const { call } = useStoreApi();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    call<{ items: CollectionItem[] }>(`/api/admin/store/collections/items?collectionId=${collection.id}`)
      .then((data) => setItems(data.items))
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));
  }, [call, collection.id]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await call<{ products: ContentProduct[] }>(`/api/admin/products/content?search=${encodeURIComponent(q)}`);
        setResults(data.products);
      } catch (e) { setError(errorText(e)); } finally { setSearching(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [call, query]);

  const add = (product: ContentProduct) => {
    if (items.some((item) => item.productId === product.id)) return;
    if (items.length >= 48) { setError('Một bộ sưu tập tối đa 48 sản phẩm'); return; }
    setItems((current) => [...current, {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      imageUrl: product.thumb_url || product.image_url,
      visible: product.online_visible,
    }]);
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await call('/api/admin/store/collections/items', { method: 'PUT', json: { collectionId: collection.id, productIds: items.map((item) => item.productId) } });
      onSaved();
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  };

  const chosen = new Set(items.map((item) => item.productId));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => !saving && onClose()}>
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sản phẩm trong “{collection.title}”</h3>
            <p className="text-xs text-slate-500">Tìm và bấm vào sản phẩm để thêm; dùng mũi tên để sắp thứ tự hiển thị.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        {error && <div className="px-5 pt-3"><Notice>{error}</Notice></div>}
        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-slate-100 p-4 md:border-b-0 md:border-r">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc mã hàng..." />
            </div>
            <ul className="mt-3 min-h-[200px] flex-1 space-y-1 overflow-y-auto">
              {searching && <li className="py-6 text-center text-sm text-slate-400">Đang tìm...</li>}
              {!searching && query.trim().length >= 2 && results.length === 0 && <li className="py-6 text-center text-sm text-slate-400">Không thấy sản phẩm phù hợp</li>}
              {!searching && results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={chosen.has(product.id)}
                    onClick={() => add(product)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-green-50 disabled:opacity-40"
                  >
                    {product.thumb_url || product.image_url
                      ? <img src={product.thumb_url || product.image_url || ''} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200" />
                      : <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><PackageOpen size={18} /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{product.name}</span>
                      <span className="block truncate text-xs text-slate-400">{product.sku} · {product.category || 'Chưa phân nhóm'}{!product.online_visible && ' · đang ẩn online'}</span>
                    </span>
                    {chosen.has(product.id) ? <span className="text-xs text-slate-400">Đã thêm</span> : <Plus size={18} className="text-green-700" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-h-0 flex-col p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Đã chọn {items.length}/48</p>
            <ol className="min-h-[200px] flex-1 space-y-1 overflow-y-auto">
              {loading && <li className="py-6 text-center text-sm text-slate-400">Đang tải...</li>}
              {!loading && items.length === 0 && <li className="py-6 text-center text-sm text-slate-400">Chưa có sản phẩm. Bộ sưu tập trống sẽ tự ẩn khỏi cửa hàng.</li>}
              {items.map((item, index) => (
                <li key={item.productId} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2">
                  <span className="w-5 text-center text-xs font-bold text-slate-400">{index + 1}</span>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><PackageOpen size={16} /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.name}</span>
                    {!item.visible && <span className="block text-[11px] font-semibold text-amber-600">Đang ẩn hoặc ngừng bán, sẽ không hiện</span>}
                  </span>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={15} /></button>
                  <button type="button" onClick={() => setItems((current) => current.filter((x) => x.productId !== item.productId))} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><X size={15} /></button>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" className={ghostButton} onClick={onClose} disabled={saving}>Huỷ</button>
          <button type="button" className={primaryButton} onClick={() => void save()} disabled={saving || loading}>{saving && <Loader2 size={16} className="animate-spin" />} Lưu danh sách</button>
        </div>
      </div>
    </div>
  );
}

export default function StoreCollectionsPage() {
  const { call } = useStoreApi();
  const [items, setItems] = useState<StoreCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingItems, setEditingItems] = useState<StoreCollection | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await call<{ items: StoreCollection[] }>('/api/admin/store/collections');
      setItems(data.items);
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [call]);
  useEffect(() => { void load(); }, [load]);

  const patch = async (id: string, fields: Partial<StoreCollection>) => {
    setError('');
    try {
      await call(`/api/admin/store/collections?id=${id}`, { method: 'PATCH', json: fields });
      await load();
    } catch (e) { setError(errorText(e)); }
  };

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await Promise.all(next.map((c, i) => (c.sort_order === (i + 1) * 10 ? null : call(`/api/admin/store/collections?id=${c.id}`, { method: 'PATCH', json: { sort_order: (i + 1) * 10 } }))));
    } catch (e) { setError(errorText(e)); }
    void load();
  };

  const remove = async (collection: StoreCollection) => {
    if (!window.confirm(`Xoá bộ sưu tập "${collection.title}" và danh sách sản phẩm của nó? Không thể hoàn tác.`)) return;
    try {
      await call(`/api/admin/store/collections?id=${collection.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((c) => c.id !== collection.id));
    } catch (e) { setError(errorText(e)); }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) { setError('Bộ sưu tập cần có tên'); return; }
    const slug = slugify(draft.slug || draft.title);
    if (!slug) { setError('Tên bộ sưu tập chưa hợp lệ'); return; }
    setSaving(true); setError('');
    const body = { title: draft.title, subtitle: draft.subtitle, max_items: Math.min(48, Math.max(1, draft.max_items || 12)) };
    try {
      if (draft.id) await call(`/api/admin/store/collections?id=${draft.id}`, { method: 'PATCH', json: body });
      else await call('/api/admin/store/collections', { method: 'POST', json: { ...body, slug, source: 'manual', sort_order: (items.length + 1) * 10 } });
      setDraft(null);
      await load();
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      <Panel
        title="Các khối sản phẩm trên trang chủ"
        action={<button type="button" className={primaryButton} onClick={() => setDraft({ title: '', subtitle: '', slug: '', max_items: 24 })}><Plus size={16} /> Thêm bộ sưu tập</button>}
      >
        <p className="mb-3 text-xs text-slate-500">
          Các khối hiện theo thứ tự dưới đây, ngay sau danh mục và banner. Khối “Chọn tay” (ví dụ Khuyến mãi) chỉ hiện khi có ít nhất một sản phẩm.
        </p>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((collection, index) => {
              const count = collection.store_collection_items?.[0]?.count ?? 0;
              const manual = collection.source === 'manual';
              return (
                <li key={collection.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{collection.title}</p>
                    <p className="text-xs text-slate-500">
                      {SOURCE_LABELS[collection.source]}
                      {manual ? ` · ${count} sản phẩm` : ` · tối đa ${collection.max_items} sản phẩm`}
                      {manual && count === 0 && collection.is_active && <span className="font-semibold text-amber-600"> · đang trống nên chưa hiện</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {manual && (
                      <button type="button" className={`${ghostButton} h-9`} onClick={() => setEditingItems(collection)}>
                        <PackageOpen size={15} /> Chọn sản phẩm
                      </button>
                    )}
                    <button type="button" title="Lên" disabled={index === 0} onClick={() => void move(index, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button type="button" title="Xuống" disabled={index === items.length - 1} onClick={() => void move(index, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={16} /></button>
                    <Toggle label="Hiện/ẩn bộ sưu tập" checked={collection.is_active} onChange={(value) => void patch(collection.id, { is_active: value })} />
                    <button type="button" title="Sửa" onClick={() => setDraft({ id: collection.id, title: collection.title, subtitle: collection.subtitle || '', slug: collection.slug, max_items: collection.max_items })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                    {manual && <button type="button" title="Xoá" onClick={() => void remove(collection)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => !saving && setDraft(null)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{draft.id ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'}</h3>
              <button type="button" onClick={() => setDraft(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Tên khối *</span>
                <input className={inputClass} value={draft.title} maxLength={80} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="VD: Khuyến mãi tuần này" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Dòng mô tả ngắn</span>
                <input className={inputClass} value={draft.subtitle} maxLength={160} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Số sản phẩm tối đa hiển thị</span>
                <input type="number" min={1} max={48} className={inputClass} value={draft.max_items} onChange={(e) => setDraft({ ...draft, max_items: Number(e.target.value) })} />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setDraft(null)} disabled={saving}>Huỷ</button>
              <button type="button" className={primaryButton} onClick={() => void save()} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Lưu</button>
            </div>
          </div>
        </div>
      )}

      {editingItems && (
        <ItemsEditor
          collection={editingItems}
          onClose={() => setEditingItems(null)}
          onSaved={() => { setEditingItems(null); setNotice(`Đã lưu sản phẩm cho “${editingItems.title}”.`); void load(); }}
        />
      )}
    </div>
  );
}
