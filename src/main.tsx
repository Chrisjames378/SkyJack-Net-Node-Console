import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error and unhandled rejection interceptor to block third-party extension/environment noise
if (typeof window !== 'undefined') {
  const suppressPatterns = ["emit", "addListener", "reading 'emit'", "reading 'addListener'"];
  
  const shouldSuppress = (errorMsg: string) => {
    if (!errorMsg) return false;
    return suppressPatterns.some(pattern => errorMsg.toLowerCase().includes(pattern.toLowerCase()));
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = typeof reason === 'object' ? (reason.message || reason.stack || '') : String(reason);
      if (shouldSuppress(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("Suppressed third-party browser/extension unhandled rejection:", msg);
      }
    }
  }, true);

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (shouldSuppress(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn("Suppressed third-party browser/extension error:", msg);
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

