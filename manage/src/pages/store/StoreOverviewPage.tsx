import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, FileText, ImageOff, Images, LayoutGrid, ShoppingBag, Timer, UserPlus } from 'lucide-react';
import { errorText, useStoreApi, type StoreSummary } from '../../lib/storeAdmin';
import { Notice } from './StoreAdminLayout';

const CARDS: Array<{ key: keyof StoreSummary; label: string; to: string; icon: typeof ShoppingBag; tone: string }> = [
  { key: 'onlineOrdersToday', label: 'Đơn online hôm nay', to: '/cua-hang/don-hang', icon: ShoppingBag, tone: 'text-green-700 bg-green-50' },
  { key: 'onlineOrdersPending', label: 'Đơn online chờ xử lý', to: '/cua-hang/don-hang', icon: Timer, tone: 'text-amber-700 bg-amber-50' },
  { key: 'customersPending', label: 'Khách đăng ký chờ duyệt', to: '/cua-hang/khach-dang-ky', icon: UserPlus, tone: 'text-orange-700 bg-orange-50' },
  { key: 'productsMissingImage', label: 'Sản phẩm thiếu ảnh', to: '/cua-hang/san-pham?loc=missing_image', icon: ImageOff, tone: 'text-red-700 bg-red-50' },
  { key: 'productsMissingDescription', label: 'Sản phẩm thiếu mô tả', to: '/cua-hang/san-pham?loc=missing_description', icon: FileText, tone: 'text-slate-700 bg-slate-100' },
  { key: 'productsHidden', label: 'Sản phẩm đang ẩn', to: '/cua-hang/san-pham?loc=hidden', icon: EyeOff, tone: 'text-slate-700 bg-slate-100' },
  { key: 'activeBanners', label: 'Banner đang chạy', to: '/cua-hang/banner', icon: Images, tone: 'text-blue-700 bg-blue-50' },
  { key: 'activeCollections', label: 'Bộ sưu tập đang hiện', to: '/cua-hang/bo-suu-tap', icon: LayoutGrid, tone: 'text-purple-700 bg-purple-50' },
];

export default function StoreOverviewPage() {
  const { call } = useStoreApi();
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    call<StoreSummary>('/api/admin/store/summary').then(setSummary).catch((e) => setError(errorText(e)));
  }, [call]);

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map(({ key, label, to, icon: Icon, tone }) => (
          <Link key={key} to={to} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{summary ? summary[key].toLocaleString('vi-VN') : '—'}</p>
            <p className="text-xs font-medium text-slate-500">{label}</p>
          </Link>
        ))}
      </div>
      <Notice kind="info">
        Thay đổi banner, bộ sưu tập, danh mục và nội dung sản phẩm sẽ hiện trên cửa hàng sau khoảng 1–5 phút (cửa hàng lưu tạm để tải nhanh).
      </Notice>
    </div>
  );
}
