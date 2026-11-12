import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { errorText, useStoreApi } from '../../lib/storeAdmin';
import { Notice, Panel, ghostButton, inputClass } from './StoreAdminLayout';

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Đơn nháp', tone: 'bg-slate-100 text-slate-600' },
  pending: { label: 'Chờ xác nhận', tone: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', tone: 'bg-blue-50 text-blue-700' },
  preparing: { label: 'Đang chuẩn bị', tone: 'bg-indigo-50 text-indigo-700' },
  shipping: { label: 'Đang giao', tone: 'bg-cyan-50 text-cyan-700' },
  completed: { label: 'Hoàn thành', tone: 'bg-green-50 text-green-700' },
  canceled: { label: 'Đã huỷ', tone: 'bg-red-50 text-red-600' },
};

const SOURCE_LABELS: Record<string, string> = { website: 'Web/App', zalo_mini_app: 'Zalo' };

interface OnlineOrder {
  id: string;
  order_code: string;
  status: string;
  source: string;
  grand_total: number | null;
  created_at: string;
  customer_name: string | null;
  customer_company: string | null;
  customer_phone: string | null;
  delivery_date: string | null;
  pricing_status: string | null;
  item_count: number | null;
}

const money = (value: number | null) => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')}đ`;
const dateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Đơn khách tự đặt trên cửa hàng online / app / Zalo; bấm vào để xử lý ở trang đơn hàng chung. */
export default function StoreOrdersPage() {
  const { call } = useStoreApi();
  const [mode, setMode] = useState<'orders' | 'invoices'>('orders');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ compact: '1', includeStats: '0', source: 'website,zalo_mini_app', mode, page: String(page), pageSize: '50' });
      if (search) qs.set('search', search);
      const data = await call<{ orders: OnlineOrder[]; totalCount: number }>(`/api/admin/orders?${qs}`);
      setOrders(data.orders);
      setTotal(data.totalCount);
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [call, mode, page, search]);
  useEffect(() => { void load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          {([['orders', 'Đang xử lý'], ['invoices', 'Đã hoàn thành']] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => { setMode(key); setPage(0); }} className={`h-9 rounded-full px-4 text-sm font-semibold ${mode === key ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-50'}`}>{label}</button>
          ))}
          <form className="relative ml-auto w-full sm:w-72" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(0); }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Mã đơn, tên khách, SĐT…" />
          </form>
        </div>
        <p className="mt-3 text-xs text-slate-500">{loading ? 'Đang tải...' : `${total.toLocaleString('vi-VN')} đơn từ cửa hàng online, app và Zalo`}</p>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Mã đơn</th>
                <th className="py-2 pr-3">Khách hàng</th>
                <th className="py-2 pr-3">Đặt lúc</th>
                <th className="py-2 pr-3">Ngày giao</th>
                <th className="py-2 pr-3 text-right">Tổng tiền</th>
                <th className="py-2 pr-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, tone: 'bg-slate-100 text-slate-600' };
                return (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-green-50/40">
                    <td className="py-2.5 pr-3">
                      <Link to={`/don-hang/${order.id}`} className="font-bold text-green-700 hover:underline">{order.order_code}</Link>
                      <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{SOURCE_LABELS[order.source] || order.source}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-slate-800">{order.customer_company || order.customer_name || '—'}</p>
                      <p className="text-xs text-slate-400">{order.customer_phone || ''}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{dateTime(order.created_at)}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{order.delivery_date || '—'}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-slate-800">
                      {money(order.grand_total)}
                      {order.pricing_status === 'provisional' && <span className="block text-[10px] font-semibold text-amber-600">Giá tạm</span>}
                    </td>
                    <td className="py-2.5 pr-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.tone}`}>{status.label}</span></td>
                  </tr>
                );
              })}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">Chưa có đơn online nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button type="button" className={ghostButton} disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>Trước</button>
            <span className="text-sm text-slate-500">Trang {page + 1}/{pages}</span>
            <button type="button" className={ghostButton} disabled={page + 1 >= pages || loading} onClick={() => setPage((p) => p + 1)}>Sau</button>
          </div>
        )}
      </Panel>
    </div>
  );
}
