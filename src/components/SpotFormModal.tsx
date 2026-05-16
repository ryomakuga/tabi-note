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
  const [memo, setMemo] = useState(spot?.memo ?? '');
  const [urls, setUrls] = useState<string[]>(spot?.urls ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('スポット名を入力してください');

    setError(null);
    setIsSubmitting(true);
    try {
      const data = {
        tripId,
        name: name.trim(),
        nameLocal: nameLocal.trim(),
        status,
        memo: memo.trim() || undefined,
        urls: urls.length > 0 ? urls : undefined,
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
              {status === 'draft' ? '候補:行きたいリストに追加' : '確定:訪問予定として記録'}
            </p>
          </Field>

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
