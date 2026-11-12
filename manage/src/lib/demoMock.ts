import type { User } from '../contexts/AuthContext';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_STAFF_USER: User = {
  id: 'demo-staff-admin',
  name: 'Nguyễn Minh Quân (Demo)',
  userType: 'staff',
  role: 'admin',
  position: 'quan_tri_he_thong',
  email: 'admin@tps1-demo.vn',
};

const CATEGORY_VISUALS: Record<string, { bg: string; fg: string }> = {
  'Rau củ quả': { bg: '#e8f7ee', fg: '#0f7a4f' },
  'Thịt heo': { bg: '#fdecec', fg: '#b91c1c' },
  'Thịt bò': { bg: '#fae8e8', fg: '#991b1b' },
  'Gà, vịt': { bg: '#fef5e7', fg: '#b45309' },
  'Hải sản': { bg: '#e8f4fc', fg: '#0369a1' },
  'Đồ khô': { bg: '#f5efe6', fg: '#78350f' },
  'Gia vị': { bg: '#fff3e0', fg: '#c2410c' },
  'Trứng': { bg: '#fef9c3', fg: '#a16207' },
  'Gạo': { bg: '#f4f4ef', fg: '#3f6212' },
  'Đậu hũ': { bg: '#f8fafc', fg: '#475569' },
  'Đông lạnh': { bg: '#ecfeff', fg: '#0e7490' },
  'Bún tươi': { bg: '#f0fdf4', fg: '#15803d' },
  'Trái cây': { bg: '#fef2f2', fg: '#be123c' },
  'Bánh sữa': { bg: '#eff6ff', fg: '#1d4ed8' },
  'Chay, chả giò': { bg: '#ecfdf5', fg: '#047857' },
  'Nonfood': { bg: '#f1f5f9', fg: '#334155' },
  'Công cụ dụng cụ': { bg: '#f3f4f6', fg: '#1f2937' },
};

function makeThumb(category: string, sku: string): string {
  const style = CATEGORY_VISUALS[category] || { bg: '#eaf6ef', fg: '#0f7a4f' };
  const label = sku.split('-')[0] || 'TPS1';
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
  origin: string,
  supplier: string,
];

const RAW_50_PRODUCTS: RawMockProduct[] = [
  ['RC-001', 'Cải thìa Đà Lạt loại 1', 'Rau củ quả', 'Kg', 22000, false, 180, 1, 0.5, false, 'Đóng sọt 10kg sạch gốc', 'Lâm Đồng', 'HTX Rau Sạch Đà Lạt'],
  ['RC-002', 'Cà chua beef Đà Lạt chín đỏ', 'Rau củ quả', 'Kg', 28000, false, 140, 1, 0.5, false, 'Thùng carton lót giấy 10kg', 'Lâm Đồng', 'HTX Rau Sạch Đà Lạt'],
  ['RC-003', 'Khoai tây vàng Đà Lạt size vừa', 'Rau củ quả', 'Kg', 26000, false, 220, 2, 1, false, 'Bao lưới 20kg', 'Lâm Đồng', 'Nông sản Cao Nguyên'],
  ['RC-004', 'Cà rốt Đà Lạt không đầu', 'Rau củ quả', 'Kg', 21000, false, 195, 1, 0.5, false, 'Túi PE 5kg', 'Lâm Đồng', 'Nông sản Cao Nguyên'],
  ['RC-005', 'Hành lá tươi cắt sạch rễ', 'Rau củ quả', 'Kg', 38000, false, 8, 0.5, 0.1, false, 'Bó 1kg bọc lá chuối', 'Tiền Giang', 'Nhà vườn Cái Bè'],
  ['RC-006', 'Rau muống nước cọng non', 'Rau củ quả', 'Kg', 19000, false, 130, 1, 0.5, false, 'Bó 2kg', 'Long An', 'Vườn Rau Bến Lức'],
  ['RC-007', 'Bắp cải trắng Đà Lạt', 'Rau củ quả', 'Kg', 17500, false, 210, 2, 1, false, 'Bao 15kg', 'Lâm Đồng', 'HTX Rau Sạch Đà Lạt'],
  ['RC-008', 'Dưa leo baby giòn ngọt', 'Rau củ quả', 'Kg', 24000, false, 95, 1, 0.5, false, 'Rổ nhựa 10kg', 'Đồng Nai', 'Trang trại Xuân Lộc'],
  ['RC-009', 'Ớt sừng đỏ không cay', 'Rau củ quả', 'Kg', 49000, false, 6, 0.2, 0.1, false, 'Túi 0.5kg', 'Tiền Giang', 'Nhà vườn Cái Bè'],
  ['RC-010', 'Nấm đùi gà tươi gói 500g', 'Rau củ quả', 'Gói', 32000, false, 70, 1, 1, true, 'Gói hút chân không 500g', 'Bình Dương', 'Nấm Việt'],

  ['TH-001', 'Ba rọi heo rút sườn tươi', 'Thịt heo', 'Kg', 148000, false, 85, 1, 0.5, false, 'Khay hút chân không 2kg', 'Đồng Nai', 'Vissan / CP'],
  ['TH-002', 'Nạc dăm heo nhập khẩu', 'Thịt heo', 'Kg', 124000, false, 110, 1, 0.5, false, 'Khối 3-5kg', 'Ba Lan', 'Thực phẩm Á Châu'],
  ['TH-003', 'Sườn non heo cắt khúc bếp ăn', 'Thịt heo', 'Kg', 162000, false, 60, 1, 0.5, false, 'Cắt sẵn 3-4cm theo yêu cầu', 'Đồng Nai', 'Vissan / CP'],
  ['TH-004', 'Thịt heo xay sẵn tỉ lệ 80/20', 'Thịt heo', 'Kg', 115000, false, 75, 1, 0.5, false, 'Đóng túi 2kg ướp lạnh', 'TP.HCM', 'Xưởng sơ chế TPS1'],
  ['TH-005', 'Chân giò heo trước rút xương', 'Thịt heo', 'Kg', 118000, false, 40, 1, 0.5, false, 'Túi 2kg', 'Đồng Nai', 'Vissan / CP'],

  ['TB-001', 'Thăn nội bò Úc (Tenderloin)', 'Thịt bò', 'Kg', 0, true, 9, 1, 0.5, false, 'Giá biến động theo ngày', 'Úc', 'Meat & Livestock AU'],
  ['TB-002', 'Bắp bò hoa nhập khẩu', 'Thịt bò', 'Kg', 225000, false, 55, 1, 0.5, false, 'Đóng gói chân không 2kg', 'Ấn Độ', 'Allana Foods'],
  ['TB-003', 'Ba chỉ bò Mỹ cuộn sẵn', 'Thịt bò', 'Kg', 198000, false, 90, 1, 1, true, 'Khay 1kg thái lát 2mm', 'Mỹ', 'Excel Beef'],
  ['TB-004', 'Nạm bò tươi hầm bếp ăn', 'Thịt bò', 'Kg', 182000, false, 38, 1, 0.5, false, 'Túi 2kg', 'Úc', 'Meat & Livestock AU'],

  ['GV-001', 'Ức gà phi lê không da', 'Gà, vịt', 'Kg', 74000, false, 160, 2, 1, false, 'Túi 2kg bảo quản mát', 'Bình Phước', 'CP Foods'],
  ['GV-002', 'Đùi tỏi gà công nghiệp', 'Gà, vịt', 'Kg', 68000, false, 140, 2, 1, false, 'Túi 5kg', 'Bình Phước', 'CP Foods'],
  ['GV-003', 'Cánh gà giữa làm sạch', 'Gà, vịt', 'Kg', 96000, false, 65, 1, 0.5, false, 'Túi 2kg', 'Long An', 'SanHà Foods'],
  ['GV-004', 'Thịt vịt làm sạch nguyên con', 'Gà, vịt', 'Kg', 82000, false, 48, 2, 1, false, 'Con 1.8-2.2kg', 'Long An', 'SanHà Foods'],

  ['HS-001', 'Tôm sú tươi size 30 con/kg', 'Hải sản', 'Kg', 0, true, 12, 1, 0.5, false, 'Báo giá theo phiên sáng', 'Cà Mau', 'Chợ đầu mối Bình Điền'],
  ['HS-002', 'Cá diêu hồng làm sạch đánh vảy', 'Hải sản', 'Kg', 69000, false, 70, 2, 1, false, 'Đóng đá giữ lạnh', 'Tiền Giang', 'Chợ đầu mối Bình Điền'],
  ['HS-003', 'Mực ống tươi làm sạch ruột', 'Hải sản', 'Kg', 0, true, 14, 1, 0.5, false, 'Chờ sale chốt giá đầu ngày', 'Phan Thiết', 'Hải sản Biển Đông'],
  ['HS-004', 'Phi lê cá basa không xương', 'Hải sản', 'Kg', 64000, false, 150, 2, 1, false, 'Thùng 10kg', 'An Giang', 'Vĩnh Hoàn'],
  ['HS-005', 'Nghêu lụa sạch cát', 'Hải sản', 'Kg', 52000, false, 50, 2, 1, false, 'Túi lưới 2kg', 'Bến Tre', 'Hải sản Miền Tây'],

  ['GA-001', 'Gạo ST25 Ông Cua (Bao 25kg)', 'Gạo', 'Bao', 865000, false, 60, 1, 1, true, 'Bao PP 25kg chuẩn', 'Sóc Trăng', 'DNTN Hồ Quang Trí'],
  ['GA-002', 'Gạo tấm thơm nấu cơm văn phòng', 'Gạo', 'Bao', 495000, false, 85, 1, 1, true, 'Bao 25kg', 'An Giang', 'Lộc Trời'],
  ['TR-001', 'Trứng gà công nghiệp size L (Vỉ 30)', 'Trứng', 'Vỉ', 76000, false, 120, 1, 1, true, 'Vỉ giấy 30 quả', 'Bình Dương', 'Ba Huân'],
  ['TR-002', 'Trứng vịt tươi loại 1 (Vỉ 30)', 'Trứng', 'Vỉ', 92000, false, 75, 1, 1, true, 'Vỉ 30 quả', 'Long An', 'Vĩnh Thành Đạt'],
  ['DH-001', 'Đậu hũ trắng non làm thủ công', 'Đậu hũ', 'Cái', 4500, false, 300, 10, 5, true, 'Khay ngâm nước sạch', 'TP.HCM', 'Lò đậu hũ Bình Chánh'],
  ['DH-002', 'Đậu hũ chiên sẵn miếng lớn', 'Đậu hũ', 'Cái', 5200, false, 240, 10, 5, true, 'Đóng túi 20 miếng', 'TP.HCM', 'Lò đậu hũ Bình Chánh'],

  ['BT-001', 'Bún tươi sợi vừa làm trong ngày', 'Bún tươi', 'Kg', 18000, false, 100, 2, 1, false, 'Đóng túi 5kg', 'TP.HCM', 'Lò bún Thủ Đức'],
  ['BT-002', 'Bánh phở tươi sợi dẹp', 'Bún tươi', 'Kg', 22000, false, 80, 2, 1, false, 'Túi 2kg', 'TP.HCM', 'Lò bún Thủ Đức'],

  ['DK-001', 'Miến dong Phú Hương loại ngon', 'Đồ khô', 'Kg', 78000, false, 65, 1, 1, true, 'Bịch 1kg', 'Việt Nam', 'Acecook / Phú Hương'],
  ['DK-002', 'Nấm mèo đen khô cắt sợi', 'Đồ khô', 'Kg', 135000, false, 40, 0.5, 0.5, false, 'Túi 500g', 'Đồng Nai', 'Nông sản Miền Đông'],
  ['DK-003', 'Tàu hũ ky lá chiên giòn', 'Đồ khô', 'Gói', 42000, false, 55, 1, 1, true, 'Gói 300g', 'Vĩnh Long', 'Làng nghề Mỹ Hòa'],

  ['GI-001', 'Dầu ăn Tường An Cooking (Can 5L)', 'Gia vị', 'Can', 238000, false, 90, 1, 1, true, 'Can nhựa 5 lít', 'Việt Nam', 'Tường An / Kido'],
  ['GI-002', 'Nước mắm Nam Ngư Đệ Nhị (Can 5L)', 'Gia vị', 'Can', 165000, false, 70, 1, 1, true, 'Can 5 lít', 'Việt Nam', 'Masan Consumer'],
  ['GI-003', 'Đường tinh luyện Biên Hòa (Bao 12kg)', 'Gia vị', 'Bao', 312000, false, 45, 1, 1, true, 'Bao 12 gói x 1kg', 'Tây Ninh', 'TTC Biên Hòa'],
  ['GI-004', 'Hạt nêm Knorr thịt thăn (Gói 5kg)', 'Gia vị', 'Gói', 275000, false, 35, 1, 1, true, 'Gói công nghiệp 5kg', 'Việt Nam', 'Unilever Food Solutions'],

  ['DL-001', 'Khoai tây cọng đông lạnh Aviko 2.5kg', 'Đông lạnh', 'Gói', 145000, false, 50, 1, 1, true, 'Thùng 4 gói', 'Hà Lan', 'Aviko'],
  ['DL-002', 'Chả giò rế hải sản đông lạnh', 'Chay, chả giò', 'Hộp', 68000, false, 60, 2, 1, true, 'Hộp 500g (20 cuốn)', 'Việt Nam', 'Cầu Tre'],

  ['TC-001', 'Chuối già Nam Mỹ chín vàng', 'Trái cây', 'Kg', 26000, false, 95, 2, 1, false, 'Nải 2-3kg', 'Long An', 'Huy Long An'],
  ['TC-002', 'Cam sành Vĩnh Long vắt nước', 'Trái cây', 'Kg', 24000, false, 140, 5, 1, false, 'Bao lưới 10kg', 'Vĩnh Long', 'Nhà vườn Tam Bình'],
  ['BS-001', 'Sữa tươi tiệt trùng Vinamilk không đường (Thùng 48)', 'Bánh sữa', 'Thùng', 382000, false, 40, 1, 1, true, 'Thùng 48 hộp 180ml', 'Việt Nam', 'Vinamilk'],

  ['NF-001', 'Hộp cơm bã mía 3 ngăn nắp gài (Lốc 50)', 'Nonfood', 'Lốc', 89000, false, 110, 1, 1, true, 'Lốc 50 hộp', 'Việt Nam', 'Bao bì Sinh Học'],
  ['CC-001', 'Màng bọc thực phẩm công nghiệp 45cm x 400m', 'Công cụ dụng cụ', 'Cuộn', 195000, false, 7, 1, 1, true, 'Hộp dao cắt sẵn', 'Việt Nam', 'Ringo Wrap'],
];

const demoProducts = RAW_50_PRODUCTS.map(
  (
    [sku, name, category, unit, price, priceOnRequest, stockQty, minOrderQty, orderStep, enforceOrderStep, packagingNote, origin, supplier],
    index
  ) => {
    const id = `prod-${String(index + 1).padStart(3, '0')}`;
    const wholesale = price > 0 ? Math.round(price * 0.94) : 0;
    const cost = price > 0 ? Math.round(price * 0.82) : 0;
    return {
      id,
      sku,
      name,
      category,
      sub_category: category,
      unit,
      image_url: makeThumb(category, sku),
      price_retail: price,
      price_wholesale: wholesale,
      cost_price: cost,
      last_import_price: cost,
      price_on_request: priceOnRequest,
      stock_qty: stockQty,
      track_inventory: true,
      is_low_stock: stockQty <= 15,
      min_order_qty: minOrderQty,
      order_step: orderStep,
      enforce_order_step: enforceOrderStep,
      quantity_precision: unit === 'Kg' ? 2 : 0,
      quantity_adjustment_mode: 'reject',
      packaging_note: packagingNote,
      short_description: `${name} — ${packagingNote}`,
      origin,
      supplier,
      tags: `${category}, ${origin}`,
      is_active: true,
    };
  }
);

const demoStaffList = [
  { id: 'demo-staff-admin', name: 'Nguyễn Minh Quân', email: 'admin@tps1-demo.vn', role: 'admin', position: 'quan_tri_he_thong', is_active: true },
  { id: 'staff-sale-01', name: 'Trần Thu Hà', email: 'ha.sale@tps1-demo.vn', role: 'sale', position: 'nhan_vien', is_active: true },
  { id: 'staff-sale-02', name: 'Lê Quốc Bảo', email: 'bao.sale@tps1-demo.vn', role: 'sale', position: 'truong_nhom', is_active: true },
  { id: 'staff-thumua-01', name: 'Phạm Hoàng Long', email: 'long.thumua@tps1-demo.vn', role: 'thu_mua', position: 'nhan_vien', is_active: true },
  { id: 'staff-kho-01', name: 'Võ Văn Thành', email: 'thanh.kho@tps1-demo.vn', role: 'kho', position: 'nhan_vien', is_active: true },
];

const demoCustomers = [
  { id: 'demo-cust-001', partner_code: 'KH-BEP01', name: 'Nguyễn Văn An', company: 'Bếp Trung Tâm Á Âu', phone: '0909123456', email: 'bep.aau@tps1-demo.vn', address: '125 Lê Lợi, Q.1, TP.HCM', discount_tier: 'VIP2', customer_group: 'Bếp trung tâm', sales_rep_id: 'staff-sale-01', sales_rep_name: 'Trần Thu Hà', verification_status: 'verified', credit_limit: 100000000, payment_terms_days: 15, is_active: true },
  { id: 'demo-cust-002', partner_code: 'KH-NH02', name: 'Lê Thị Mỹ Linh', company: 'Nhà Hàng Hương Việt', phone: '0918223344', email: 'huongviet@tps1-demo.vn', address: '42 Nguyễn Huệ, Q.1, TP.HCM', discount_tier: 'VIP1', customer_group: 'Nhà hàng', sales_rep_id: 'staff-sale-01', sales_rep_name: 'Trần Thu Hà', verification_status: 'verified', credit_limit: 50000000, payment_terms_days: 7, is_active: true },
  { id: 'demo-cust-003', partner_code: 'KH-TRUONG03', name: 'Phạm Văn Đức', company: 'Trường Quốc Tế Horizon', phone: '0933556677', email: 'bep@horizon-demo.vn', address: '18 Thảo Điền, TP. Thủ Đức', discount_tier: 'VIP3', customer_group: 'Trường học', sales_rep_id: 'staff-sale-02', sales_rep_name: 'Lê Quốc Bảo', verification_status: 'verified', credit_limit: 150000000, payment_terms_days: 30, is_active: true },
  { id: 'demo-cust-004', partner_code: 'KH-KCN04', name: 'Hoàng Minh Tuấn', company: 'Suất Ăn Công Nghiệp KCN Tân Bình', phone: '0977889900', email: 'suatan@kcntb-demo.vn', address: 'Lô IV-3 KCN Tân Bình, TP.HCM', discount_tier: 'VIP3', customer_group: 'Suất ăn CN', sales_rep_id: 'staff-sale-02', sales_rep_name: 'Lê Quốc Bảo', verification_status: 'verified', credit_limit: 200000000, payment_terms_days: 30, is_active: true },
  { id: 'demo-cust-005', partner_code: 'KH-KS05', name: 'Vũ Ngọc Ánh', company: 'Khách Sạn Sài Gòn Pearl', phone: '0908776655', email: 'purchasing@sgpearl-demo.vn', address: '92 Nguyễn Hữu Cảnh, Bình Thạnh', discount_tier: 'VIP2', customer_group: 'Khách sạn', sales_rep_id: 'staff-sale-01', sales_rep_name: 'Trần Thu Hà', verification_status: 'pending', credit_limit: 80000000, payment_terms_days: 15, is_active: true },
  { id: 'demo-cust-006', partner_code: 'KH-CAFE06', name: 'Đặng Gia Huy', company: 'Chuỗi Bistro Phố Cổ', phone: '0944112233', email: 'bistro@phoco-demo.vn', address: '210 Pasteur, Q.3, TP.HCM', discount_tier: 'VIP0', customer_group: 'Nhà hàng', sales_rep_id: null, sales_rep_name: null, verification_status: 'pending', credit_limit: 30000000, payment_terms_days: 7, is_active: true },
];

function makeOrderLine(product: typeof demoProducts[number], qty: number, idx: number, note = '') {
  const unitPrice = product.price_retail || 0;
  return {
    id: `oi-${product.id}-${idx}`,
    product_id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    quantity: qty,
    ordered_quantity: qty,
    base_unit_price: unitPrice,
    unit_price: unitPrice,
    line_total: Math.round(unitPrice * qty),
    customer_note: note,
    pricing_note: '',
    vat_rate: 5,
    vat_amount: Math.round(unitPrice * qty * 0.05),
    track_inventory: true,
    stock_qty: product.stock_qty,
    low_stock: product.is_low_stock,
  };
}

const demoOrders: any[] = [
  {
    id: 'ord-demo-001',
    order_code: 'DH2611-001',
    customer_id: 'demo-cust-001',
    customer_name: 'Nguyễn Văn An',
    customer_company: 'Bếp Trung Tâm Á Âu',
    customer_phone: '0909123456',
    customer_tier: 'VIP2',
    delivery_address: '125 Lê Lợi, Q.1, TP.HCM',
    delivery_name: 'Nguyễn Văn An',
    delivery_phone: '0909123456',
    delivery_date: localDateOffset(1),
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'CREDIT',
    pricing_status: 'draft',
    source: 'website',
    sales_rep_name: 'Trần Thu Hà',
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    note: '[Ca: Ca sáng sớm (05:00 - 07:00)] - Giao cửa sau bếp',
    subtotal: 2450000,
    discount_amount: 0,
    shipping_amount: 0,
    grand_total: 2450000,
    paid_amount: 0,
    packing_status: 'not_started',
    order_items: [
      makeOrderLine(demoProducts[0], 10, 1, 'Rửa sạch gốc'),
      makeOrderLine(demoProducts[10], 5, 2, 'Cắt lát 1cm'),
      makeOrderLine(demoProducts[15], 2, 3, 'Chờ báo giá bò Úc'),
      makeOrderLine(demoProducts[28], 1, 4),
    ],
    order_history: [],
  },
  {
    id: 'ord-demo-002',
    order_code: 'DH2611-002',
    customer_id: 'demo-cust-002',
    customer_name: 'Lê Thị Mỹ Linh',
    customer_company: 'Nhà Hàng Hương Việt',
    customer_phone: '0918223344',
    customer_tier: 'VIP1',
    delivery_address: '42 Nguyễn Huệ, Q.1, TP.HCM',
    delivery_name: 'Lê Thị Mỹ Linh',
    delivery_phone: '0918223344',
    delivery_date: localDateOffset(1),
    status: 'confirmed',
    payment_status: 'cod',
    payment_method: 'COD',
    pricing_status: 'finalized',
    source: 'miniapp',
    sales_rep_name: 'Trần Thu Hà',
    created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
    confirmed_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
    note: 'Giao trước 6h30 sáng',
    subtotal: 1680000,
    discount_amount: 0,
    shipping_amount: 0,
    grand_total: 1680000,
    paid_amount: 0,
    packing_status: 'not_started',
    order_items: [
      makeOrderLine(demoProducts[19], 10, 1),
      makeOrderLine(demoProducts[30], 5, 2),
      makeOrderLine(demoProducts[39], 2, 3),
    ],
    order_history: [],
  },
  {
    id: 'ord-demo-003',
    order_code: 'DH2611-003',
    customer_id: 'demo-cust-003',
    customer_name: 'Phạm Văn Đức',
    customer_company: 'Trường Quốc Tế Horizon',
    customer_phone: '0933556677',
    customer_tier: 'VIP3',
    delivery_address: '18 Thảo Điền, TP. Thủ Đức',
    delivery_name: 'Bếp Trường Horizon',
    delivery_phone: '0933556677',
    delivery_date: localDateOffset(1),
    status: 'preparing',
    payment_status: 'paid',
    payment_method: 'CREDIT',
    pricing_status: 'finalized',
    source: 'website',
    sales_rep_name: 'Lê Quốc Bảo',
    created_at: new Date(Date.now() - 10 * 3600_000).toISOString(),
    confirmed_at: new Date(Date.now() - 9 * 3600_000).toISOString(),
    subtotal: 4320000,
    discount_amount: 120000,
    shipping_amount: 0,
    grand_total: 4200000,
    paid_amount: 4200000,
    packing_status: 'in_progress',
    packed_by: 'staff-kho-01',
    packed_by_name: 'Võ Văn Thành',
    order_items: [
      makeOrderLine(demoProducts[17], 8, 1),
      makeOrderLine(demoProducts[2], 15, 2),
      makeOrderLine(demoProducts[45], 20, 3),
      makeOrderLine(demoProducts[47], 4, 4),
    ],
    order_history: [],
  },
  {
    id: 'ord-demo-004',
    order_code: 'DH2611-004',
    customer_id: 'demo-cust-004',
    customer_name: 'Hoàng Minh Tuấn',
    customer_company: 'Suất Ăn Công Nghiệp KCN Tân Bình',
    customer_phone: '0977889900',
    customer_tier: 'VIP3',
    delivery_address: 'Lô IV-3 KCN Tân Bình, TP.HCM',
    delivery_name: 'Kho Bếp KCN',
    delivery_phone: '0977889900',
    delivery_date: localDateOffset(0),
    status: 'shipping',
    payment_status: 'pending',
    payment_method: 'CREDIT',
    pricing_status: 'finalized',
    source: 'admin',
    sales_rep_name: 'Lê Quốc Bảo',
    assigned_driver: 'Xe tải 51C-882.19',
    created_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
    confirmed_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
    subtotal: 6850000,
    discount_amount: 0,
    shipping_amount: 0,
    grand_total: 6850000,
    paid_amount: 0,
    packing_status: 'done',
    packed_by: 'staff-kho-01',
    packed_by_name: 'Võ Văn Thành',
    order_items: [
      makeOrderLine(demoProducts[28], 4, 1),
      makeOrderLine(demoProducts[26], 30, 2),
      makeOrderLine(demoProducts[11], 12, 3),
    ],
    order_history: [],
  },
  {
    id: 'ord-demo-005',
    order_code: 'DH2611-005',
    customer_id: 'demo-cust-001',
    customer_name: 'Nguyễn Văn An',
    customer_company: 'Bếp Trung Tâm Á Âu',
    customer_phone: '0909123456',
    customer_tier: 'VIP2',
    delivery_address: '125 Lê Lợi, Q.1, TP.HCM',
    delivery_name: 'Nguyễn Văn An',
    delivery_phone: '0909123456',
    delivery_date: localDateOffset(-1),
    status: 'completed',
    payment_status: 'paid',
    payment_method: 'CREDIT',
    pricing_status: 'finalized',
    source: 'website',
    sales_rep_name: 'Trần Thu Hà',
    created_at: new Date(Date.now() - 48 * 3600_000).toISOString(),
    confirmed_at: new Date(Date.now() - 46 * 3600_000).toISOString(),
    subtotal: 3150000,
    discount_amount: 0,
    shipping_amount: 0,
    grand_total: 3150000,
    paid_amount: 3150000,
    packing_status: 'done',
    order_items: [
      makeOrderLine(demoProducts[1], 12, 1),
      makeOrderLine(demoProducts[12], 8, 2),
      makeOrderLine(demoProducts[40], 4, 3),
    ],
    order_history: [],
  },
];

const demoPriceBooks = [
  { id: 'pb-general', code: 'BG-CHUNG', name: 'Bảng giá chuẩn TPS1 2026', kind: 'general', status: 'active', version: 3 },
  { id: 'pb-vip2', code: 'BG-VIP2', name: 'Bảng giá Bếp Trung Tâm (VIP2)', kind: 'group', status: 'active', version: 2 },
  { id: 'pb-school', code: 'BG-TRUONGHOC', name: 'Bảng giá Trường Học Q4/2026', kind: 'customer', status: 'active', version: 1 },
];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleSupabaseRest(urlObj: URL): Response | null {
  const path = urlObj.pathname;
  if (!path.startsWith('/rest/v1/')) return null;
  const table = path.replace('/rest/v1/', '').split('/')[0];
  if (table === 'admin_profiles') return jsonResponse(demoStaffList);
  if (table === 'customer_tiers') {
    return jsonResponse([
      { code: 'VIP0', name: 'Chuẩn', discount_percent: 0 },
      { code: 'VIP1', name: 'VIP 1 (-3%)', discount_percent: 3 },
      { code: 'VIP2', name: 'VIP 2 (-5%)', discount_percent: 5 },
      { code: 'VIP3', name: 'VIP 3 (-8%)', discount_percent: 8 },
      { code: 'CUSTOM', name: 'Hợp đồng riêng', discount_percent: 0 },
    ]);
  }
  if (table === 'customer_addresses') {
    return jsonResponse([
      { id: 'addr-001', customer_id: 'demo-cust-001', label: 'Bếp Trung Tâm Q1', address: '125 Lê Lợi, Q.1, TP.HCM', contact_name: 'Nguyễn Văn An', contact_phone: '0909123456', is_default: true },
      { id: 'addr-002', customer_id: 'demo-cust-001', label: 'Chi nhánh Thủ Đức', address: '88 Võ Văn Ngân, TP. Thủ Đức', contact_name: 'Trần Thị Mai', contact_phone: '0918222333', is_default: false },
    ]);
  }
  if (table === 'customer_contract_prices') return jsonResponse([]);
  if (table === 'vip_accounts') {
    return jsonResponse(demoCustomers[0]);
  }
  if (table === 'products') return jsonResponse(demoProducts);
  if (table === 'orders') return jsonResponse(demoOrders);
  return jsonResponse([]);
}

async function handleApiMock(urlObj: URL, init?: RequestInit): Promise<Response | null> {
  const pathname = urlObj.pathname;
  const params = urlObj.searchParams;
  const method = (init?.method || 'GET').toUpperCase();
  let body: Record<string, any> = {};
  if (typeof init?.body === 'string') {
    try { body = JSON.parse(init.body); } catch {}
  }

  if (pathname === '/api/sale-auth' && method === 'POST') {
    return jsonResponse({
      ok: true,
      userType: 'staff',
      user: DEMO_STAFF_USER,
      accessToken: 'demo-staff-token',
      refreshToken: 'demo-refresh-token',
    });
  }

  if (pathname === '/api/admin/dashboard') {
    const dailyTrend = Array.from({ length: 14 }, (_, idx) => {
      const date = localDateOffset(idx - 13);
      return {
        date,
        orders: 12 + ((idx * 3) % 11),
        revenue: (18 + ((idx * 5) % 16)) * 1_000_000,
      };
    });
    return jsonResponse({
      ok: true,
      generatedAt: new Date().toISOString(),
      scope: 'all',
      summary: {
        todayOrders: 16,
        monthOrders: 342,
        monthRevenue: 584_600_000,
        previousMonthRevenue: 512_300_000,
        revenueGrowth: 14.1,
        debtOutstanding: 94_500_000,
        activeCustomers: demoCustomers.length,
        pendingOrders: demoOrders.filter((o) => o.status === 'pending').length,
        inProgressOrders: demoOrders.filter((o) => ['confirmed', 'preparing', 'shipping'].includes(o.status)).length,
      },
      dailyTrend,
      byStatus: { pending: 4, confirmed: 8, preparing: 5, shipping: 6, completed: 42 },
      topCustomers: demoCustomers.slice(0, 5).map((c, idx) => ({
        name: c.name,
        company: c.company,
        orders: 28 - idx * 4,
        revenue: (120 - idx * 18) * 1_000_000,
      })),
      attentionOrders: demoOrders.slice(0, 4).map((o) => ({
        id: o.id,
        order_code: o.order_code,
        status: o.status,
        customer_name: o.customer_name,
        customer_company: o.customer_company,
        grand_total: o.grand_total,
        delivery_date: o.delivery_date,
        overdue: o.status === 'pending',
      })),
      recentOrders: demoOrders,
    });
  }

  if (pathname === '/api/admin/products') {
    if (params.get('meta') === '1') {
      const categories = [...new Set(demoProducts.map((p) => p.category))];
      return jsonResponse({ ok: true, categories });
    }
    const productId = params.get('productId');
    if (productId) {
      const found = demoProducts.find((p) => p.id === productId);
      if (!found) return jsonResponse({ ok: false, error: 'Không tìm thấy sản phẩm' }, 404);
      return jsonResponse({ ok: true, product: found, canEdit: true, inventoryHistory: [] });
    }
    if (method === 'POST' || method === 'PATCH') {
      return jsonResponse({ ok: true, product: { ...demoProducts[0], ...body } });
    }
    const q = (params.get('search') || '').trim().toLowerCase();
    const cat = params.get('category') || '';
    const lowStock = params.get('lowStockOnly') === '1';
    const page = Math.max(0, Number(params.get('page') || 0));
    const pageSize = Number(params.get('limit') || 40);
    const filtered = demoProducts.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (lowStock && !p.is_low_stock) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
    return jsonResponse({
      ok: true,
      total: filtered.length,
      count: filtered.length,
      products: filtered.slice(page * pageSize, (page + 1) * pageSize),
    });
  }

  if (pathname === '/api/admin/products/resolve-cart' && method === 'POST') {
    const items = Array.isArray(body.items) ? body.items : [];
    const byId = new Map(demoProducts.map((p) => [p.id, p]));
    return jsonResponse({
      ok: true,
      items: items.map((it: any) => {
        const prod = byId.get(it.productId);
        return { productId: it.productId, ok: Boolean(prod), price: prod?.price_retail || 0 };
      }),
    });
  }

  if (pathname === '/api/admin/orders/stats') {
    return jsonResponse({
      ok: true,
      stats: {
        pending: demoOrders.filter((o) => o.status === 'pending').length,
        preparing: demoOrders.filter((o) => o.status === 'preparing').length,
        shipping: demoOrders.filter((o) => o.status === 'shipping').length,
      },
    });
  }

  if (pathname === '/api/admin/order-change-requests') {
    return jsonResponse({ ok: true, requests: [] });
  }

  if (pathname === '/api/admin/orders/packing') {
    return jsonResponse({
      ok: true,
      orders: demoOrders
        .filter((o) => ['confirmed', 'preparing', 'shipping'].includes(o.status))
        .map((o) => ({
          id: o.id,
          order_code: o.order_code,
          customer_name: o.customer_name,
          customer_company: o.customer_company,
          status: o.status,
          confirmed_at: o.confirmed_at || o.created_at,
          item_count: o.order_items?.length || 0,
          packing_status: o.packing_status || 'not_started',
          packed_by: o.packed_by || null,
          packed_by_name: o.packed_by_name || null,
          delivery_date: o.delivery_date,
          is_overdue: false,
        })),
    });
  }

  if (pathname === '/api/admin/orders/bulk-price') {
    if (method === 'POST') {
      const target = demoProducts.find((p) => p.id === body.productId);
      if (target) target.price_retail = Number(body.price) || 0;
      return jsonResponse({ ok: true, affectedLines: 3, affectedOrders: 2 });
    }
    return jsonResponse({
      ok: true,
      products: demoProducts
        .filter((p) => p.price_on_request || p.price_retail === 0)
        .map((p) => ({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          orderCount: 2,
          lineCount: 3,
          hasZeroPrice: p.price_retail === 0,
          currentPrice: p.price_retail,
        })),
      orders: demoOrders.slice(0, 3).map((o) => ({
        id: o.id,
        orderCode: o.order_code,
        customerName: o.customer_company || o.customer_name,
        itemCount: o.order_items?.length || 0,
        hasZeroPrice: o.order_items?.some((it: any) => !it.unit_price),
        total: o.grand_total,
      })),
    });
  }

  if (pathname === '/api/admin/orders/bulk-finalize' && method === 'POST') {
    return jsonResponse({ ok: true, confirmedCount: Array.isArray(body.orderIds) ? body.orderIds.length : 1 });
  }

  if (pathname === '/api/admin/orders') {
    if (method === 'POST') {
      const id = `ord-demo-${Date.now()}`;
      const code = `DH2611-${String(demoOrders.length + 1).padStart(3, '0')}`;
      const newOrder = {
        id,
        order_code: code,
        ...body,
        status: body.status || 'confirmed',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        grand_total: Number(body.grandTotal || body.grand_total || 0),
        order_items: body.items || [],
        order_history: [],
      };
      demoOrders.unshift(newOrder);
      return jsonResponse({ ok: true, order: newOrder, orderId: id, orderCode: code });
    }
    const status = params.get('status') || '';
    const q = (params.get('search') || '').trim().toLowerCase();
    const filtered = demoOrders.filter((o) => {
      if (status && o.status !== status) return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        (o.customer_company || '').toLowerCase().includes(q)
      );
    });
    return jsonResponse({ ok: true, orders: filtered, totalCount: filtered.length, count: filtered.length });
  }

  if (pathname.startsWith('/api/admin/orders/')) {
    const id = pathname.split('/').pop() || '';
    const found = demoOrders.find((o) => o.id === id) || demoOrders[0];
    if (method === 'PATCH' && found) {
      Object.assign(found, body);
      return jsonResponse({ ok: true, order: found });
    }
    return jsonResponse({ ok: true, order: found });
  }

  if (pathname === '/api/admin/customers/list' || pathname === '/api/admin/customers') {
    const q = (params.get('search') || '').trim().toLowerCase();
    const filtered = demoCustomers.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.partner_code.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });
    return jsonResponse({
      ok: true,
      customers: filtered,
      total: filtered.length,
      totalPages: 1,
      groups: ['Bếp trung tâm', 'Nhà hàng', 'Trường học', 'Suất ăn CN', 'Khách sạn'],
      stats: { total: demoCustomers.length, missingPhone: 0, missingAddress: 0, missingBoth: 0, complete: demoCustomers.length },
    });
  }

  if (pathname.startsWith('/api/admin/customers/')) {
    const id = pathname.split('/').pop() || '';
    const found = demoCustomers.find((c) => c.id === id) || demoCustomers[0];
    return jsonResponse({ ok: true, customer: found, addresses: [], orders: demoOrders.slice(0, 2) });
  }

  if (pathname === '/api/admin/procurement/summary') {
    const groupedMap = new Map<string, any[]>();
    demoProducts.slice(0, 18).forEach((p, idx) => {
      const qty = (idx % 5 + 1) * 5;
      const line = {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        totalQty: qty,
        orderedQty: qty,
        orderCount: 2,
        customerCount: 2,
        stockQty: p.stock_qty,
        shortfall: Math.max(0, qty - p.stock_qty),
        notes: idx % 3 === 0 ? [{ customer: 'Bếp Á Âu', note: 'Sơ chế sạch' }] : [],
        customerLines: [
          { orderCode: 'DH2611-002', customerName: 'Nhà Hàng Hương Việt', quantity: qty, orderedQuantity: qty, note: '' },
        ],
      };
      const arr = groupedMap.get(p.category) || [];
      arr.push(line);
      groupedMap.set(p.category, arr);
    });
    const groups = Array.from(groupedMap.entries()).map(([category, lines]) => ({
      category,
      itemCount: lines.length,
      totalQty: lines.reduce((s, l) => s + l.totalQty, 0),
      orderedQty: lines.reduce((s, l) => s + l.orderedQty, 0),
      lines,
    }));
    return jsonResponse({
      ok: true,
      groups,
      orders: demoOrders.map((o) => ({
        orderId: o.id,
        orderCode: o.order_code,
        customerName: o.customer_company || o.customer_name,
        customerCode: 'KH-BEP01',
        deliveryName: o.delivery_name,
        deliveryPhone: o.delivery_phone,
        deliveryAddress: o.delivery_address,
        deliveryDate: o.delivery_date,
        status: o.status,
        isLate: false,
        lineCount: o.order_items?.length || 0,
        note: o.note || '',
      })),
      checksum: { orderCount: demoOrders.length, lineItemCount: 18, sumQtyByLines: 225, sumQtyByProducts: 225, isMatching: true },
      lastExportedAt: null,
      changedSinceLastExport: [],
    });
  }

  if (pathname === '/api/admin/price-books') {
    const page = Math.max(1, Number(params.get('page') || 1));
    const pageSize = Number(params.get('pageSize') || 20);
    const slice = demoProducts.slice((page - 1) * pageSize, page * pageSize);
    return jsonResponse({
      ok: true,
      priceBooks: demoPriceBooks,
      allPriceBooks: demoPriceBooks,
      displayedBooks: demoPriceBooks,
      totalProducts: demoProducts.length,
      totalPages: Math.ceil(demoProducts.length / pageSize),
      customerGroups: ['Bếp trung tâm', 'Nhà hàng', 'Trường học', 'Suất ăn CN'],
      customers: demoCustomers,
      products: slice.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        category: p.category,
        cost_price: p.cost_price,
        last_import_price: p.last_import_price,
        price_retail: p.price_retail,
        min_order_qty: p.min_order_qty,
        order_step: p.order_step,
        packaging_note: p.packaging_note,
        is_active: true,
        prices: {
          'pb-general': p.price_retail,
          'pb-vip2': p.price_wholesale,
          'pb-school': p.price_retail > 0 ? Math.round(p.price_retail * 0.92) : null,
        },
        priceDetails: {},
      })),
    });
  }

  if (pathname === '/api/admin/receivables/summary') {
    const customers = demoCustomers.slice(0, 4).map((c, idx) => {
      const overdue = idx === 1 ? 12_500_000 : 0;
      const notDue = 24_000_000 - idx * 3_000_000;
      return {
        customer: c,
        totalReceivables: overdue + notDue,
        openingDebt: 0,
        invoiceDebt: overdue + notDue,
        notDueDebt: notDue,
        overdueDebt: overdue,
        codUncollectedDebt: 0,
        customerAdvance: 0,
        openInvoiceCount: 3,
        codUncollectedCount: 0,
        overdueCount: overdue > 0 ? 1 : 0,
        creditLimit: c.credit_limit,
        remainingCreditLimit: Math.max(0, c.credit_limit - overdue - notDue),
        isOverLimit: false,
        creditUsagePercent: Math.round(((overdue + notDue) / c.credit_limit) * 100),
        oldestDueDate: localDateOffset(7 - idx * 10),
        aging: { notDue, days1_30: overdue, days31_60: 0, days61_90: 0, daysOver90: 0 },
        invoices: [],
      };
    });
    return jsonResponse({
      ok: true,
      summary: {
        totalReceivables: customers.reduce((s, c) => s + c.totalReceivables, 0),
        overdueDebt: 12_500_000,
        notDueDebt: 82_000_000,
        codUncollectedDebt: 0,
        customers,
      },
    });
  }

  if (pathname === '/api/admin/reports/summary') {
    return jsonResponse({
      ok: true,
      summary: {
        totalRevenue: 142_800_000,
        orderCount: 48,
        codCollected: 38_400_000,
        creditPending: 29_500_000,
      },
      rows: demoCustomers.slice(0, 5).map((c, idx) => ({
        label: c.company,
        orders: 14 - idx * 2,
        revenue: (42 - idx * 6) * 1_000_000,
      })),
    });
  }

  if (pathname === '/api/admin/order-cutoff') {
    return jsonResponse({
      ok: true,
      earliestDate: localDateOffset(1),
      deliveryDate: localDateOffset(1),
      cutoffTimeStr: '16:30',
      minutesLeft: 145,
      isLate: false,
    });
  }

  if (pathname === '/api/admin/users') {
    return jsonResponse({ ok: true, users: demoStaffList, departments: [] });
  }

  return null;
}

let installed = false;

export function installManageDemoFetch() {
  if (!IS_DEMO_MODE || installed || typeof window === 'undefined') return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const urlObj = new URL(rawUrl, window.location.origin);

      const supaRes = handleSupabaseRest(urlObj);
      if (supaRes) return supaRes;

      if (urlObj.pathname.startsWith('/api/')) {
        const apiRes = await handleApiMock(urlObj, init);
        if (apiRes) return apiRes;
        return jsonResponse({ ok: true });
      }
    } catch {
      // Fallback to native fetch if URL parsing fails
    }
    return nativeFetch(input, init);
  };
}
