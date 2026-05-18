import { useState } from 'react';
import { useMealsStore } from '../lib/meals-store';
import { UrlListInput } from './UrlListInput';
import type { Meal } from '../lib/types';

interface Props {
  tripId: string;
  meal?: Meal;
  onClose: () => void;
}

/**
 * ジャンルのプリセット(汎用設計)
 * - 「ソウルフード」= プロジェクトの旅先の現地料理を意味する
 * - 自由入力欄もあるので、ここにない料理も登録できる
 */
const GENRE_PRESETS = [
  'ソウルフード',
  '屋台・ローカル',
  '麺類',
  'ラーメン',
  'パスタ',
  '和食',
  '中華',
  '韓国料理',
  'イタリアン',
  'フレンチ',
  'アメリカン',
  'エスニック',
  'シーフード',
  '肉料理・BBQ',
  'ベジタリアン',
  'ファインダイニング',
  'ベーカリー・サンド',
  'カフェ・喫茶',
  'デザート・スイーツ',
  'バー・夜カフェ',
  'その他',
];

// Google マップの URL から座標を抽出
function extractCoordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

export function MealFormModal({ tripId, meal, onClose }: Props) {
  const isEdit = !!meal;
  const createMeal = useMealsStore((s) => s.createMeal);
  const updateMeal = useMealsStore((s) => s.updateMeal);
  const deleteMeal = useMealsStore((s) => s.deleteMeal);

  const [name, setName] = useState(meal?.name ?? '');
  const [nameLocal, setNameLocal] = useState(meal?.nameLocal ?? '');
  const [genre, setGenre] = useState(meal?.genre ?? '');
  const [status, setStatus] = useState<'draft' | 'confirmed'>(meal?.status ?? 'draft');
  const [scheduledAt, setScheduledAt] = useState(
    meal?.scheduledAt ? toLocalDateTime(meal.scheduledAt) : ''
  );
  const [memo, setMemo] = useState(meal?.memo ?? '');
  const [mapUrl, setMapUrl] = useState(meal?.mapUrl ?? '');
  const [lat, setLat] = useState<string>(meal?.lat != null ? String(meal.lat) : '');
  const [lng, setLng] = useState<string>(meal?.lng != null ? String(meal.lng) : '');
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [urls, setUrls] = useState<string[]>(meal?.urls ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('店名を入力してください');
    if (!genre.trim()) return setError('ジャンルを入力してください');

    setError(null);
    setIsSubmitting(true);
    try {
      const data = {
        tripId,
        name: name.trim(),
        nameLocal: nameLocal.trim(),
        genre: genre.trim(),
        status,
        scheduledAt: status === 'confirmed' && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
        memo: memo.trim() || undefined,
        mapUrl: mapUrl.trim() || undefined,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        urls: urls.length > 0 ? urls : undefined,
      };
      if (isEdit && meal) {
        await updateMeal(meal.id, data);
      } else {
        await createMeal(data);
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
    if (!meal) return;
    if (!confirm('この食事予定を削除しますか?')) return;
    setIsSubmitting(true);
    try {
      await deleteMeal(meal.id);
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
            {isEdit ? '— edit meal' : '— new meal'}
          </p>
          <h2 className="font-serif-ja text-2xl text-text tracking-[0.05em]">
            {isEdit ? '食事予定を編集' : '食事予定を追加'}
          </h2>
        </div>

        <div className="px-7 py-6 space-y-5">
          <Field label="RESTAURANT" labelJa="店名">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="例: フォー・バック・ハイ"
            />
          </Field>

          <Field label="LOCAL NAME" labelJa="現地語名" optional>
            <input
              type="text"
              value={nameLocal}
              onChange={(e) => setNameLocal(e.target.value)}
              className="form-input"
              placeholder="例: Phở Bắc Hải"
            />
          </Field>

          <Field label="GENRE" labelJa="ジャンル">
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {GENRE_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`py-2 px-2 border text-[10px] tracking-[0.05em] transition-colors font-serif-ja ${
                    genre === g
                      ? 'bg-accent text-bg border-accent'
                      : 'bg-transparent text-text-sub border-line hover:border-accent'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="form-input"
              placeholder="自由入力もできます"
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
              {status === 'draft' ? '候補:行きたい店リストに追加' : '確定:日時を指定してタイムラインへ'}
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

          <Field label="MAP URL" labelJa="地図リンク" optional>
            <input
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="form-input font-mono text-[11px]"
              placeholder="https://maps.google.com/..."
            />
          </Field>

          <Field label="COORDINATES" labelJa="位置情報(地図ピン用)" optional>
            <div className="border border-line bg-bg-alt/60 p-5 mb-3">
              <p className="font-serif italic text-[11px] tracking-[0.2em] text-gold mb-3">
                — how to set
              </p>
              <p className="font-serif-ja text-[12px] text-text leading-relaxed mb-4">
                かんたん 2 ステップで地図ピンを設定
              </p>

              <div className="mb-4">
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-accent mb-2">
                  — step 01
                </p>
                <p className="font-serif-ja text-[12px] text-text mb-2 leading-relaxed">
                  Google マップで <span className="font-serif italic">{name || '店名'}</span> を検索
                </p>
                
                  <a
                  href={name.trim() ? 'https://www.google.com/maps/search/' + encodeURIComponent(name.trim()) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (!name.trim()) e.preventDefault(); }}
                  className={'maps-search-link inline-block w-full text-center py-3 px-4 font-serif text-[11px] tracking-[0.3em] uppercase transition-colors ' + (name.trim() ? 'bg-text text-bg hover:bg-accent' : 'bg-bg-alt text-text-sub border border-line cursor-not-allowed opacity-60')}
                >
                  {name.trim() ? '🗺  Google マップで開く →' : '店名を入力してください'}
                </a>
              </div>

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
              </div>

              {coordsError && (
                <p className="font-serif-ja text-[11px] text-red-700/80 mt-3 leading-relaxed">{coordsError}</p>
              )}
            </div>

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

          <Field label="MEMO" labelJa="メモ" optional>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="form-input min-h-[80px] resize-none"
              placeholder="例: 朝6時から営業、行列必至"
            />
          </Field>

          <Field label="LINKS" labelJa="関連URL" optional>
            <UrlListInput value={urls} onChange={setUrls} />
            <p className="font-serif-ja text-[10px] text-text-sub/70 mt-2 italic">
              食べログ・Instagram・記事URLなど、複数登録できます
            </p>
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

/**
 * ISO文字列 → datetime-local input が要求する "YYYY-MM-DDTHH:mm" 形式へ
 * タイムゾーン考慮:input は端末ローカル時間で表示するため、ローカル変換する
 */
function toLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
