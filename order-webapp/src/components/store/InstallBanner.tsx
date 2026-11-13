import { useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInstallPrompt } from '../../lib/installPrompt';

/**
 * Thanh mời cài app: điện thoại nằm ngay trên thanh điều hướng dưới, máy tính
 * là ô nhỏ góc phải. Bấm "Để sau" thì ẩn 7 ngày.
 */
export default function InstallBanner() {
  const { t } = useLanguage();
  const { showBanner, ios, install, dismiss } = useInstallPrompt();
  const [iosGuide, setIosGuide] = useState(false);

  if (!showBanner && !iosGuide) return null;

  const onInstall = async () => {
    if (ios) { setIosGuide(true); return; }
    const outcome = await install();
    if (outcome === 'dismissed') dismiss();
  };

  return (
    <>
      {showBanner && !iosGuide && (
        <div
          role="dialog"
          aria-label={t('Cài ứng dụng Thực Phẩm Số Một')}
          className="fixed inset-x-2 z-40 md:inset-x-auto md:bottom-5 md:right-5 md:w-[360px]"
          style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_10px_30px_rgba(16,40,30,0.18)] ring-1 ring-[#17231d]/10 md:bottom-5">
            <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="" className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-black leading-tight text-[#17231d]">{t('Cài ứng dụng Thực Phẩm Số Một')}</p>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#59665f]">{t('Mở nhanh từ màn hình chính và nhận thông báo khi đơn hàng thay đổi.')}</p>
            </div>
            <button type="button" onClick={() => void onInstall()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#0f7a4f] px-3.5 text-[13px] font-bold text-white hover:bg-[#0b4f34]">
              <Download size={15} /> {t('Cài đặt')}
            </button>
            <button type="button" onClick={dismiss} aria-label={t('Để sau')} className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-[#8a9690] hover:bg-[#f2f5f2]">
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      {iosGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setIosGuide(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-black text-[#17231d]">{t('Thêm Thực Phẩm Số Một vào màn hình chính')}</p>
              <button type="button" onClick={() => setIosGuide(false)} aria-label={t('Đóng')} className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#8a9690] hover:bg-[#f2f5f2]"><X size={18} /></button>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-[#2c3a33]">
              <li className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#0f7a4f]"><Share size={18} /></span>
                <span>{t('Bấm nút Chia sẻ ở thanh dưới của Safari.')}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#0f7a4f]"><SquarePlus size={18} /></span>
                <span>{t('Chọn “Thêm vào MH chính”, rồi bấm “Thêm”.')}</span>
              </li>
            </ol>
            <p className="mt-4 text-xs text-[#8a9690]">{t('Nếu đang mở trong Zalo hoặc Facebook, quý khách mở trang bằng Safari trước.')}</p>
            <button type="button" onClick={() => { setIosGuide(false); dismiss(); }} className="mt-4 h-11 w-full rounded-xl bg-[#0f7a4f] text-sm font-bold text-white">{t('Đã hiểu')}</button>
          </div>
        </div>
      )}
    </>
  );
}
