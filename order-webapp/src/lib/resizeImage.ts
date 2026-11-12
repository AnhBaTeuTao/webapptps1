/**
 * Thu nhỏ ảnh ngay trên máy trước khi tải lên.
 *
 * Ảnh chụp điện thoại thường 3–8 MB, vượt giới hạn 2 MB của API ảnh đại diện
 * (và 4,5 MB của Vercel), nên tải thẳng sẽ bị từ chối. Vẽ lại lên canvas cạnh
 * dài tối đa `maxSide` px rồi xuất JPEG — ảnh đại diện chỉ cần 512 px.
 */
export async function resizeImageFile(file: File, maxSide = 1024, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    // imageOrientation: xoay đúng chiều ảnh chụp dọc từ điện thoại.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Không đọc được ảnh'));
      img.src = URL.createObjectURL(file);
    });
  }

  const width = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width;
  const height = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  // Ảnh đã nhỏ và đúng định dạng: giữ nguyên.
  if (scale === 1 && file.size <= 1_500_000 && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#fff'; // nền trắng cho ảnh PNG trong suốt khi đổi sang JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ('close' in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, '') || 'anh';
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
}
