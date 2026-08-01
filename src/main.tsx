import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from '@/i18n'
import { installErrorCapture } from '@/lib/errorlog'

installErrorCapture()

// No <StrictMode>: canvas effects must not double-run (react-dev.md).
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
)
