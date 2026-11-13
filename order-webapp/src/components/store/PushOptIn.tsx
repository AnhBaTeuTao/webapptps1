import { useEffect, useState } from 'react';
import { BellRing, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { enablePush, getPushStatus, isPushSupported } from '../../lib/push';
import { isIos, isStandalone } from '../../lib/installPrompt';

/**
 * Mời bật thông báo ngay sau khi đặt đơn — lúc khách quan tâm nhất tới việc
 * đơn được xác nhận/giao. Trình duyệt chỉ cho xin quyền khi khách bấm nút.
 */
export default function PushOptIn() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'hidden' | 'ask' | 'busy' | 'on' | 'failed' | 'ios-install'>('hidden');

  useEffect(() => {
    if (!isPushSupported()) {
      // iPhone chỉ nhận thông báo khi app đã được thêm vào màn hình chính.
      if (isIos() && !isStandalone()) setStatus('ios-install');
      return;
    }
    getPushStatus().then((s) => setStatus(s === 'not-subscribed' ? 'ask' : 'hidden')).catch(() => undefined);
  }, []);

  if (status === 'hidden') return null;

  if (status === 'ios-install') {
    return (
      <p className="rounded-xl bg-[#eaf6ef] p-3 text-left text-sm text-[#0b4f34]">
        {t('Muốn nhận thông báo khi đơn được xác nhận và giao? Quý khách thêm Thực Phẩm Số Một vào màn hình chính (Safari → Chia sẻ → Thêm vào MH chính).')}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#eaf6ef] p-3 text-left">
      <BellRing size={22} className="shrink-0 text-[#0f7a4f]" />
      <p className="flex-1 text-sm text-[#0b4f34]">
        {status === 'on'
          ? t('Đã bật thông báo. TPS1 sẽ báo khi đơn được xác nhận, đang giao và đã giao.')
          : status === 'failed'
            ? t('Chưa bật được thông báo. Quý khách kiểm tra quyền thông báo của trình duyệt rồi thử lại bằng nút chuông trên đầu trang.')
            : t('Bật thông báo để biết ngay khi đơn được xác nhận, đang giao và đã giao.')}
      </p>
      {(status === 'ask' || status === 'busy') && (
        <button
          type="button"
          disabled={status === 'busy'}
          onClick={async () => {
            setStatus('busy');
            const ok = await enablePush().catch(() => false);
            setStatus(ok ? 'on' : 'failed');
          }}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#0f7a4f] px-3.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {status === 'busy' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {t('Bật')}
        </button>
      )}
    </div>
  );
}
