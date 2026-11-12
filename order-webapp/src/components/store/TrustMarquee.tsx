import { Award, Phone, ShieldCheck } from 'lucide-react';
import type { StoreAnnouncement } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreHome } from '../../hooks/useStoreHome';

const ICONS = { shield: ShieldCheck, award: Award, phone: Phone };

// Bản dự phòng khi chưa tải được API; nội dung chính lấy từ website
// (lib/site.ts → /api/store/home → announcements) để hai nơi luôn khớp nhau.
const FALLBACK: StoreAnnouncement[] = [
  { icon: 'shield', text: 'Đạt chuẩn ISO 22000 & HACCP' },
  { icon: 'award', text: 'Bảo hiểm trách nhiệm sản phẩm 5.000.000.000 VNĐ' },
  { icon: 'phone', text: 'Hotline B2B: 089 890 2222' },
  { icon: 'shield', text: '99,8% đơn hàng giao đúng hẹn' },
  { icon: 'award', text: '109+ khách hàng doanh nghiệp tin dùng' },
];

/** Dòng chữ chạy ngang trên cùng, đồng bộ với website chính. */
export default function TrustMarquee() {
  const { t } = useLanguage();
  const { data } = useStoreHome();
  const items = data?.announcements?.length ? data.announcements : FALLBACK;
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {items.map(({ icon, text }, i) => {
        const Icon = ICONS[icon] || ShieldCheck;
        return (
          <span key={`${i}-${text}`} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Icon size={13} className="text-emerald-200" /> {t(text)}
          </span>
        );
      })}
    </div>
  );
  return (
    <div className="tps1-marquee overflow-hidden bg-[#0b4f34] text-[11.5px] font-semibold text-emerald-50/95" aria-label={t('Thông tin chứng chỉ và liên hệ')}>
      <div className="tps1-marquee__track flex w-max py-1.5">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
