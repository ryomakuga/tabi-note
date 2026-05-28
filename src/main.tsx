import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { testLoadFFmpeg } from './movie/ffmpegTest'

// 動作確認用:ブラウザのConsoleから window.testFFmpeg() で呼べる(あとで削除)
;(window as any).testFFmpeg = testLoadFFmpeg

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
