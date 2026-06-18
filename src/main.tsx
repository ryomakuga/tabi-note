import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'

// 開発時のみ:過去に登録された古いService Workerとキャッシュを破棄する。
// IndexedDB(写真・動画データ)には一切触れない。
if (import.meta.env.DEV) {
  void (async function killOldServiceWorker() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const r of regs) { try { await r.unregister() } catch {} }
      }
      if ("caches" in window) {
        const names = await caches.keys()
        for (const n of names) { try { await caches.delete(n) } catch {} }
      }
    } catch {}
  })()
}
import { testLoadFFmpeg, testMakeVideo, makeSlideshowFromBlobs, makeSlideshowWithMusic, downloadVideo } from './movie/ffmpegTest'

;(window as any).testFFmpeg = testLoadFFmpeg
;(window as any).testMakeVideo = testMakeVideo
;(window as any).makeSlideshow = makeSlideshowFromBlobs
;(window as any).makeSlideshowWithMusic = makeSlideshowWithMusic
;(window as any).downloadVideo = downloadVideo

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
