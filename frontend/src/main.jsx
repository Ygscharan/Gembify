import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Garante espaçamento seguro da barra de status no Android (inclusive em versões anteriores do APK)
if (typeof window !== 'undefined') {
  const isCapacitorNative = Boolean(window.Capacitor?.isNativePlatform?.());
  const hasNativeInsetHandling = /GembifyNativeSafe\/2/.test(navigator.userAgent || '');

  if (isCapacitorNative && !hasNativeInsetHandling) {
    document.documentElement.style.setProperty(
      '--app-safe-top',
      'max(env(safe-area-inset-top, 0px), 34px)'
    );
    document.documentElement.style.setProperty(
      '--app-safe-bottom',
      'max(env(safe-area-inset-bottom, 0px), 16px)'
    );
  }
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falha silenciosa se o navegador bloquear service workers
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
