// ============================================
// Tabi Note - 受信モーダル(F-12)
// 共有URLから旅データを復号 → 自分のデバイスにインポート
// ============================================

import { useEffect, useState } from 'react';
import {
  decryptShareData,
  extractSharePayloadFromUrl,
  importShareData,
} from '../lib/data-export';
import type { ShareData, ShareImportResult } from '../lib/data-export';
import { useTripsStore } from '../lib/trips-store';

interface ReceiveModalProps {
  initialUrl?: string;
  onClose: () => void;
}

type Stage = 'input' | 'preview' | 'done';

export function ReceiveModal({ initialUrl, onClose }: ReceiveModalProps) {
  const [stage, setStage] = useState<Stage>('input');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ShareData | null>(null);
  const [result, setResult] = useState<ShareImportResult | null>(null);
  const loadTrips = useTripsStore((s) => s.loadTrips);

  // 初期 URL があれば自動で payload 抽出
  useEffect(() => {
    if (initialUrl) {
      const payload = extractSharePayloadFromUrl(initialUrl);
      if (payload) {
        setUrl(initialUrl);
      }
    }
  }, [initialUrl]);

  const handleDecrypt = async () => {
    setError('');
    if (!url.trim()) {
      setError('共有URLを貼り付けてください。');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('共有用PINは4桁の数字です。');
      return;
    }
    const payload = extractSharePayloadFromUrl(url.trim());
    if (!payload) {
      setError('共有URLの形式が正しくありません(#share= が見つかりません)。');
      return;
    }
    setBusy(true);
    try {
      const data = await decryptShareData(payload, pin);
      setPreview(data);
      setStage('preview');
    } catch (e) {
      setError('復号に失敗しました。PINかURLが正しくない可能性があります。');
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setBusy(true);
    setError('');
    try {
      const r = await importShareData(preview);
      setResult(r);
      await loadTrips();
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'インポートに失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-bg border border-line max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-7 pt-8 pb-5 border-b border-line text-center">
          <div className="font-serif italic text-gold text-xs tracking-[0.3em] mb-3">— receive a journey —</div>
          <h2 className="font-serif text-text text-3xl font-light tracking-wide">Receive</h2>
          <p className="font-serif-ja text-text text-sm mt-2 tracking-wider">同行者から旅を受け取る</p>
        </div>

        <div className="px-7 py-7">
          {stage === 'input' && (
            <>
              <p className="font-serif-ja text-text text-sm leading-relaxed mb-6 tracking-wider">
                受け取ったURLと共有用PINを入力してください。
              </p>
              <div className="space-y-5">
                <div>
                  <label className="font-sans text-xs tracking-[0.3em] text-accent uppercase block mb-2">Share URL</label>
                  <textarea
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    rows={4}
                    placeholder="http://..."
                    className="w-full bg-bg-alt border border-line px-3 py-2 font-mono text-xs text-text break-all focus:outline-none focus:border-accent resize-none"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.3em] text-accent uppercase block mb-2">Share PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-bg-alt border border-line px-4 py-3 font-serif text-2xl text-center tracking-[0.5em] text-text focus:outline-none focus:border-accent"
                  />
                </div>
                {error && (<div className="font-serif-ja text-sm text-olive bg-bg-alt border border-line p-3">{error}</div>)}
              </div>
              <div className="mt-7 space-y-3">
                <button onClick={handleDecrypt} disabled={busy || !url || !pin} className="w-full py-3 bg-text text-bg font-serif text-xs tracking-[0.45em] uppercase disabled:opacity-40 hover:bg-accent transition-colors">{busy ? '— decrypting —' : '— Decrypt —'}</button>
                <button onClick={onClose} className="w-full py-3 border border-line font-serif text-xs tracking-[0.45em] uppercase text-text-sub hover:text-text">Cancel</button>
              </div>
            </>
          )}

          {stage === 'preview' && preview && (
            <>
              <p className="font-serif-ja text-text text-sm leading-relaxed mb-5 tracking-wider">復号に成功しました。<br /><span className="text-text-sub text-xs">この旅をあなたのデバイスに追加します。</span></p>
              <div className="bg-bg-alt border border-line p-5 mb-6 space-y-2">
                <p className="font-serif italic text-xs tracking-[0.2em] text-gold">— preview</p>
                <p className="font-serif text-2xl text-text font-light">{preview.trip.destination}</p>
                <p className="font-serif-ja text-sm text-text">{preview.trip.title}</p>
                <p className="font-serif italic text-xs text-text-sub">{preview.trip.startDate} → {preview.trip.endDate}</p>
                <div className="pt-3 border-t border-line space-y-1 font-sans text-[10px] tracking-[0.25em] uppercase text-text-sub">
                  <p>Flights · <span className="font-serif italic text-text">{preview.flights.length}</span></p>
                  <p>Hotels · <span className="font-serif italic text-text">{preview.hotels.length}</span></p>
                  <p>Places · <span className="font-serif italic text-text">{preview.spots.length}</span></p>
                  <p>Meals · <span className="font-serif italic text-text">{preview.meals.length}</span></p>
                </div>
              </div>
              {error && (<div className="font-serif-ja text-sm text-olive bg-bg-alt border border-line p-3 mb-3">{error}</div>)}
              <div className="space-y-3">
                <button onClick={handleImport} disabled={busy} className="w-full py-3 bg-text text-bg font-serif text-xs tracking-[0.45em] uppercase disabled:opacity-40 hover:bg-accent transition-colors">{busy ? '— importing —' : '— Import —'}</button>
                <button onClick={() => setStage('input')} className="w-full py-3 border border-line font-serif text-xs tracking-[0.45em] uppercase text-text-sub hover:text-text">Back</button>
              </div>
            </>
          )}

          {stage === 'done' && result && (
            <>
              <div className="text-center mb-6">
                <p className="font-serif italic text-gold text-xl tracking-widest mb-3">— ◌ —</p>
                <p className="font-serif-ja text-text text-base tracking-wider">旅を受け取りました</p>
              </div>
              <div className="bg-bg-alt border border-line p-5 mb-6 text-center">
                <p className="font-serif text-2xl text-text font-light">{result.destination}</p>
                <p className="font-serif-ja text-sm text-text mt-1">{result.tripTitle}</p>
                <p className="font-serif italic text-xs text-text-sub mt-3">
                  flights {result.flightsCount} · hotels {result.hotelsCount} · places {result.spotsCount} · meals {result.mealsCount}
                </p>
              </div>
              <button onClick={onClose} className="w-full py-3 bg-text text-bg font-serif text-xs tracking-[0.45em] uppercase hover:bg-accent transition-colors">— Done —</button>
            </>
          )}
        </div>

        <div className="px-7 pb-6 pt-2 text-center"><p className="font-serif italic text-text-sub text-xs tracking-widest">· · ·</p></div>
      </div>
    </div>
  );
}
