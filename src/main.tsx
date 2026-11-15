import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline PWA functionality
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available; refreshing to load latest catalog & books...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Harf is ready to work offline.');
  }
});

// Auto-reload on service worker controller change so updates apply seamlessly
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Actively check for service worker updates on boot and periodically
  navigator.serviceWorker.ready.then((reg) => {
    reg.update();
    setInterval(() => {
      reg.update();
    }, 60 * 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
