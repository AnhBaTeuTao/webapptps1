import { NavLink, Outlet } from 'react-router-dom';
import { ExternalLink, Store } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/permissions';
import { STORE_URL } from '../../lib/storeAdmin';

const TABS = [
  { to: '/cua-hang', label: 'Tổng quan', perm: 'store.manage', end: true },
  { to: '/cua-hang/banner', label: 'Banner', perm: 'store.manage' },
  { to: '/cua-hang/bo-suu-tap', label: 'Bộ sưu tập', perm: 'store.manage' },
  { to: '/cua-hang/danh-muc', label: 'Danh mục', perm: 'store.manage' },
  { to: '/cua-hang/san-pham', label: 'Sản phẩm online', perm: 'products.view' },
  { to: '/cua-hang/don-hang', label: 'Đơn online', perm: 'orders.view' },
  { to: '/cua-hang/khach-dang-ky', label: 'Khách đăng ký', perm: 'customers.view' },
];

/** Khung chung của khu "Cửa hàng online": tiêu đề, nút xem cửa hàng, thanh tab. */
export default function StoreAdminLayout() {
  const { user } = useAuth();
  const role = user?.role ?? '';
  const tabs = TABS.filter((tab) => can(role, tab.perm));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Store size={22} /></span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Cửa hàng online</h1>
            <p className="text-xs text-slate-500">Nội dung hiển thị trên dathang.thucphamsomot.vn và app Thực Phẩm Số Một</p>
          </div>
        </div>
        <a href={STORE_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-green-300 hover:text-green-700">
          <ExternalLink size={16} /> Xem cửa hàng
        </a>
      </div>

      <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `h-9 shrink-0 rounded-full px-4 text-sm font-semibold leading-9 transition ${isActive ? 'bg-green-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-green-700'}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

/** Khung trắng dùng chung cho các khối nội dung. */
export function Panel({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-bold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Notice({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const style = kind === 'error'
    ? 'bg-red-50 text-red-700 border-red-200'
    : kind === 'success'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';
  return <p className={`rounded-xl border px-4 py-3 text-sm ${style}`}>{children}</p>;
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? 'bg-green-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export const inputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100';
export const primaryButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50';
export const ghostButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-green-300 hover:text-green-700 disabled:opacity-50';
