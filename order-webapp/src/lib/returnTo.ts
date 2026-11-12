/** Đường dẫn quay lại sau khi đăng nhập/đăng ký (?quay-lai=). Chỉ nhận đường dẫn nội bộ. */
export function safeReturnTo(value: string | null | undefined, fallback = '/') {
  const path = String(value || '').trim();
  // Chặn đường dẫn ra ngoài: "//evil.com" hoặc "/\evil.com" trình duyệt hiểu là host khác.
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
  if (path.startsWith('/dang-nhap') || path.startsWith('/dang-ky')) return fallback;
  return path;
}

export function withReturnTo(base: string, returnTo: string) {
  return returnTo && returnTo !== '/' ? `${base}?quay-lai=${encodeURIComponent(returnTo)}` : base;
}
