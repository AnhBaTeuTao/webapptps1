import type {
  AccountProfile,
  CustomerSession,
  FrequentItem,
  Order,
  Product,
  ProductCatalogResponse,
} from './api';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const CATEGORY_VISUALS: Record<string, { bg: string; fg: string; badge: string }> = {
  'Rau củ quả': { bg: '#e8f7ee', fg: '#0f7a4f', badge: 'RAU' },
  'Thịt heo': { bg: '#fdecec', fg: '#b91c1c', badge: 'HEO' },
  'Thịt bò': { bg: '#fae8e8', fg: '#991b1b', badge: 'BÒ' },
  'Gà, vịt': { bg: '#fef5e7', fg: '#b45309', badge: 'GÀ' },
  'Hải sản': { bg: '#e8f4fc', fg: '#0369a1', badge: 'HẢI SẢN' },
  'Đồ khô': { bg: '#f5efe6', fg: '#78350f', badge: 'KHÔ' },
  'Gia vị': { bg: '#fff3e0', fg: '#c2410c', badge: 'GIA VỊ' },
  'Trứng': { bg: '#fef9c3', fg: '#a16207', badge: 'TRỨNG' },
  'Gạo': { bg: '#f4f4ef', fg: '#3f6212', badge: 'GẠO' },
  'Đậu hũ': { bg: '#f8fafc', fg: '#475569', badge: 'ĐẬU' },
  'Đông lạnh': { bg: '#ecfeff', fg: '#0e7490', badge: 'LẠNH' },
  'Bún tươi': { bg: '#f0fdf4', fg: '#15803d', badge: 'BÚN' },
  'Trái cây': { bg: '#fef2f2', fg: '#be123c', badge: 'TRÁI' },
  'Bánh sữa': { bg: '#eff6ff', fg: '#1d4ed8', badge: 'SỮA' },
  'Chay, chả giò': { bg: '#ecfdf5', fg: '#047857', badge: 'CHAY' },
  'Nonfood': { bg: '#f1f5f9', fg: '#334155', badge: 'VẬT TƯ' },
  'Công cụ dụng cụ': { bg: '#f3f4f6', fg: '#1f2937', badge: 'DỤNG CỤ' },
};

function makeThumb(category: string | null, sku: string): string {
  const style = (category && CATEGORY_VISUALS[category]) || {
    bg: '#eaf6ef',
    fg: '#0f7a4f',
    badge: 'TPS1',
  };
  const label = sku.split('-')[0] || style.badge;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="24" fill="${style.bg}"/><circle cx="80" cy="64" r="30" fill="${style.fg}" fill-opacity="0.14"/><text x="80" y="70" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="800" fill="${style.fg}">${label}</text><text x="80" y="122" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="700" fill="${style.fg}" opacity="0.85">${sku}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function localDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEMO_CUSTOMER_SESSION: CustomerSession = {
  id: 'demo-bep-truong-001',
  code: 'KH-BEP01',
  name: 'Nguyễn Văn An (Bếp Trưởng)',
  phone: '089 890 2222',
  company: 'Bếp Ăn Mẫu TPS1',
  email: 'bep.mau@thucphamsomot.vn',
  taxCode: '0312345678',
  address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
  defaultShippingAddress: {
    alias: 'Bếp chính',
    address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    name: 'Nguyễn Văn An',
    phone: '089 890 2222',
  },
  tier: 'VIP',
  discountPercent: 5,
  verificationStatus: 'verified',
  mustChangePassword: false,
};

type RawMockProduct = [
  sku: string,
  name: string,
  category: string,
  unit: string,
  price: number,
  priceOnRequest: boolean,
  stockQty: number,
  minOrderQty: number,
  orderStep: number,
  enforceOrderStep: boolean,
  packagingNote: string,
];

const RAW_50_PRODUCTS: RawMockProduct[] = [
  ['RC-001', 'Cải thìa Đà Lạt loại 1', 'Rau củ quả', 'Kg', 22000, false, 180, 1, 0.5, false, 'Đóng sọt 10kg sạch gốc'],
  ['RC-002', 'Cà chua beef Đà Lạt chín đỏ', 'Rau củ quả', 'Kg', 28000, false, 140, 1, 0.5, false, 'Thùng carton lót giấy 10kg'],
  ['RC-003', 'Khoai tây vàng Đà Lạt size vừa', 'Rau củ quả', 'Kg', 26000, false, 220, 2, 1, false, 'Bao lưới 20kg'],
  ['RC-004', 'Cà rốt Đà Lạt không đầu', 'Rau củ quả', 'Kg', 21000, false, 195, 1, 0.5, false, 'Túi PE 5kg'],
  ['RC-005', 'Hành lá tươi cắt sạch rễ', 'Rau củ quả', 'Kg', 38000, false, 45, 0.5, 0.1, false, 'Bó 1kg bọc lá chuối'],
  ['RC-006', 'Rau muống nước cọng non', 'Rau củ quả', 'Kg', 19000, false, 130, 1, 0.5, false, 'Bó 2kg'],
  ['RC-007', 'Bắp cải trắng Đà Lạt', 'Rau củ quả', 'Kg', 17500, false, 210, 2, 1, false, 'Bao 15kg'],
  ['RC-008', 'Dưa leo baby giòn ngọt', 'Rau củ quả', 'Kg', 24000, false, 95, 1, 0.5, false, 'Rổ nhựa 10kg'],
  ['RC-009', 'Ớt sừng đỏ không cay', 'Rau củ quả', 'Kg', 49000, false, 18, 0.2, 0.1, false, 'Túi 0.5kg'],
  ['RC-010', 'Nấm đùi gà tươi gói 500g', 'Rau củ quả', 'Gói', 32000, false, 70, 1, 1, true, 'Gói hút chân không 500g'],

  ['TH-001', 'Ba rọi heo rút sườn tươi', 'Thịt heo', 'Kg', 148000, false, 85, 1, 0.5, false, 'Khay hút chân không 2kg'],
  ['TH-002', 'Nạc dăm heo nhập khẩu', 'Thịt heo', 'Kg', 124000, false, 110, 1, 0.5, false, 'Khối 3-5kg'],
  ['TH-003', 'Sườn non heo cắt khúc bếp ăn', 'Thịt heo', 'Kg', 162000, false, 60, 1, 0.5, false, 'Cắt sẵn 3-4cm theo yêu cầu'],
  ['TH-004', 'Thịt heo xay sẵn tỉ lệ 80/20', 'Thịt heo', 'Kg', 115000, false, 75, 1, 0.5, false, 'Đóng túi 2kg ướp lạnh'],
  ['TH-005', 'Chân giò heo trước rút xương', 'Thịt heo', 'Kg', 118000, false, 40, 1, 0.5, false, 'Túi 2kg'],

  ['TB-001', 'Thăn nội bò Úc (Tenderloin)', 'Thịt bò', 'Kg', 0, true, 22, 1, 0.5, false, 'Giá biến động theo ngày'],
  ['TB-002', 'Bắp bò hoa nhập khẩu', 'Thịt bò', 'Kg', 225000, false, 55, 1, 0.5, false, 'Đóng gói chân không 2kg'],
  ['TB-003', 'Ba chỉ bò Mỹ cuộn sẵn', 'Thịt bò', 'Kg', 198000, false, 90, 1, 1, true, 'Khay 1kg thái lát 2mm'],
  ['TB-004', 'Nạm bò tươi hầm bếp ăn', 'Thịt bò', 'Kg', 182000, false, 38, 1, 0.5, false, 'Túi 2kg'],

  ['GV-001', 'Ức gà phi lê không da', 'Gà, vịt', 'Kg', 74000, false, 160, 2, 1, false, 'Túi 2kg bảo quản mát'],
  ['GV-002', 'Đùi tỏi gà công nghiệp', 'Gà, vịt', 'Kg', 68000, false, 140, 2, 1, false, 'Túi 5kg'],
  ['GV-003', 'Cánh gà giữa làm sạch', 'Gà, vịt', 'Kg', 96000, false, 65, 1, 0.5, false, 'Túi 2kg'],
  ['GV-004', 'Thịt vịt làm sạch nguyên con', 'Gà, vịt', 'Kg', 82000, false, 48, 2, 1, false, 'Con 1.8-2.2kg'],

  ['HS-001', 'Tôm sú tươi size 30 con/kg', 'Hải sản', 'Kg', 0, true, 30, 1, 0.5, false, 'Báo giá theo phiên sáng'],
  ['HS-002', 'Cá diêu hồng làm sạch đánh vảy', 'Hải sản', 'Kg', 69000, false, 70, 2, 1, false, 'Đóng đá giữ lạnh'],
  ['HS-003', 'Mực ống tươi làm sạch ruột', 'Hải sản', 'Kg', 0, true, 25, 1, 0.5, false, 'Chờ sale chốt giá đầu ngày'],
  ['HS-004', 'Phi lê cá basa không xương', 'Hải sản', 'Kg', 64000, false, 150, 2, 1, false, 'Thùng 10kg'],
  ['HS-005', 'Nghêu lụa sạch cát', 'Hải sản', 'Kg', 52000, false, 50, 2, 1, false, 'Túi lưới 2kg'],

  ['GA-001', 'Gạo ST25 Ông Cua (Bao 25kg)', 'Gạo', 'Bao', 865000, false, 60, 1, 1, true, 'Bao PP 25kg chuẩn'],
  ['GA-002', 'Gạo tấm thơm nấu cơm văn phòng', 'Gạo', 'Bao', 495000, false, 85, 1, 1, true, 'Bao 25kg'],
  ['TR-001', 'Trứng gà công nghiệp size L (Vỉ 30)', 'Trứng', 'Vỉ', 76000, false, 120, 1, 1, true, 'Vỉ giấy 30 quả'],
  ['TR-002', 'Trứng vịt tươi loại 1 (Vỉ 30)', 'Trứng', 'Vỉ', 92000, false, 75, 1, 1, true, 'Vỉ 30 quả'],
  ['DH-001', 'Đậu hũ trắng non làm thủ công', 'Đậu hũ', 'Cái', 4500, false, 300, 10, 5, true, 'Khay ngâm nước sạch'],
  ['DH-002', 'Đậu hũ chiên sẵn miếng lớn', 'Đậu hũ', 'Cái', 5200, false, 240, 10, 5, true, 'Đóng túi 20 miếng'],

  ['BT-001', 'Bún tươi sợi vừa làm trong ngày', 'Bún tươi', 'Kg', 18000, false, 100, 2, 1, false, 'Đóng túi 5kg'],
  ['BT-002', 'Bánh phở tươi sợi dẹp', 'Bún tươi', 'Kg', 22000, false, 80, 2, 1, false, 'Túi 2kg'],

  ['DK-001', 'Miến dong Phú Hương loại ngon', 'Đồ khô', 'Kg', 78000, false, 65, 1, 1, true, 'Bịch 1kg'],
  ['DK-002', 'Nấm mèo đen khô cắt sợi', 'Đồ khô', 'Kg', 135000, false, 40, 0.5, 0.5, false, 'Túi 500g'],
  ['DK-003', 'Tàu hũ ky lá chiên giòn', 'Đồ khô', 'Gói', 42000, false, 55, 1, 1, true, 'Gói 300g'],

  ['GI-001', 'Dầu ăn Tường An Cooking (Can 5L)', 'Gia vị', 'Can', 238000, false, 90, 1, 1, true, 'Can nhựa 5 lít'],
  ['GI-002', 'Nước mắm Nam Ngư Đệ Nhị (Can 5L)', 'Gia vị', 'Can', 165000, false, 70, 1, 1, true, 'Can 5 lít'],
  ['GI-003', 'Đường tinh luyện Biên Hòa (Bao 12kg)', 'Gia vị', 'Bao', 312000, false, 45, 1, 1, true, 'Bao 12 gói x 1kg'],
  ['GI-004', 'Hạt nêm Knorr thịt thăn (Gói 5kg)', 'Gia vị', 'Gói', 275000, false, 35, 1, 1, true, 'Gói công nghiệp 5kg'],

  ['DL-001', 'Khoai tây cọng đông lạnh Aviko 2.5kg', 'Đông lạnh', 'Gói', 145000, false, 50, 1, 1, true, 'Thùng 4 gói'],
  ['DL-002', 'Chả giò rế hải sản đông lạnh', 'Chay, chả giò', 'Hộp', 68000, false, 60, 2, 1, true, 'Hộp 500g (20 cuốn)'],

  ['TC-001', 'Chuối già Nam Mỹ chín vàng', 'Trái cây', 'Kg', 26000, false, 95, 2, 1, false, 'Nải 2-3kg'],
  ['TC-002', 'Cam sành Vĩnh Long vắt nước', 'Trái cây', 'Kg', 24000, false, 140, 5, 1, false, 'Bao lưới 10kg'],
  ['BS-001', 'Sữa tươi tiệt trùng Vinamilk không đường (Thùng 48)', 'Bánh sữa', 'Thùng', 382000, false, 40, 1, 1, true, 'Thùng 48 hộp 180ml'],

  ['NF-001', 'Hộp cơm bã mía 3 ngăn nắp gài (Lốc 50)', 'Nonfood', 'Lốc', 89000, false, 110, 1, 1, true, 'Lốc 50 hộp'],
  ['CC-001', 'Màng bọc thực phẩm công nghiệp 45cm x 400m', 'Công cụ dụng cụ', 'Cuộn', 195000, false, 28, 1, 1, true, 'Hộp dao cắt sẵn'],
];

export const DEMO_PRODUCTS: Product[] = RAW_50_PRODUCTS.map(
  (
    [sku, name, category, unit, price, priceOnRequest, stockQty, minOrderQty, orderStep, enforceOrderStep, packagingNote],
    index
  ) => {
    const id = `prod-${String(index + 1).padStart(3, '0')}`;
    const thumb = makeThumb(category, sku);
    return {
      id,
      sku,
      name,
      category,
      unit,
      imageUrl: thumb,
      thumbUrl: thumb,
      price,
      priceOnRequest,
      available: true,
      stockQty,
      minOrderQty,
      orderStep,
      enforceOrderStep,
      packagingNote,
      quantityPrecision: unit === 'Kg' ? 2 : 0,
    };
  }
);

export const DEMO_PRODUCT_CATALOG: ProductCatalogResponse = {
  ok: true,
  count: DEMO_PRODUCTS.length,
  imageBaseUrl: '',
  items: DEMO_PRODUCTS.map((p) => [
    p.id,
    p.sku,
    p.name,
    p.category,
    p.unit,
    p.price,
    Boolean(p.priceOnRequest),
    false,
  ]),
};

export const DEMO_FREQUENT_ITEMS: FrequentItem[] = DEMO_PRODUCTS.slice(0, 10).map((p, idx) => ({
  productId: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  unit: p.unit,
  price: p.price,
  priceOnRequest: p.priceOnRequest,
  imageUrl: p.imageUrl,
  totalQuantity: (10 - idx) * 12,
  orderCount: 15 - idx,
}));

const demoAddressesState = [
  {
    id: 'addr-001',
    label: 'Bếp Trung Tâm Q1',
    address: '125 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    contactName: 'Nguyễn Văn An',
    contactPhone: '0909123456',
    isDefault: true,
  },
  {
    id: 'addr-002',
    label: 'Chi nhánh Thủ Đức',
    address: '88 Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP.HCM',
    contactName: 'Trần Thị Mai',
    contactPhone: '0918222333',
    isDefault: false,
  },
  {
    id: 'addr-003',
    label: 'Kho Bếp KCN Tân Bình',
    address: 'Lô III-12, Đường CN1, KCN Tân Bình, Quận Tân Phú, TP.HCM',
    contactName: 'Lê Hoàng Nam',
    contactPhone: '0933444555',
    isDefault: false,
  },
];

let demoAccountState: AccountProfile = {
  name: DEMO_CUSTOMER_SESSION.name,
  company: DEMO_CUSTOMER_SESSION.company,
  taxCode: DEMO_CUSTOMER_SESSION.taxCode || '',
  email: DEMO_CUSTOMER_SESSION.email || '',
  address: DEMO_CUSTOMER_SESSION.address || '',
  username: 'bepaau_demo',
  usernameChangedAt: null,
  avatarUrl: null,
  request: null,
};

function buildOrderItem(product: Product, quantity: number, note = '', idx = 0) {
  const unitPrice = product.price || 0;
  return {
    id: `oi-${product.id}-${idx}`,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    quantity,
    price: unitPrice,
    finalUnitPrice: unitPrice,
    lineTotal: Math.round(unitPrice * quantity),
    finalLineTotal: Math.round(unitPrice * quantity),
    customerNote: note,
    itemNote: note,
  };
}

const demoOrdersState: Order[] = [
  {
    id: 'ord-demo-001',
    order_code: 'DH2611-001',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'CREDIT',
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    delivery_date: localDateOffset(1),
    delivery_address: demoAddressesState[0].address,
    delivery_name: demoAddressesState[0].contactName,
    delivery_phone: demoAddressesState[0].contactPhone,
    delivery_type: 'shipping',
    grand_total: 1966000,
    subtotal: 1966000,
    note: '[Ca: Ca sáng sớm (05:00 - 07:00)] - Giao cửa sau bếp',
    items: [
      buildOrderItem(DEMO_PRODUCTS[0], 10, 'Rửa sạch gốc', 1),
      buildOrderItem(DEMO_PRODUCTS[10], 5, 'Cắt lát 1cm', 2),
      buildOrderItem(DEMO_PRODUCTS[28], 1, '', 3),
    ],
  },
  {
    id: 'ord-demo-002',
    order_code: 'DH2611-002',
    status: 'confirmed',
    payment_status: 'cod',
    payment_method: 'COD',
    created_at: new Date(Date.now() - 8 * 3600_000).toISOString(),
    delivery_date: localDateOffset(1),
    delivery_address: demoAddressesState[1].address,
    delivery_name: demoAddressesState[1].contactName,
    delivery_phone: demoAddressesState[1].contactPhone,
    delivery_type: 'shipping',
    grand_total: 1412000,
    subtotal: 1412000,
    note: '[Ca: Ca sáng (07:00 - 09:00)]',
    items: [
      buildOrderItem(DEMO_PRODUCTS[19], 10, '', 1),
      buildOrderItem(DEMO_PRODUCTS[30], 4, '', 2),
      buildOrderItem(DEMO_PRODUCTS[39], 1, '', 3),
    ],
  },
  {
    id: 'ord-demo-003',
    order_code: 'DH2611-003',
    status: 'preparing',
    payment_status: 'paid',
    payment_method: 'BANK_TRANSFER',
    created_at: new Date(Date.now() - 20 * 3600_000).toISOString(),
    delivery_date: localDateOffset(0),
    delivery_address: demoAddressesState[0].address,
    delivery_name: demoAddressesState[0].contactName,
    delivery_phone: demoAddressesState[0].contactPhone,
    delivery_type: 'shipping',
    grand_total: 1188000,
    subtotal: 1188000,
    items: [
      buildOrderItem(DEMO_PRODUCTS[17], 4, '', 1),
      buildOrderItem(DEMO_PRODUCTS[2], 8, '', 2),
      buildOrderItem(DEMO_PRODUCTS[34], 10, '', 3),
    ],
  },
  {
    id: 'ord-demo-004',
    order_code: 'DH2611-004',
    status: 'shipping',
    payment_status: 'pending',
    payment_method: 'CREDIT',
    created_at: new Date(Date.now() - 28 * 3600_000).toISOString(),
    delivery_date: localDateOffset(0),
    delivery_address: demoAddressesState[2].address,
    delivery_name: demoAddressesState[2].contactName,
    delivery_phone: demoAddressesState[2].contactPhone,
    delivery_type: 'shipping',
    grand_total: 980000,
    subtotal: 980000,
    items: [
      buildOrderItem(DEMO_PRODUCTS[24], 8, 'Làm sạch bỏ vảy', 1),
      buildOrderItem(DEMO_PRODUCTS[26], 6, '', 2),
    ],
  },
  {
    id: 'ord-demo-005',
    order_code: 'DH2611-005',
    status: 'completed',
    payment_status: 'paid',
    payment_method: 'BANK_TRANSFER',
    created_at: new Date(Date.now() - 72 * 3600_000).toISOString(),
    delivery_date: localDateOffset(-2),
    delivery_address: demoAddressesState[0].address,
    delivery_name: demoAddressesState[0].contactName,
    delivery_phone: demoAddressesState[0].contactPhone,
    delivery_type: 'shipping',
    grand_total: 2345000,
    subtotal: 2345000,
    items: [
      buildOrderItem(DEMO_PRODUCTS[29], 2, '', 1),
      buildOrderItem(DEMO_PRODUCTS[41], 2, '', 2),
      buildOrderItem(DEMO_PRODUCTS[47], 2, '', 3),
    ],
  },
];

export function handleOrderDemoRequest<T>(
  path: string,
  opts: { method?: string; body?: unknown; formData?: FormData } = {}
): T | null {
  const method = (opts.method || 'GET').toUpperCase();
  const [pathname, rawQuery = ''] = path.split('?');
  const params = new URLSearchParams(rawQuery);
  const body = (opts.body && typeof opts.body === 'object' ? opts.body : {}) as Record<string, any>;

  if (pathname === '/api/customer/session') {
    return { ok: true, session: DEMO_CUSTOMER_SESSION } as T;
  }
  if (pathname === '/api/customer/login' && method === 'POST') {
    return { ok: true, session: DEMO_CUSTOMER_SESSION } as T;
  }
  if (pathname === '/api/customer/account') {
    if (method === 'PATCH') {
      demoAccountState = {
        ...demoAccountState,
        name: String(body.name ?? demoAccountState.name),
        email: String(body.email ?? demoAccountState.email),
        address: String(body.address ?? demoAccountState.address),
      };
    }
    return { ok: true, account: demoAccountState } as T;
  }
  if (pathname === '/api/customer/addresses') {
    if (method === 'POST') {
      if (body.isDefault) demoAddressesState.forEach((a) => (a.isDefault = false));
      demoAddressesState.push({
        id: `addr-${Date.now()}`,
        label: String(body.label || 'Địa chỉ mới'),
        address: String(body.address || ''),
        contactName: String(body.contactName || ''),
        contactPhone: String(body.contactPhone || ''),
        isDefault: Boolean(body.isDefault),
      });
      return { ok: true } as T;
    }
    if (method === 'PATCH' && body.isDefault && body.id) {
      demoAddressesState.forEach((a) => (a.isDefault = a.id === body.id));
      return { ok: true } as T;
    }
    if (method === 'DELETE') {
      const id = params.get('id');
      const idx = demoAddressesState.findIndex((a) => a.id === id);
      if (idx >= 0) demoAddressesState.splice(idx, 1);
      return { ok: true } as T;
    }
    return { ok: true, addresses: [...demoAddressesState] } as T;
  }
  if (pathname.startsWith('/api/customer/addresses/') && method === 'PATCH') {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    const target = demoAddressesState.find((a) => a.id === id);
    if (target) {
      target.label = String(body.label ?? target.label);
      target.address = String(body.address ?? target.address);
      target.contactName = String(body.contactName ?? target.contactName);
      target.contactPhone = String(body.contactPhone ?? target.contactPhone);
    }
    return { ok: true } as T;
  }
  // Không chặn /api/customer/products và /api/customer/frequent-items để luôn lấy 5.295+ sản phẩm & ảnh thật từ https://thucphamsomot.vn
  if (pathname === '/api/customer/frequent-items') {
    return { ok: true, items: [] } as T;
  }
  if (pathname === '/api/customer/order-config') {
    const tomorrow = localDateOffset(1);
    return {
      ok: true,
      earliestDate: tomorrow,
      deliveryDate: tomorrow,
      cutoffAt: `${localDateOffset(0)}T16:30:00+07:00`,
      cutoffTimeStr: '16:30',
      minutesLeft: 145,
      isLate: false,
    } as T;
  }
  if (pathname === '/api/customer/orders') {
    return { ok: true, orders: [...demoOrdersState] } as T;
  }
  if (pathname === '/api/customer/orders/cancel' && method === 'POST') {
    const found = demoOrdersState.find((o) => o.id === body.orderId);
    if (found) found.status = 'canceled';
    return { ok: true, orderId: body.orderId, status: 'canceled' } as T;
  }
  if (pathname === '/api/customer/order' && method === 'POST') {
    const items = Array.isArray(body.items) ? body.items : [];
    const byId = new Map(DEMO_PRODUCTS.map((p) => [p.id, p]));
    let total = 0;
    let pendingPriceCount = 0;
    const orderItems = items.map((it: any, i: number) => {
      const prod = byId.get(it.productId);
      const unitPrice = prod?.price || 0;
      const qty = Number(it.quantity) || 1;
      if (!unitPrice || prod?.priceOnRequest || it.isUnlisted) pendingPriceCount += 1;
      total += Math.round(unitPrice * qty);
      return {
        id: `oi-new-${Date.now()}-${i}`,
        productId: it.productId,
        sku: prod?.sku || '',
        name: it.name || prod?.name || 'Mặt hàng',
        unit: it.unit || prod?.unit || 'Kg',
        quantity: qty,
        price: unitPrice,
        finalUnitPrice: unitPrice,
        lineTotal: Math.round(unitPrice * qty),
        finalLineTotal: Math.round(unitPrice * qty),
        customerNote: it.note || '',
      };
    });
    const orderId = `ord-demo-${Date.now()}`;
    const orderCode = `DH2611-${String(demoOrdersState.length + 1).padStart(3, '0')}`;
    demoOrdersState.unshift({
      id: orderId,
      order_code: orderCode,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'CREDIT',
      created_at: new Date().toISOString(),
      delivery_date: body.deliveryDate || localDateOffset(1),
      delivery_address: body.deliveryAddress || '',
      delivery_name: body.deliveryName || '',
      delivery_phone: body.deliveryPhone || '',
      delivery_type: 'shipping',
      grand_total: total,
      subtotal: total,
      note: body.note || '',
      items: orderItems,
    });
    return { ok: true, orderId, orderCode, total, pendingPriceCount } as T;
  }

  return null;
}

export function getDemoProductThumb(category: string | null | undefined, sku: string | null | undefined): string {
  return makeThumb(category || null, sku || 'TPS1');
}
