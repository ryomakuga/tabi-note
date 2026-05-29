import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { testLoadFFmpeg, testMakeVideo, makeSlideshowFromBlobs } from './movie/ffmpegTest'

;(window as any).testFFmpeg = testLoadFFmpeg
;(window as any).testMakeVideo = testMakeVideo
;(window as any).makeSlideshow = makeSlideshowFromBlobs

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
