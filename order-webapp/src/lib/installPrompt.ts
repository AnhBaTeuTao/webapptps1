import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Mời khách cài web app (PWA).
 *
 * Chrome/Edge/Android bắn sự kiện `beforeinstallprompt` rất sớm, nên phải bắt
 * ngay khi tải file này (import từ main.tsx), trước khi React dựng xong. Giữ
 * lại sự kiện để nút "Cài ứng dụng" gọi `prompt()` lúc khách bấm.
 * iPhone/iPad (Safari) không có sự kiện này → hiện hướng dẫn "Thêm vào MH chính".
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // tự hiện thanh mời của mình thay cho thông báo mặc định
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

const DISMISS_KEY = 'tps1_install_dismissed_at';
const DISMISS_DAYS = 7;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const [, force] = useState(0);
  const [dismissed, setDismissed] = useState(recentlyDismissed);

  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const native = Capacitor.isNativePlatform();
  const standalone = isStandalone();
  const ios = isIos();
  // Có thể cài: trình duyệt đã cho phép (Android/Chrome/Edge) hoặc là iPhone Safari.
  const canInstall = !native && !standalone && !installed && (Boolean(deferred) || ios);

  const install = async (): Promise<'accepted' | 'dismissed' | 'ios'> => {
    if (!deferred) return 'ios';
    const event = deferred;
    deferred = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    notify();
    return outcome;
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* bỏ qua */ }
    setDismissed(true);
  };

  return { canInstall, showBanner: canInstall && !dismissed, ios: ios && !deferred, install, dismiss };
}
