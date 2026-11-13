import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook cho tất cả các dải vuốt ngang:
 * 1. Lăn chuột dọc/ngang (wheel) -> cuộn ngang mượt mà.
 * 2. Khóa cứng cuộn trang (e.preventDefault + e.stopPropagation) kể cả khi chạm mép đầu/cuối.
 * 3. Kéo chuột trái (drag to scroll) mượt mà, tắt snap khi kéo, chặn click nhầm vào thẻ con nếu kéo > 5px.
 * 4. Tính toán theo getBoundingClientRect().width để chính xác ở mọi tỷ lệ zoom trình duyệt.
 * 5. Tự gắn lại khi phần tử xuất hiện muộn (dải chỉ render sau khi dữ liệu tải xong).
 */
export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>(
  externalRef?: RefObject<T | null>
): RefObject<T | null> {
  const internalRef = useRef<T | null>(null);
  const ref = externalRef || internalRef;
  const attachedRef = useRef<{ el: T; detach: () => void } | null>(null);

  const attach = (el: T) => {
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasDragged = false;
    let snapTimeout: number | undefined;

    const onWheel = (e: WheelEvent) => {
      const width = el.getBoundingClientRect().width;
      const maxScrollLeft = el.scrollWidth - width;
      // Nếu vùng chứa không đủ dài để cuộn, không can thiệp
      if (maxScrollLeft <= 2) return;

      // LUÔN LUÔN khóa cuộn dọc của trang khi con trỏ ở trong dải cuộn ngang
      e.preventDefault();
      e.stopPropagation();

      el.style.scrollSnapType = 'none';
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, el.scrollLeft + delta));

      window.clearTimeout(snapTimeout);
      snapTimeout = window.setTimeout(() => {
        el.style.scrollSnapType = '';
      }, 150);
    };

    const onMouseDown = (e: MouseEvent) => {
      // Chỉ nhận click chuột trái (button === 0)
      if (e.button !== 0) return;
      const width = el.getBoundingClientRect().width;
      const maxScrollLeft = el.scrollWidth - width;
      if (maxScrollLeft <= 2) return;

      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeftStart = el.scrollLeft;
      hasDragged = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;

      if (Math.abs(walk) > 5) {
        if (!hasDragged) {
          hasDragged = true;
          el.style.scrollSnapType = 'none';
          el.classList.add('cursor-grabbing');
          el.classList.remove('cursor-grab');
        }
        e.preventDefault();
        const width = el.getBoundingClientRect().width;
        const maxScrollLeft = el.scrollWidth - width;
        el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollLeftStart - walk));
      }
    };

    const stopDrag = () => {
      if (isDown) {
        isDown = false;
        el.style.scrollSnapType = '';
        el.classList.remove('cursor-grabbing');
        el.classList.add('cursor-grab');
        // Giữ hasDragged thêm 50ms để bắt sự kiện click capture ngăn click nhầm Link
        window.setTimeout(() => {
          hasDragged = false;
        }, 50);
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    el.addEventListener('mouseleave', stopDrag);
    el.addEventListener('click', onClickCapture, { capture: true });

    // Đảm bảo các thuộc tính css trải nghiệm mượt mà
    el.classList.add('overscroll-contain', 'select-none', 'cursor-grab');

    return () => {
      window.clearTimeout(snapTimeout);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      el.removeEventListener('mouseleave', stopDrag);
      el.removeEventListener('click', onClickCapture, { capture: true });
    };
  };

  // Chạy sau mỗi lần render: nếu phần tử trong ref đổi (xuất hiện muộn / bị thay), gắn lại listener.
  useEffect(() => {
    const el = ref.current;
    const attached = attachedRef.current;
    if (attached && attached.el === el) return;
    if (attached) {
      attached.detach();
      attachedRef.current = null;
    }
    if (el) attachedRef.current = { el, detach: attach(el) };
  });

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      attachedRef.current?.detach();
      attachedRef.current = null;
    };
  }, []);

  return ref;
}

export default useHorizontalScroll;
