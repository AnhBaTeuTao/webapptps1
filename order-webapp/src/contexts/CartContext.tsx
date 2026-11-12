import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, type CustomerSession, type Product } from '../lib/api';
import type { OrderItem, OrderTab } from '../components/products/OrderTabsBar';
import { useAuth } from './AuthContext';

// Một giỏ hàng duy nhất cho toàn app (cửa hàng, Đặt nhanh, Excel, giỏ hàng).
// Lưu theo khách (hoặc 'guest' khi chưa đăng nhập) ở đúng key mà trang Đặt
// hàng cũ đã dùng, nên giỏ đang có của khách không bị mất khi nâng cấp.
// Khi khách lạ đăng nhập: gộp giỏ 'guest' vào giỏ tài khoản và tính lại giá
// theo hợp đồng của khách (giá khách lạ chỉ là giá tham khảo).

const tabKey = (customerId: string) => `tps1_b2b_pos_tabs_v2_${customerId}`;
const legacyCartKey = (customerId: string) => `tps1_order_cart_v2_${customerId}`;
const DEFAULT_SHIFT = 'Ca sáng sớm (05:00 - 07:00)';

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultDelivery(session: CustomerSession | null) {
  const shipping = session?.defaultShippingAddress;
  const address = String(shipping?.address || '').trim();
  if (!address) return { deliveryName: '', deliveryPhone: '', deliveryAddress: '' };
  return {
    deliveryName: String(shipping?.name || '').trim(),
    deliveryPhone: String(shipping?.phone || '').trim(),
    deliveryAddress: address,
  };
}

function emptyTab(session: CustomerSession | null): OrderTab {
  return {
    id: `tab-${Date.now()}`,
    idempotencyKey: crypto.randomUUID(),
    title: 'Đặt hàng',
    items: [],
    note: '',
    deliveryDate: tomorrow(),
    deliveryShift: DEFAULT_SHIFT,
    ...defaultDelivery(session),
    mode: 'delivery',
  };
}

function mergeItems(base: OrderItem[], extra: OrderItem[]) {
  const merged = [...base];
  for (const item of extra) {
    if (!item?.product?.id) continue;
    const plain = !item.note?.trim() && !item.product.isUnlisted;
    const index = plain ? merged.findIndex((line) => line.product.id === item.product.id && !line.note?.trim()) : -1;
    if (index >= 0) {
      merged[index] = { ...merged[index], quantity: Number((merged[index].quantity + item.quantity).toFixed(3)) };
    } else {
      merged.push({ ...item, sourceImportLineId: undefined });
    }
  }
  return merged;
}

/** Đọc giỏ đã lưu; gộp các tab cũ và giỏ /gio-hang cũ (tps1_order_cart_v2) vào một giỏ. */
function readTab(customerId: string, session: CustomerSession | null): OrderTab {
  let tab = emptyTab(session);
  try {
    const saved = JSON.parse(localStorage.getItem(tabKey(customerId)) || 'null');
    const tabs = Array.isArray(saved) ? saved.filter((value) => value && typeof value === 'object') : [];
    if (tabs.length > 0) {
      const primary = tabs[0] as OrderTab;
      tab = {
        ...tab,
        ...primary,
        title: 'Đặt hàng',
        items: tabs.reduce<OrderItem[]>((all, value) => mergeItems(all, Array.isArray(value.items) ? value.items : []), []),
        idempotencyKey: tabs.length === 1 && primary.idempotencyKey ? primary.idempotencyKey : crypto.randomUUID(),
      };
      if (!String(tab.deliveryAddress || '').trim()) tab = { ...tab, ...defaultDelivery(session) };
    }
  } catch { /* giỏ hỏng → bắt đầu giỏ mới */ }

  try {
    const legacy = JSON.parse(localStorage.getItem(legacyCartKey(customerId)) || 'null') as Record<string, { product: Product; quantity: number; note?: string }> | null;
    if (legacy && typeof legacy === 'object') {
      const lines = Object.values(legacy).filter((line) => line?.product?.id);
      if (lines.length) tab = { ...tab, items: mergeItems(tab.items, lines.map((line) => ({ product: line.product, quantity: Number(line.quantity) || 1, note: line.note || undefined }))) };
      localStorage.removeItem(legacyCartKey(customerId));
    }
  } catch { /* bỏ qua giỏ cũ hỏng */ }
  return tab;
}

interface CartContextType {
  tab: OrderTab;
  updateTab: (updater: (prev: OrderTab) => OrderTab) => void;
  /** Thêm hàng (cộng dồn vào dòng không ghi chú của cùng sản phẩm). */
  addProduct: (product: Product, quantity?: number, note?: string) => void;
  /** Tương thích các màn cũ (Excel, nhập hàng ngoài danh mục). */
  addItem: (product: Product, quantity?: number, note?: string) => void;
  addUnlisted: (product: Product, quantity: number, note: string) => void;
  updateQty: (lineKey: string, quantity: number) => void;
  updateNote: (lineKey: string, note: string) => void;
  removeItem: (lineKey: string) => void;
  /** Xoá hàng sau khi gửi đơn thành công, giữ thông tin nhận hàng. */
  resetAfterSubmit: () => void;
  quantityOf: (productId: string) => number;
  count: number;
  subtotal: number;
  /** Số dòng đổi giá sau khi khách đăng nhập (để báo cho khách biết). */
  repricedCount: number;
  dismissRepriced: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const lineKeyOf = (item: OrderItem) => item.lineKey || item.product.id;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  // Chờ biết khách là ai rồi mới mở giỏ, tránh ghi nhầm vào giỏ 'guest'.
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#eaf6ef] border-t-[#0f7a4f]" />
      </div>
    );
  }
  const owner = session?.id || 'guest';
  return <CartStore key={owner} owner={owner} session={session}>{children}</CartStore>;
};

const CartStore: React.FC<{ children: React.ReactNode; owner: string; session: CustomerSession | null }> = ({ children, owner, session }) => {
  const [tab, setTab] = useState<OrderTab>(() => {
    const own = readTab(owner, session);
    if (owner === 'guest') return own;
    // Vừa đăng nhập: gộp giỏ đã chọn khi còn là khách lạ.
    const guest = readTab('guest', null);
    if (guest.items.length === 0) return own;
    localStorage.removeItem(tabKey('guest'));
    return { ...own, items: mergeItems(own.items, guest.items), idempotencyKey: crypto.randomUUID() };
  });
  const [repricedCount, setRepricedCount] = useState(0);
  const repricedOnce = useRef(false);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  useEffect(() => {
    try { localStorage.setItem(tabKey(owner), JSON.stringify([tab])); } catch { /* bộ nhớ đầy */ }
  }, [tab, owner]);

  // Đã đăng nhập: tính lại giá các dòng trong giỏ theo giá riêng của khách.
  useEffect(() => {
    if (owner === 'guest' || repricedOnce.current) return;
    repricedOnce.current = true;
    const ids = Array.from(new Set(tab.items.filter((item) => !item.product.isUnlisted).map((item) => item.product.id)));
    if (ids.length === 0) return;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 24) chunks.push(ids.slice(i, i + 24));
    void Promise.all(chunks.map((chunk) => api.productsByIds(chunk)))
      .then((responses) => {
        const fresh = new Map(responses.flatMap((res) => res.products || []).map((product) => [product.id, product]));
        const changed = tabRef.current.items.filter((item) => {
          const next = fresh.get(item.product.id);
          return next && Number(next.price) !== Number(item.product.price);
        }).length;
        setTab((prev) => ({
          ...prev,
          items: prev.items.map((item) => {
            const next = fresh.get(item.product.id);
            return next ? { ...item, product: { ...item.product, ...next } } : item;
          }),
        }));
        setRepricedCount(changed);
      })
      .catch(() => undefined);
  }, [owner, tab.items]);

  const updateTab = useCallback((updater: (prev: OrderTab) => OrderTab) => setTab(updater), []);

  const addProduct = useCallback((product: Product, quantity = 1, note = '') => {
    const qty = Math.max(0.001, Number(quantity) || 1);
    setTab((prev) => {
      const cleanNote = note.trim();
      const index = cleanNote ? -1 : prev.items.findIndex((item) => item.product.id === product.id && !item.note?.trim());
      if (index >= 0) {
        const items = [...prev.items];
        items[index] = { ...items[index], quantity: Number((items[index].quantity + qty).toFixed(3)) };
        return { ...prev, items };
      }
      return { ...prev, items: [...prev.items, { product, quantity: qty, note: cleanNote || undefined, lineKey: cleanNote ? crypto.randomUUID() : undefined }] };
    });
  }, []);

  const addUnlisted = useCallback((product: Product, quantity: number, note: string) => {
    setTab((prev) => ({ ...prev, items: [...prev.items, { product, quantity, note: note || undefined, lineKey: product.id }] }));
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setTab((prev) => {
      const items = prev.items.filter((item) => lineKeyOf(item) !== lineKey);
      return { ...prev, items, sourceImportBatchId: items.some((item) => item.sourceImportLineId) ? prev.sourceImportBatchId : undefined };
    });
  }, []);

  const updateQty = useCallback((lineKey: string, quantity: number) => {
    const qty = Number(quantity);
    if (!(qty > 0)) { removeItem(lineKey); return; }
    setTab((prev) => ({ ...prev, items: prev.items.map((item) => (lineKeyOf(item) === lineKey ? { ...item, quantity: qty } : item)) }));
  }, [removeItem]);

  const updateNote = useCallback((lineKey: string, note: string) => {
    setTab((prev) => ({ ...prev, items: prev.items.map((item) => (lineKeyOf(item) === lineKey ? { ...item, note } : item)) }));
  }, []);

  const resetAfterSubmit = useCallback(() => {
    setTab((prev) => ({ ...prev, items: [], note: '', idempotencyKey: crypto.randomUUID(), sourceImportBatchId: undefined }));
  }, []);

  const value = useMemo<CartContextType>(() => {
    const quantities = new Map<string, number>();
    for (const item of tab.items) quantities.set(item.product.id, (quantities.get(item.product.id) || 0) + item.quantity);
    return {
      tab,
      updateTab,
      addProduct,
      addItem: addProduct,
      addUnlisted,
      updateQty,
      updateNote,
      removeItem,
      resetAfterSubmit,
      quantityOf: (productId: string) => quantities.get(productId) || 0,
      count: tab.items.length,
      subtotal: tab.items.reduce((sum, item) => sum + item.quantity * (item.product.price || 0), 0),
      repricedCount,
      dismissRepriced: () => setRepricedCount(0),
    };
  }, [tab, updateTab, addProduct, addUnlisted, updateQty, updateNote, removeItem, resetAfterSubmit, repricedCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải dùng bên trong CartProvider');
  return ctx;
};
