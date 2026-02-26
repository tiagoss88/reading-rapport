import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (standalone) return;

    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    
    if (ios && !dismissed) {
      setIsVisible(true);
      return;
    }

    // Verificar se o evento já foi capturado globalmente (antes do React montar)
    const savedPrompt = (window as any).__deferredInstallPrompt;
    if (savedPrompt) {
      console.log('[PWA] Usando evento beforeinstallprompt capturado globalmente');
      setDeferredPrompt(savedPrompt as BeforeInstallPromptEvent);
      if (!dismissed) setIsVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt capturado no hook');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).__deferredInstallPrompt = e;
      if (!dismissed) setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    console.log('[PWA] banner state:', { standalone, ios, dismissed, hasSavedPrompt: !!savedPrompt });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return { isVisible, isIOS, isStandalone, install, dismiss, canInstall: !!deferredPrompt };
}
