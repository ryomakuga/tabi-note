import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { testLoadFFmpeg, testMakeVideo } from './movie/ffmpegTest'

// 動作確認用:Consoleから呼べる(あとで削除)
;(window as any).testFFmpeg = testLoadFFmpeg
;(window as any).testMakeVideo = testMakeVideo

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
