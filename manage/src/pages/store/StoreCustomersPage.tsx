import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../lib/permissions';
import { errorText, useStoreApi, type SignupCustomer } from '../../lib/storeAdmin';
import { Notice, Panel, ghostButton, inputClass, primaryButton } from './StoreAdminLayout';

const TABS = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'verified', label: 'Đã xác thực' },
  { key: 'rejected', label: 'Đã từ chối' },
] as const;

type Status = (typeof TABS)[number]['key'];

/**
 * Khách tự đăng ký trên cửa hàng online. Tài khoản chờ duyệt vẫn đặt hàng
 * được (giá tạm); xác thực xong thì đơn mới dùng đúng bảng giá của khách.
 */
export default function StoreCustomersPage() {
  const { user } = useAuth();
  const canVerify = can(user?.role, 'customers.verify');
  const { call } = useStoreApi();
  const [status, setStatus] = useState<Status>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<SignupCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejecting, setRejecting] = useState<SignupCustomer | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ status });
      if (search) qs.set('search', search);
      const data = await call<{ customers: SignupCustomer[]; total: number }>(`/api/admin/store/customers?${qs}`);
      setCustomers(data.customers);
      setTotal(data.total);
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [call, search, status]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (customer: SignupCustomer, next: 'verified' | 'rejected', note = '') => {
    setBusyId(customer.id); setError(''); setNotice('');
    try {
      await call('/api/admin/store/customers', { method: 'POST', json: { id: customer.id, status: next, note } });
      setCustomers((current) => current.filter((c) => c.id !== customer.id));
      setTotal((t) => Math.max(0, t - 1));
      setNotice(next === 'verified'
        ? `Đã xác thực ${customer.company || customer.name}. Nhớ gán bảng giá và người phụ trách trong Quản lý Khách hàng.`
        : `Đã từ chối ${customer.company || customer.name}.`);
      setRejecting(null);
      setReason('');
    } catch (e) { setError(errorText(e)); } finally { setBusyId(''); }
  };

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setStatus(tab.key)} className={`h-9 rounded-full px-4 text-sm font-semibold ${status === tab.key ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-50'}`}>{tab.label}</button>
          ))}
          <form className="relative ml-auto w-full sm:w-72" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tên, công ty, SĐT, mã khách…" />
          </form>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {loading ? 'Đang tải...' : `${total.toLocaleString('vi-VN')} tài khoản`}
          {status === 'pending' && ' · Khách chờ duyệt vẫn đặt hàng được, đơn để giá tạm cho tới khi nhân viên chốt.'}
        </p>

        <ul className="mt-2 divide-y divide-slate-100">
          {customers.map((customer) => (
            <li key={customer.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/khach-hang/${customer.id}`} className="font-semibold text-slate-800 hover:text-green-700">{customer.company || customer.name || '(Chưa có tên)'}</Link>
                <p className="text-xs text-slate-500">
                  {[customer.company ? customer.name : null, customer.phone, customer.email, customer.partner_code].filter(Boolean).join(' · ')}
                </p>
                {customer.address && <p className="truncate text-xs text-slate-400">{customer.address}</p>}
                <p className="text-[11px] text-slate-400">
                  Đăng ký {new Date(customer.registered_at || customer.created_at).toLocaleString('vi-VN')}
                  {customer.verification_note && ` · Ghi chú: ${customer.verification_note}`}
                </p>
              </div>
              {status === 'pending' && canVerify && (
                <div className="flex items-center gap-2">
                  <button type="button" className={ghostButton} disabled={busyId === customer.id} onClick={() => { setRejecting(customer); setReason(''); }}><X size={15} /> Từ chối</button>
                  <button type="button" className={primaryButton} disabled={busyId === customer.id} onClick={() => void decide(customer, 'verified')}>
                    {busyId === customer.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Xác thực
                  </button>
                </div>
              )}
            </li>
          ))}
          {!loading && customers.length === 0 && <li className="py-10 text-center text-sm text-slate-400">Không có tài khoản nào</li>}
        </ul>
      </Panel>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => setRejecting(null)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Từ chối tài khoản</h3>
            <p className="mt-1 text-sm text-slate-500">{rejecting.company || rejecting.name} · {rejecting.phone}</p>
            <label className="mt-4 block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Lý do *</span>
              <textarea rows={3} className={`${inputClass} h-auto py-2`} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="VD: Trùng tài khoản đã có, thông tin không liên hệ được…" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setRejecting(null)}>Huỷ</button>
              <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50" disabled={!reason.trim() || busyId === rejecting.id} onClick={() => void decide(rejecting, 'rejected', reason)}>
                {busyId === rejecting.id && <Loader2 size={15} className="animate-spin" />} Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
