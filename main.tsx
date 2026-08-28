import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { MarketStateProvider } from './contexts/MarketStateContext';
import { DataIntegrityProvider } from './contexts/DataIntegrityContext';
import { Toaster } from 'sonner';

// WebSocket connection cleanup and guard to prevent "failed to connect" errors on hot reloads
// This robustly catches Vite's HMR websocket connection exceptions and implements a silent drop
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The width(-1) and height(-1) of chart should be greater than 0')) {
    return;
  }
  originalWarn(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (
    reason && 
    (
       (typeof reason.message === 'string' && reason.message.includes('WebSocket')) ||
       (typeof reason === 'string' && reason.includes('WebSocket'))
    )
  ) {
    event.preventDefault(); // Suppress the unhandled rejection
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DataIntegrityProvider>
        <MarketStateProvider>
          <Toaster position="top-right" theme="dark" richColors />
          <App />
        </MarketStateProvider>
      </DataIntegrityProvider>
    </ErrorBoundary>
  </StrictMode>,
);
