import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export type SubmittedOrder = { code: string; total: number; pendingPriceCount: number };

/**
 * Gửi giỏ hàng chung thành đơn (POST /api/customer/order). Dùng chung cho
 * trang Đặt nhanh và trang Giỏ hàng để luồng gửi đơn chỉ có một nơi.
 * Ngày giao sớm nhất lấy từ server (giờ Việt Nam), không dùng đồng hồ máy khách.
 */
export function useOrderSubmit() {
  const { session } = useAuth();
  const { tab, updateTab, resetAfterSubmit } = useCart();
  const { t, errorText } = useLanguage();
  const [cutoffInfo, setCutoffInfo] = useState<{ earliestDate: string; cutoffTimeStr: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState<SubmittedOrder | null>(null);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    api.orderConfig()
      .then((info) => {
        if (!alive) return;
        setCutoffInfo({ earliestDate: info.earliestDate, cutoffTimeStr: info.cutoffTimeStr });
        updateTab((prev) => (prev.deliveryDate < info.earliestDate ? { ...prev, deliveryDate: info.earliestDate } : prev));
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [session, updateTab]);

  const submit = useCallback(async () => {
    setErrorMessage('');
    if (!navigator.onLine) { setErrorMessage(t('Không có kết nối mạng. Giỏ hàng của bạn đã được lưu.')); return false; }
    if (tab.items.length === 0) { setErrorMessage(t('Vui lòng thêm ít nhất 1 mặt hàng vào đơn')); return false; }
    if (cutoffInfo && tab.deliveryDate < cutoffInfo.earliestDate) {
      setErrorMessage(t('Đã quá giờ chốt đơn. Vui lòng chọn ngày giao mới.'));
      updateTab((prev) => ({ ...prev, deliveryDate: cutoffInfo.earliestDate }));
      return false;
    }
    if (!tab.deliveryName.trim() || !tab.deliveryPhone.trim() || !tab.deliveryAddress.trim()) {
      setErrorMessage(t('Vui lòng điền đầy đủ Tên, SĐT và Địa chỉ giao hàng'));
      return false;
    }

    setSubmitting(true);
    try {
      const lineNotes = tab.items
        .filter((item) => item.note?.trim())
        .map((item) => `[${item.product.name}: ${item.note!.trim()}]`)
        .join('; ');
      const note = [
        tab.deliveryShift ? `[Ca: ${tab.deliveryShift}]` : '',
        tab.deliveryDate ? `[Ngày giao: ${tab.deliveryDate}]` : '',
        lineNotes,
        tab.note.trim(),
      ].filter(Boolean).join(' - ');

      const res = await api.createOrder({
        items: tab.items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          note: item.note?.trim() || undefined,
          sourceImportLineId: item.sourceImportLineId,
          isUnlisted: item.product.isUnlisted,
          unit: item.product.isUnlisted ? item.product.unit : undefined,
        })),
        deliveryName: tab.deliveryName.trim(),
        deliveryPhone: tab.deliveryPhone.trim(),
        deliveryAddress: tab.deliveryAddress.trim(),
        deliveryDate: tab.deliveryDate,
        note,
        idempotencyKey: tab.idempotencyKey,
        sourceImportBatchId: tab.sourceImportBatchId,
      });
      const subtotal = tab.items.reduce((sum, item) => sum + item.quantity * (item.product.price || 0), 0);
      setSuccessOrder({ code: res.orderCode, total: res.total ?? subtotal, pendingPriceCount: res.pendingPriceCount || 0 });
      resetAfterSubmit();
      return true;
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? errorText(err) : t('Không gửi được đơn hàng, vui lòng thử lại'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [cutoffInfo, errorText, resetAfterSubmit, t, tab, updateTab]);

  return { submit, submitting, errorMessage, setErrorMessage, successOrder, clearSuccess: () => setSuccessOrder(null), cutoffInfo };
}
