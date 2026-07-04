// Guarded Service Worker registration for the app shell.
// Registers /sw.js ONLY in production and outside Lovable preview/editor contexts.
// In refused contexts, unregisters any existing /sw.js registration and clears
// its Workbox caches so returning visitors always see the latest build.

const APP_SW_URL = '/sw.js';

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

async function cleanupAppSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        const scriptURL =
          reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
        if (scriptURL.endsWith(APP_SW_URL)) {
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

  if ('caches' in window) {
    try {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => /workbox|precache|runtime|html-navigations/i.test(n))
          .map((n) => caches.delete(n).catch(() => false)),
      );
    } catch {
      /* noop */
    }
  }
}

export async function registerAppSW(): Promise<void> {
  if (isRefusedContext()) {
    await cleanupAppSW();
    return;
  }
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register(APP_SW_URL, { scope: '/' });
  } catch (err) {
    console.warn('[PWA] Falha ao registrar service worker:', err);
  }
}
