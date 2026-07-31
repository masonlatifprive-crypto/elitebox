import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installErrorCapture } from '@/lib/errorlog'

installErrorCapture()

// No <StrictMode>: canvas effects must not double-run (react-dev.md).
createRoot(document.getElementById('root')!).render(<App />)
