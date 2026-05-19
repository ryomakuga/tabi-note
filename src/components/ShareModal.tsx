// ============================================
// Tabi Note - 共有モーダル(F-12)
// 旅行データを共有用 URL + QR コードに変換
// 要件定義書 3.13:共同編集・データ共有
// ============================================

import { useState } from 'react';
import QRCode from 'qrcode';
import { generateShareUrl } from '../lib/data-export';

interface ShareModalProps {
  tripId: string;
  tripTitle: string;
  onClose: () => void;
}

type Stage = 'pin' | 'result';

export function ShareModal({ tripId, tripTitle, onClose }: ShareModalProps) {
  const [stage, setStage] = useState<Stage>('pin');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError('');
    if (!/^\d{4}$/.test(pin1)) {
      setError('共有用PINは4桁の数字で設定してください。');
      return;
    }
    if (pin1 !== pin2) {
      setError('2回目のPINが一致しません。');
      return;
    }

    setBusy(true);
    try {
      const { url } = await generateShareUrl(tripId, pin1);
      setShareUrl(url);
      const qr = await QRCode.toDataURL(url, {
        margin: 2,
        width: 280,
        color: { dark: '#3A2F1F', light: '#ECE5D8' },
      });
      setQrDataUrl(qr);
      setStage('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : '共有URLの生成に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('コピーに失敗しました。手動でURLを選択してください。');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg border border-line max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-7 pt-8 pb-5 border-b border-line text-center">
          <div className="font-serif italic text-gold text-xs tracking-[0.3em] mb-3">
            — share this journey —
          </div>
          <h2 className="font-serif text-text text-3xl font-light tracking-wide">
            Share
          </h2>
          <p className="font-serif-ja text-text text-sm mt-2 tracking-wider">
            旅を同行者に共有する
          </p>
          <p className="font-serif-ja text-text-sub text-xs mt-3 tracking-wider">
            {tripTitle}
          </p>
        </div>

        {/* 本体 */}
        <div className="px-7 py-7">
          {stage === 'pin' && (
            <>
              <p className="font-serif-ja text-text text-sm leading-relaxed mb-6 tracking-wider">
                共有用の4桁PINを設定してください。<br />
                同行者にはURLとPINを別々の手段で送ります。
              </p>

              <div className="space-y-5">
                <div>
                  <label className="font-sans text-xs tracking-[0.3em] text-accent uppercase block mb-2">
                    Share PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin1}
                    onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-bg-alt border border-line px-4 py-3 font-serif text-2xl text-center tracking-[0.5em] text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-[0.3em] text-accent uppercase block mb-2">
                    Confirm
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-bg-alt border border-line px-4 py-3 font-serif text-2xl text-center tracking-[0.5em] text-text focus:outline-none focus:border-accent"
                  />
                </div>

                {error && (
                  <div className="font-serif-ja text-sm text-olive bg-bg-alt border border-line p-3">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-7 space-y-3">
                <button
                  onClick={handleGenerate}
                  disabled={busy || !pin1 || !pin2}
                  className="w-full py-3 bg-text text-bg font-serif text-xs tracking-[0.45em] uppercase disabled:opacity-40 hover:bg-accent transition-colors"
                >
                  {busy ? '— generating —' : '— Generate —'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 border border-line font-serif text-xs tracking-[0.45em] uppercase text-text-sub hover:text-text"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {stage === 'result' && (
            <>
              <p className="font-serif-ja text-text text-sm leading-relaxed mb-5 tracking-wider">
                共有URLとQRコードを生成しました。<br />
                <span className="text-text-sub text-xs">
                  PINは別の手段(LINEなど)で送ってください。
                </span>
              </p>

              {/* QRコード */}
              {qrDataUrl && (
                <div className="flex justify-center mb-6">
                  <img
                    src={qrDataUrl}
                    alt="共有用QRコード"
                    className="border border-line"
                  />
                </div>
              )}

              {/* URL 表示 */}
              <div className="mb-4">
                <label className="font-sans text-xs tracking-[0.3em] text-accent uppercase block mb-2">
                  Share URL
                </label>
                <div className="bg-bg-alt border border-line p-3 max-h-24 overflow-y-auto break-all font-mono text-xs text-text">
                  {shareUrl}
                </div>
              </div>

              {/* コピーボタン */}
              <button
                onClick={handleCopy}
                className="w-full py-3 border border-accent text-text font-serif text-xs tracking-[0.45em] uppercase hover:bg-accent hover:text-bg transition-colors mb-3"
              >
                {copied ? '— Copied! —' : '— Copy URL —'}
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 bg-text text-bg font-serif text-xs tracking-[0.45em] uppercase hover:bg-accent transition-colors"
              >
                — Done —
              </button>

              {error && (
                <div className="font-serif-ja text-sm text-olive bg-bg-alt border border-line p-3 mt-4">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター装飾 */}
        <div className="px-7 pb-6 pt-2 text-center">
          <p className="font-serif italic text-text-sub text-xs tracking-widest">
            · · ·
          </p>
        </div>
      </div>
    </div>
  );
}
