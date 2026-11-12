import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, MapPin, Package, Share2, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { api, ApiError, type Product, type ProductDetailExtra } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStoreHome } from '../hooks/useStoreHome';
import { FavoriteButton, PriceTag, ProductImage, QuantityStepper, money } from '../components/store/StoreProductCard';
import ProductRail from '../components/store/ProductRail';

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { quantityOf, count } = useCart();
  const { t, productName, productUnit } = useLanguage();
  const { data: home } = useStoreHome();
  const [product, setProduct] = useState<Product | null>(null);
  const [detail, setDetail] = useState<ProductDetailExtra | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let alive = true;
    setState('loading');
    window.scrollTo({ top: 0 });
    api.productDetail(id)
      .then((res) => {
        if (!alive) return;
        const main = res.products?.[0];
        if (!main) { setState('missing'); return; }
        setProduct(main);
        setDetail(res.detail || null);
        setState('ready');
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) { logout(); return; }
        setState('error');
      });
    return () => { alive = false; };
  }, [id, logout]);

  const share = async () => {
    const url = `https://dathang.thucphamsomot.vn/san-pham/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: product?.name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); window.setTimeout(() => setShared(false), 2000); }
    } catch { /* khách huỷ chia sẻ */ }
  };

  if (state === 'loading') {
    return (
      <div className="grid gap-6 rounded-3xl bg-white p-4 ring-1 ring-[#17231d]/6 sm:p-6 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-[#eef2ee]" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[#eef2ee]" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-[#eef2ee]" />
          <div className="h-24 animate-pulse rounded-xl bg-[#eef2ee]" />
        </div>
      </div>
    );
  }

  if (state !== 'ready' || !product) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center ring-1 ring-[#17231d]/6">
        <Package size={40} className="mx-auto text-[#59665f]/40" />
        <p className="mt-3 font-bold text-[#17231d]">{state === 'missing' ? t('Mặt hàng này hiện không còn trên cửa hàng') : t('Không tải được sản phẩm')}</p>
        <Link to="/" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0f7a4f] px-5 text-sm font-bold text-white">{t('Về trang chủ')}</Link>
      </div>
    );
  }

  const name = productName(product.name);
  const storeCategory = home?.categories.find((c) => product.category && c.productCategories.includes(product.category));
  const inCart = quantityOf(product.id);
  const specs: Array<[string, string]> = [
    [t('Đơn vị tính'), productUnit(product.unit || 'Kg')],
    ...(product.packagingNote ? [[t('Quy cách'), product.packagingNote] as [string, string]] : []),
    ...(detail?.origin ? [[t('Xuất xứ'), detail.origin] as [string, string]] : []),
    ...(Number(product.minOrderQty) > 1 ? [[t('Đặt tối thiểu'), `${product.minOrderQty} ${productUnit(product.unit || 'Kg')}`] as [string, string]] : []),
    ...(product.sku ? [[t('Mã hàng'), product.sku] as [string, string]] : []),
  ];

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-[#59665f]" aria-label="breadcrumb">
        <Link to="/" className="hover:text-[#0f7a4f]">{t('Trang chủ')}</Link>
        <ChevronRight size={13} />
        {storeCategory ? <Link to={`/danh-muc/${storeCategory.slug}`} className="hover:text-[#0f7a4f]">{t(storeCategory.name)}</Link> : <Link to="/danh-muc" className="hover:text-[#0f7a4f]">{t('Danh mục')}</Link>}
        <ChevronRight size={13} />
        <span className="line-clamp-1 font-semibold text-[#17231d]">{name}</span>
      </nav>

      <section className="grid gap-5 rounded-3xl bg-white p-4 ring-1 ring-[#17231d]/6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
        <ProductImage product={{ ...product, imageUrl: detail?.imageUrlLarge || product.imageUrl, thumbUrl: detail?.imageUrlLarge || product.thumbUrl }} className="aspect-square w-full rounded-2xl" />

        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-black leading-snug text-[#17231d] sm:text-2xl">{name}</h1>
              <div className="flex shrink-0 items-center gap-2">
                <FavoriteButton productId={product.id} className="size-10" />
                <button type="button" onClick={share} aria-label={t('Chia sẻ')} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#17231d]/10 text-[#59665f] hover:bg-[#f5f7f3]">
                  <Share2 size={17} />
                </button>
              </div>
            </div>
            {name !== product.name && <p className="mt-1 text-sm text-[#59665f]">{product.name}</p>}
            {shared && <p className="mt-1 text-xs font-semibold text-[#0f7a4f]">{t('Đã sao chép đường dẫn')}</p>}
          </div>

          <div className="rounded-2xl bg-[#f5f8f4] p-4">
            <PriceTag product={product} large />
            {!session && (
              <p className="mt-2 text-xs text-[#59665f]">
                <Link to={`/dang-nhap?quay-lai=${encodeURIComponent(`/san-pham/${product.id}`)}`} className="font-bold text-[#0f7a4f] hover:underline">{t('Đăng nhập')}</Link>{' '}
                {t('để xem giá theo hợp đồng của quý khách.')}
              </p>
            )}
          </div>

          {product.shortDescription && <p className="text-[15px] leading-relaxed text-[#2c3a33]">{product.shortDescription}</p>}

          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-[#17231d]/8 ring-1 ring-[#17231d]/8 sm:grid-cols-2">
            {specs.map(([label, value]) => (
              <div key={label} className="bg-white px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9690]">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[#17231d]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="hidden max-w-sm gap-3 md:grid">
            <QuantityStepper product={product} size="lg" />
            {inCart > 0 && (
              <button type="button" onClick={() => navigate('/gio-hang')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#0f7a4f]/30 text-sm font-bold text-[#0f7a4f] hover:bg-[#eaf6ef]">
                <ShoppingCart size={17} /> {t('Xem giỏ hàng')} ({count})
              </button>
            )}
          </div>

          <ul className="grid gap-2 text-sm text-[#2c3a33]">
            <li className="flex items-center gap-2"><Truck size={17} className="text-[#0f7a4f]" /> {t('Vận chuyển tận nơi đúng tiêu chuẩn, sớm nhất từ 5 giờ sáng')}</li>
            <li className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#0f7a4f]" /> {t('Kiểm soát an toàn thực phẩm theo ISO 22000 và HACCP')}</li>
            <li className="flex items-center gap-2"><MapPin size={17} className="text-[#0f7a4f]" /> {t('Giao tại Đồng Nai, TP.HCM và các tỉnh lân cận')}</li>
          </ul>
        </div>
      </section>

      {detail?.description && (
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#17231d]/6 sm:p-6">
          <h2 className="mb-2 text-lg font-black text-[#17231d]">{t('Mô tả sản phẩm')}</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#2c3a33]">{detail.description}</p>
        </section>
      )}

      {detail && <ProductRail title="Có thể quý khách cũng cần" products={detail.related} moreTo={storeCategory ? `/danh-muc/${storeCategory.slug}` : undefined} />}

      {/* Thanh thêm vào giỏ dính đáy trên mobile, nằm trên thanh điều hướng. */}
      <div className="fixed inset-x-0 z-20 border-t border-[#17231d]/10 bg-white/95 px-3 py-2.5 backdrop-blur md:hidden" style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {product.priceOnRequest || !(product.price > 0)
              ? <p className="text-sm font-bold text-[#c4601f]">{t('Liên hệ báo giá')}</p>
              : <p className="truncate text-base font-black text-[#0b4f34]">{money(product.price)}<span className="text-xs font-semibold text-[#59665f]"> / {productUnit(product.unit || 'Kg')}</span></p>}
          </div>
          <div className="w-[52%]"><QuantityStepper product={product} /></div>
        </div>
      </div>
    </div>
  );
}
