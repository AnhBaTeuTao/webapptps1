import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { errorText, useStoreApi, type StoreBanner } from '../../lib/storeAdmin';
import { Notice, Panel, Toggle, ghostButton, inputClass, primaryButton } from './StoreAdminLayout';

type Draft = {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  image_mobile_url: string;
  link_url: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

const EMPTY: Draft = { title: '', subtitle: '', image_url: '', image_mobile_url: '', link_url: '', is_active: true, starts_at: '', ends_at: '' };

// datetime-local ⇄ ISO (giờ máy người dùng)
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

function bannerState(banner: StoreBanner) {
  if (!banner.is_active) return { label: 'Đang tắt', tone: 'bg-slate-100 text-slate-500' };
  const now = Date.now();
  if (banner.starts_at && new Date(banner.starts_at).getTime() > now) return { label: 'Chờ đến giờ chạy', tone: 'bg-amber-50 text-amber-700' };
  if (banner.ends_at && new Date(banner.ends_at).getTime() < now) return { label: 'Đã hết hạn', tone: 'bg-red-50 text-red-600' };
  return { label: 'Đang chạy', tone: 'bg-green-50 text-green-700' };
}

function ImageField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (url: string) => void }) {
  const { upload } = useStoreApi();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { onChange(await upload(file, 'banner')); } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => input.current?.click()} className="relative flex aspect-[2/1] w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-green-400">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={24} />}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="animate-spin text-green-700" /></span>}
        </button>
        <div className="space-y-1 text-xs text-slate-500">
          <p>{hint}</p>
          <p>JPG, PNG hoặc WEBP, tối đa 5MB.</p>
          {value && <button type="button" onClick={() => onChange('')} className="font-semibold text-red-600 hover:underline">Bỏ ảnh</button>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

export default function StoreBannersPage() {
  const { call } = useStoreApi();
  const [items, setItems] = useState<StoreBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await call<{ items: StoreBanner[] }>('/api/admin/store/banners');
      setItems(data.items);
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [call]);
  useEffect(() => { void load(); }, [load]);

  const patch = async (id: string, fields: Partial<StoreBanner>) => {
    setError('');
    try {
      const data = await call<{ item: StoreBanner }>(`/api/admin/store/banners?id=${id}`, { method: 'PATCH', json: fields });
      setItems((current) => current.map((b) => (b.id === id ? data.item : b)));
    } catch (e) { setError(errorText(e)); }
  };

  const move = async (index: number, delta: -1 | 1) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    await Promise.all(next.map((b, i) => (b.sort_order === (i + 1) * 10 ? null : call(`/api/admin/store/banners?id=${b.id}`, { method: 'PATCH', json: { sort_order: (i + 1) * 10 } }))))
      .catch((e) => setError(errorText(e)));
    void load();
  };

  const remove = async (banner: StoreBanner) => {
    if (!window.confirm(`Xoá banner "${banner.title}"? Không thể hoàn tác.`)) return;
    try {
      await call(`/api/admin/store/banners?id=${banner.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((b) => b.id !== banner.id));
    } catch (e) { setError(errorText(e)); }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.image_url) { setError('Banner cần có tiêu đề và ảnh máy tính'); return; }
    setSaving(true); setError('');
    const body = {
      title: draft.title,
      subtitle: draft.subtitle,
      image_url: draft.image_url,
      image_mobile_url: draft.image_mobile_url,
      link_url: draft.link_url,
      is_active: draft.is_active,
      starts_at: fromLocalInput(draft.starts_at),
      ends_at: fromLocalInput(draft.ends_at),
      ...(draft.id ? {} : { sort_order: (items.length + 1) * 10 }),
    };
    try {
      if (draft.id) await call(`/api/admin/store/banners?id=${draft.id}`, { method: 'PATCH', json: body });
      else await call('/api/admin/store/banners', { method: 'POST', json: body });
      setDraft(null);
      await load();
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      <Panel
        title={`Banner trang chủ (${items.length})`}
        action={<button type="button" className={primaryButton} onClick={() => setDraft({ ...EMPTY })}><Plus size={16} /> Thêm banner</button>}
      >
        <p className="mb-3 text-xs text-slate-500">Banner trượt ở đầu trang chủ cửa hàng. Khi chưa có banner nào đang chạy, cửa hàng hiện khung giới thiệu mặc định.</p>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Chưa có banner nào.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((banner, index) => {
              const state = bannerState(banner);
              return (
                <li key={banner.id} className="flex flex-wrap items-center gap-3 py-3">
                  <img src={banner.image_url} alt="" className="aspect-[2/1] w-36 rounded-lg object-cover ring-1 ring-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{banner.title}</p>
                    {banner.subtitle && <p className="truncate text-xs text-slate-500">{banner.subtitle}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${state.tone}`}>{state.label}</span>
                      {banner.link_url && <span className="truncate text-slate-400">→ {banner.link_url}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" title="Lên" disabled={index === 0} onClick={() => void move(index, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button type="button" title="Xuống" disabled={index === items.length - 1} onClick={() => void move(index, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={16} /></button>
                    <Toggle label="Bật/tắt banner" checked={banner.is_active} onChange={(value) => void patch(banner.id, { is_active: value })} />
                    <button type="button" title="Sửa" onClick={() => setDraft({
                      id: banner.id,
                      title: banner.title,
                      subtitle: banner.subtitle || '',
                      image_url: banner.image_url,
                      image_mobile_url: banner.image_mobile_url || '',
                      link_url: banner.link_url || '',
                      is_active: banner.is_active,
                      starts_at: toLocalInput(banner.starts_at),
                      ends_at: toLocalInput(banner.ends_at),
                    })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                    <button type="button" title="Xoá" onClick={() => void remove(banner)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !saving && setDraft(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{draft.id ? 'Sửa banner' : 'Thêm banner'}</h3>
              <button type="button" onClick={() => setDraft(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Tiêu đề *</span>
                <input className={inputClass} value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="VD: Rau củ Đà Lạt về mỗi sáng" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Dòng phụ</span>
                <input className={inputClass} value={draft.subtitle} maxLength={200} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
              </label>
              <ImageField label="Ảnh máy tính *" hint="Nên dùng ảnh ngang tỉ lệ 3:1, ví dụ 1500×500 px." value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} />
              <ImageField label="Ảnh điện thoại" hint="Tỉ lệ 2:1, ví dụ 1000×500 px. Bỏ trống sẽ dùng ảnh máy tính." value={draft.image_mobile_url} onChange={(url) => setDraft({ ...draft, image_mobile_url: url })} />
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Bấm vào banner thì mở</span>
                <input className={inputClass} value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} placeholder="VD: /danh-muc/rau-cu-qua hoặc /san-pham/…" />
                <span className="block text-xs text-slate-400">Đường dẫn trong cửa hàng bắt đầu bằng “/”. Bỏ trống nếu banner chỉ để xem.</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Bắt đầu chạy</span>
                  <input type="datetime-local" className={inputClass} value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Kết thúc</span>
                  <input type="datetime-local" className={inputClass} value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} />
                </label>
              </div>
              <label className="flex items-center gap-3">
                <Toggle checked={draft.is_active} onChange={(value) => setDraft({ ...draft, is_active: value })} label="Bật banner" />
                <span className="text-sm font-semibold text-slate-700">Bật banner</span>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setDraft(null)} disabled={saving}>Huỷ</button>
              <button type="button" className={primaryButton} onClick={() => void save()} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Lưu banner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
