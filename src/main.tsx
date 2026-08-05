import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { I18nProvider } from './i18n';
import { installErrorCapture } from './lib/errorlog';

installErrorCapture();

/** Chunk-load auto-recovery: the edge proxy intermittently 415s static assets (~1 in 4).
 * First chunk-load failure per session forces one full reload (index.html is no-store,
 * hashed assets immutable → a fresh request is a new edge fetch). If it fails again
 * after that reload we never reload-loop — an honest fallback is rendered instead. */
const CHUNK_RECOVERY_KEY = 'elitebox.v1.chunk-recovery';
const CHUNK_FAIL_RE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError|Importing a module script failed/i;

function renderChunkFallback(message?: string): void {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'background:#030612;font-family:system-ui,sans-serif;text-align:center;padding:24px;">' +
    '<div style="max-width:32rem;">' +
    '<p style="font-size:16px;line-height:1.6;margin:0;color:#F2F5FF;">' +
    (message || "Elitebox couldn't load completely — check your connection and refresh.") +
    '</p>' +
    '<span style="display:block;margin-top:12px;color:#7CD9EC;font-size:13px;opacity:0.8;">Elitebox Boot Isolation</span>' +
    '</div></div>';
}

function recoverChunkLoad(): void {
  try {
    if (sessionStorage.getItem(CHUNK_RECOVERY_KEY)) {
      renderChunkFallback();
      return;
    }
    sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');
    window.location.reload();
  } catch (e) {
    renderChunkFallback();
  }
}

window.addEventListener('error', (e) => {
  if (CHUNK_FAIL_RE.test(e.message)) {
    e.preventDefault();
    recoverChunkLoad();
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  if (CHUNK_FAIL_RE.test(String(e.reason))) {
    e.preventDefault();
    recoverChunkLoad();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );
  } catch (err) {
    console.error('Root mount error:', err);
    renderChunkFallback('App crashed during initialization. Please try clearing site data.');
  }
} else {
  console.error('Failed to find root element');
}
