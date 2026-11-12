import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from './apiBase';

// Khu "Cửa hàng online" — gọi các API /api/admin/store/* của web chính.

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  image_mobile_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface StoreCategory {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  product_categories: string[];
  sort_order: number;
  is_active: boolean;
}

export type CollectionSource = 'manual' | 'best_sellers' | 'new_arrivals';

export interface StoreCollection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: CollectionSource;
  max_items: number;
  sort_order: number;
  is_active: boolean;
  store_collection_items?: { count: number }[];
}

export interface CollectionItem {
  productId: string;
  sku: string | null;
  name: string;
  category: string | null;
  unit: string | null;
  imageUrl: string | null;
  visible: boolean;
}

export interface ContentProduct {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string | null;
  image_url: string | null;
  thumb_url: string | null;
  short_description: string | null;
  description: string | null;
  online_visible: boolean;
  online_sort: number | null;
}

export interface StoreSummary {
  onlineOrdersToday: number;
  onlineOrdersPending: number;
  customersPending: number;
  productsMissingImage: number;
  productsMissingDescription: number;
  productsHidden: number;
  activeBanners: number;
  activeCollections: number;
}

export interface SignupCustomer {
  id: string;
  partner_code: string | null;
  name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_note: string | null;
  registration_source: string | null;
  registered_at: string | null;
  created_at: string;
}

export const STORE_URL = 'https://dathang.thucphamsomot.vn';

/** Đổi tên hiển thị thành slug không dấu: "Rau củ quả" → "rau-cu-qua". */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function useStoreApi() {
  const { authFetch } = useAuth();

  const call = useCallback(
    async <T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> => {
      const { json, ...rest } = init || {};
      const res = await authFetch(`${API_BASE}${path}`, {
        ...rest,
        headers: json !== undefined ? { 'Content-Type': 'application/json', ...(rest.headers || {}) } : rest.headers,
        body: json !== undefined ? JSON.stringify(json) : rest.body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Lỗi ${res.status}`);
      }
      return data as T;
    },
    [authFetch],
  );

  const upload = useCallback(
    async (file: File, kind: 'banner' | 'category'): Promise<string> => {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      const data = await call<{ url: string }>('/api/admin/store/upload', { method: 'POST', body: form });
      return data.url;
    },
    [call],
  );

  const uploadProductImage = useCallback(
    async (file: File, productId: string): Promise<string> => {
      const form = new FormData();
      form.append('file', file);
      form.append('productId', productId);
      const data = await call<{ imageUrl: string }>('/api/admin/products/upload-image', { method: 'POST', body: form });
      return data.imageUrl;
    },
    [call],
  );

  return { call, upload, uploadProductImage };
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại';
}
