import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Bắt sự kiện cài app (beforeinstallprompt) càng sớm càng tốt.
import './lib/installPrompt'

// Có bản app mới: service worker mới tự kích hoạt (skipWaiting + clients.claim
// trong sw.ts) rồi tiếp quản trang. Tải lại đúng một lần để khách dùng ngay bản
// mới, không bị kẹt ở giao diện cũ đã lưu sẵn trong bộ nhớ đệm.
if ('serviceWorker' in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => void reg.update());
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
