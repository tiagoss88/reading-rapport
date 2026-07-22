// Guarded Service Worker registration for the app shell.
// Registers /sw.js ONLY in production and outside Lovable preview/editor contexts.
// In refused contexts, unregisters any existing /sw.js registration, clears its
// caches and forces a one-time reload so the tab stops being served by the old SW.

const APP_SW_URL = '/sw.js';
const RELOAD_FLAG = '__lov_sw_reloaded';

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  const url = new URL(window.location.href);
  if (url.searchParams.get('sw') === 'off') return true;

  const host = window.location.hostname;
  if (host.startsWith('id-preview--') || host.startsWith('preview--')) return true;
  const suffixes = [
    'lovableproject.com',
    'lovableproject-dev.com',
    'beta.lovable.dev',
  ];
  for (const s of suffixes) {
    if (host === s || host.endsWith('.' + s)) return true;
  }
  return false;
}

function scriptURLOf(reg: ServiceWorkerRegistration): string {
  return (
    reg.active?.scriptURL ||
    reg.waiting?.scriptURL ||
    reg.installing?.scriptURL ||
    ''
  );
}

function isAppSWUrl(scriptURL: string): boolean {
  try {
    return new URL(scriptURL, window.location.origin).pathname === APP_SW_URL;
  } catch {
    return scriptURL.endsWith(APP_SW_URL);
  }
}

async function detectAndUnregisterAppSW(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  let hadAppSW = false;

  const controllerURL = navigator.serviceWorker.controller?.scriptURL || '';
  if (controllerURL && isAppSWUrl(controllerURL)) hadAppSW = true;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        const url = scriptURLOf(reg);
        if (url && isAppSWUrl(url)) {
          hadAppSW = true;
          try {
            await reg.unregister();
          } catch {
            /* noop */
          }
        }
      }),
    );
  } catch {
    /* noop */
  }
  return hadAppSW;
}

async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n).catch(() => false)));
  } catch {
    /* noop */
  }
}

export async function registerAppSW(): Promise<void> {
  if (isRefusedContext()) {
    const hadAppSW = await detectAndUnregisterAppSW();
    await clearAllCaches();
    if (hadAppSW) {
      try {
        if (sessionStorage.getItem(RELOAD_FLAG) !== '1') {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
        }
      } catch {
        /* noop */
      }
    }
    return;
  }
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register(APP_SW_URL, { scope: '/' });
  } catch (err) {
    console.warn('[PWA] Falha ao registrar service worker:', err);
  }
}
