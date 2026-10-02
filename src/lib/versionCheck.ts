declare const __APP_VERSION__: string;

const RELOAD_KEY = 'app-version-reload';
let avisoMostrado = false;

function reloadOnce(tag: string) {
  const last = sessionStorage.getItem(RELOAD_KEY);
  if (last === tag) return false;
  sessionStorage.setItem(RELOAD_KEY, tag);
  window.location.reload();
  return true;
}

function emFormulario() {
  const el = document.activeElement as HTMLElement | null;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return true;
  return !!document.querySelector('[role="dialog"]');
}

function mostrarAviso() {
  if (avisoMostrado) return;
  avisoMostrado = true;
  const bar = document.createElement('div');
  bar.setAttribute('style', 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1e3a5f;color:#fff;padding:10px 14px;border-radius:8px;font:14px sans-serif;display:flex;gap:12px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.25)');
  bar.innerHTML = '<span>Nova versão disponível</span>';
  const btn = document.createElement('button');
  btn.textContent = 'Atualizar';
  btn.setAttribute('style', 'background:#22d3ee;color:#0b1b2e;border:0;border-radius:6px;padding:4px 10px;font-weight:600;cursor:pointer');
  btn.onclick = () => window.location.reload();
  bar.appendChild(btn);
  document.body.appendChild(bar);
}

async function checar() {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return;
    const { version } = await r.json();
    if (!version || version === __APP_VERSION__) return;
    if (emFormulario()) mostrarAviso();
    else if (!reloadOnce(version)) mostrarAviso();
  } catch { /* sem rede: ignora */ }
}

export function instalarVerificacaoDeVersao() {
  // Tela quebrada por arquivo antigo após publicação → recarrega uma vez
  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault();
    reloadOnce('preload-' + __APP_VERSION__);
  });
  if (import.meta.env.DEV) return;
  checar();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checar(); });
  window.addEventListener('focus', checar);
  setInterval(checar, 5 * 60 * 1000);
}

export function isChunkLoadError(err: unknown) {
  const msg = String((err as any)?.message || err || '');
  return /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(msg);
}

export function recarregarPorChunk() {
  return reloadOnce('chunk-' + __APP_VERSION__);
}
