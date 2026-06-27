import { useState } from 'react';
import { useSpotsStore } from '../lib/spots-store';
import { UrlListInput } from './UrlListInput';
import type { Spot } from '../lib/types';

interface Props {
  tripId: string;
  spot?: Spot;
  onClose: () => void;
}

export function SpotFormModal({ tripId, spot, onClose }: Props) {
  const isEdit = !!spot;
  const createSpot = useSpotsStore((s) => s.createSpot);
  const updateSpot = useSpotsStore((s) => s.updateSpot);
  const deleteSpot = useSpotsStore((s) => s.deleteSpot);

  const [name, setName] = useState(spot?.name ?? '');
  const [nameLocal, setNameLocal] = useState(spot?.nameLocal ?? '');
  const [status, setStatus] = useState<'draft' | 'confirmed'>(spot?.status ?? 'draft');
  const [scheduledAt, setScheduledAt] = useState(
    spot?.scheduledAt ? toLocalDateTime(spot.scheduledAt) : ''
  );
  const [memo, setMemo] = useState(spot?.memo ?? '');
  const [urls, setUrls] = useState<string[]>(spot?.urls ?? []);
  const [lat, setLat] = useState<string>(spot?.lat != null ? String(spot.lat) : '');
  const [lng, setLng] = useState<string>(spot?.lng != null ? String(spot.lng) : '');
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('スポット名を入力してください');

    setError(null);
    setIsSubmitting(true);
    try {
      const latNum = lat.trim() ? parseFloat(lat.trim()) : undefined;
      const lngNum = lng.trim() ? parseFloat(lng.trim()) : undefined;
      if (latNum !== undefined && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
        setIsSubmitting(false);
        return setError('緯度は -90 〜 90 の数値で入力してください');
      }
      if (lngNum !== undefined && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
        setIsSubmitting(false);
        return setError('経度は -180 〜 180 の数値で入力してください');
      }
      const data = {
        tripId,
        name: name.trim(),
        nameLocal: nameLocal.trim(),
        status,
        scheduledAt: status === 'confirmed' && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
        memo: memo.trim() || undefined,
        urls: urls.length > 0 ? urls : undefined,
        lat: latNum,
        lng: lngNum,
      };
      if (isEdit && spot) {
        await updateSpot(spot.id, data);
      } else {
        await createSpot(data);
      }
      onClose();
    } catch (e) {
      console.error(e);
      setError('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!spot) return;
    if (!confirm('このスポットを削除しますか?')) return;
    setIsSubmitting(true);
    try {
      await deleteSpot(spot.id);
      onClose();
    } catch (e) {
      console.error(e);
      setError('削除に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-bg w-full max-w-md my-8 shadow-2xl">
        <div className="px-7 pt-9 pb-6 border-b border-line">
          <p className="font-serif italic text-[11px] tracking-[0.3em] uppercase text-accent mb-2">
            {isEdit ? '— edit place' : '— new place'}
          </p>
          <h2 className="font-serif-ja text-2xl text-text tracking-[0.05em]">
            {isEdit ? 'スポットを編集' : 'スポットを追加'}
          </h2>
        </div>

        <div className="px-7 py-6 space-y-5">
          <Field label="PLACE NAME" labelJa="スポット名">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="例: 五行山(マーブルマウンテン)"
            />
          </Field>

          <Field label="LOCAL NAME" labelJa="現地語名" optional>
            <input
              type="text"
              value={nameLocal}
              onChange={(e) => setNameLocal(e.target.value)}
              className="form-input"
              placeholder="例: Ngũ Hành Sơn"
            />
          </Field>

          <Field label="STATUS" labelJa="ステータス">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`py-3 px-4 border text-[10px] tracking-[0.35em] uppercase transition-colors ${
                  status === 'draft'
                    ? 'bg-text text-bg border-text'
                    : 'bg-transparent text-text-sub border-line hover:border-accent'
                }`}
              >
                候補
              </button>
              <button
                type="button"
                onClick={() => setStatus('confirmed')}
                className={`py-3 px-4 border text-[10px] tracking-[0.35em] uppercase transition-colors ${
                  status === 'confirmed'
                    ? 'bg-olive text-bg border-olive'
                    : 'bg-transparent text-text-sub border-line hover:border-olive'
                }`}
              >
                確定
              </button>
            </div>
            <p className="font-serif-ja text-[10px] text-text-sub/80 mt-2 italic">
              {status === 'draft' ? '候補:行きたいリストに追加' : '確定:日時を指定してタイムラインへ'}
            </p>
          </Field>
          {status === 'confirmed' && (
            <Field label="SCHEDULED" labelJa="日時" optional>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="form-input"
              />
              <p className="font-serif-ja text-[10px] text-text-sub/70 mt-1 italic">
                指定するとタイムラインに表示されます
              </p>
            </Field>
          )}

          <Field label="MEMO" labelJa="メモ" optional>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="form-input min-h-[80px] resize-none"
              placeholder="例: 早朝に行くと人が少ない"
            />
          </Field>

          <Field label="LINKS" labelJa="関連URL" optional>
            <UrlListInput value={urls} onChange={setUrls} />
            <p className="font-serif-ja text-[10px] text-text-sub/70 mt-2 italic">
              記事・Instagram・YouTubeなど、複数登録できます
            </p>
          </Field>

          <Field label="COORDINATES" labelJa="位置情報(地図ピン用)" optional>
            {/* ===== ガイド枠 ===== */}
            <div className="border border-line bg-bg-alt/60 p-5 mb-3">
              <p className="font-serif italic text-[11px] tracking-[0.2em] text-gold mb-3">
                — how to set
              </p>
              <p className="font-serif-ja text-[12px] text-text leading-relaxed mb-4">
                かんたん 2 ステップで地図ピンを設定
              </p>

              {/* STEP 1: Google マップで検索 */}
              <div className="mb-4">
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-accent mb-2">
                  — step 01
                </p>
                <p className="font-serif-ja text-[12px] text-text mb-2 leading-relaxed">
                  Google マップで <span className="font-serif italic">{name || 'スポット名'}</span> を検索
                </p>
                
                  <a
                  href={name.trim() ? 'https://www.google.com/maps/search/' + encodeURIComponent(name.trim()) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (!name.trim()) e.preventDefault(); }}
                  className={'maps-search-link inline-block w-full text-center py-3 px-4 font-serif text-[11px] tracking-[0.3em] uppercase transition-colors ' + (name.trim() ? 'bg-text text-bg hover:bg-accent' : 'bg-bg-alt text-text-sub border border-line cursor-not-allowed opacity-60')}
                >
                  {name.trim() ? '🗺  Google マップで開く →' : 'スポット名を入力してください'}
                </a>
              </div>

              {/* STEP 2: URL をコピーして貼り付け */}
              <div>
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-accent mb-2">
                  — step 02
                </p>
                <p className="font-serif-ja text-[12px] text-text mb-2 leading-relaxed">
                  地図ページの URL をコピーしてから、下のボタンをタップ
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setCoordsError(null);
                    try {
                      const text = await navigator.clipboard.readText();
                      const coords = extractCoordsFromMapsUrl(text);
                      if (coords) {
                        setLat(String(coords.lat));
                        setLng(String(coords.lng));
                      } else {
                        setCoordsError('クリップボードに Google マップの URL が見つかりません。地図ページの URL をコピーしてからもう一度お試しください。');
                      }
                    } catch {
                      setCoordsError('クリップボードの読み取りに失敗しました');
                    }
                  }}
                  className="w-full py-3 px-4 border-2 border-accent bg-bg text-text font-serif text-[11px] tracking-[0.3em] uppercase hover:bg-accent hover:text-bg transition-colors"
                >
                  📋  クリップボードから座標を取得
                </button>
                <input
                  type="text"
                  inputMode="url"
                  placeholder="うまくいかない時はURLをここに貼り付け"
                  onChange={(e) => {
                    const coords = extractCoordsFromMapsUrl(e.target.value);
                    if (coords) {
                      setLat(String(coords.lat));
                      setLng(String(coords.lng));
                      setCoordsError(null);
                    }
                  }}
                  className="form-input mt-2 text-[12px]"
                />
              </div>

              {coordsError && (
                <p className="font-serif-ja text-[11px] text-red-700/80 mt-3 leading-relaxed">{coordsError}</p>
              )}
            </div>

            {/* 取得済み座標の表示 / 手動入力 */}
            <p className="font-serif italic text-[10px] tracking-[0.15em] text-text-sub mb-2">
              — coordinates(or manual)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={lat}
                onChange={(e) => { setLat(e.target.value); setCoordsError(null); }}
                className="form-input"
                placeholder="緯度 (例: 16.0034)"
                inputMode="decimal"
              />
              <input
                type="text"
                value={lng}
                onChange={(e) => { setLng(e.target.value); setCoordsError(null); }}
                className="form-input"
                placeholder="経度 (例: 108.2622)"
                inputMode="decimal"
              />
            </div>
            {(lat || lng) && (
              <p className="font-serif italic text-[10px] tracking-[0.05em] text-olive mt-2">
                ✓ 座標が設定されています
              </p>
            )}
          </Field>

          {error && (
            <p className="font-serif-ja text-[12px] text-red-700/80 bg-red-50/50 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-7 py-5 border-t border-line flex items-center justify-between">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="font-serif italic text-[11px] tracking-[0.2em] text-text-sub hover:text-red-700 transition-colors"
              >
                — delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="font-serif text-[11px] tracking-[0.35em] uppercase text-text-sub hover:text-text"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-accent text-bg px-7 py-3 font-serif text-[11px] tracking-[0.35em] uppercase hover:bg-text transition-colors disabled:opacity-50"
            >
              {isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function extractCoordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  const m1 = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
  const m2 = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
  const m3 = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m3) return { lat: parseFloat(m3[1]), lng: parseFloat(m3[2]) };
  return null;
}

function Field({
  label,
  labelJa,
  optional,
  children,
}: {
  label: string;
  labelJa: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="font-sans text-[9px] tracking-[0.35em] uppercase text-accent">
          {label}
        </p>
        <p className="font-serif-ja text-[10px] text-text-sub">
          {labelJa}
          {optional && <span className="text-text-sub/60">(任意)</span>}
        </p>
      </div>
      {children}
    </div>
  );
}


function toLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
