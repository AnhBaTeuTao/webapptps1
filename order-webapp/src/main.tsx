import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Có bản app mới: service worker mới tự kích hoạt (skipWaiting + clients.claim
// trong sw.ts) rồi tiếp quản trang. Tải lại đúng một lần để khách dùng ngay bản
// mới, không bị kẹt ở giao diện cũ đã lưu sẵn trong bộ nhớ đệm.
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
