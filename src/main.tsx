import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Captura o evento beforeinstallprompt ANTES do React montar
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__deferredInstallPrompt = e;
  console.log('[PWA] beforeinstallprompt capturado globalmente');
});

createRoot(document.getElementById("root")!).render(<App />);
