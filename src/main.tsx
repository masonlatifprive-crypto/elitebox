import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from '@/i18n'
import { installErrorCapture } from '@/lib/errorlog'

installErrorCapture()

/** Chunk-load auto-recovery: the edge proxy intermittently 415s static assets (~1 in 4).
 *  First chunk-load failure per session forces one full reload (index.html is no-store,
 *  hashed assets immutable → a fresh request is a new edge fetch). If it fails again
 *  after that reload we never reload-loop — an honest fallback is rendered instead. */
const CHUNK_RECOVERY_KEY = 'elitebox.v1.chunk-recovery'
const CHUNK_FAIL_RE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError|Importing a module script failed/i

function renderChunkFallback(): void {
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'background:#030612;font-family:system-ui,sans-serif;text-align:center;padding:24px;">' +
    '<p style="max-width:32rem;font-size:16px;line-height:1.6;margin:0;color:#F2F5FF;">' +
    "Elitebox couldn't load completely — check your connection and refresh." +
    '<span style="display:block;margin-top:12px;color:#7CD9EC;font-size:13px;">Elitebox</span>' +
    '</p></div>'
}

function recoverChunkLoad(): void {
  try {
    if (sessionStorage.getItem(CHUNK_RECOVERY_KEY)) {
      renderChunkFallback() // already reloaded once — no loop
      return
    }
    sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
  } catch {
    /* storage blocked — still attempt the single reload */
  }
  location.reload()
}

function isAssetTarget(t: EventTarget | null): boolean {
  if (t instanceof HTMLScriptElement) return t.src.includes('/assets/')
  if (t instanceof HTMLLinkElement) return t.href.includes('/assets/')
  return false
}

function installChunkRecovery(): void {
  window.addEventListener('error', (ev) => {
    if (isAssetTarget(ev.target)) recoverChunkLoad()
  }, true)
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason as unknown
    const msg = reason instanceof Error ? reason.message : String(reason ?? '')
    if (CHUNK_FAIL_RE.test(msg)) recoverChunkLoad()
  })
}

installChunkRecovery()

// No <StrictMode>: canvas effects must not double-run (react-dev.md).
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
)
