import { useState } from 'react';
import { useHotelsStore } from '../lib/hotels-store';
import { UrlListInput } from './UrlListInput';
import type { Hotel } from '../lib/types';

interface Props {
  tripId: string;
  hotel?: Hotel;
  onClose: () => void;
}

export function HotelFormModal({ tripId, hotel, onClose }: Props) {
  const isEdit = !!hotel;
  const createHotel = useHotelsStore((s) => s.createHotel);
  const updateHotel = useHotelsStore((s) => s.updateHotel);
  const deleteHotel = useHotelsStore((s) => s.deleteHotel);

  const [name, setName] = useState(hotel?.name ?? '');
  const [address, setAddress] = useState(hotel?.address ?? '');
  const [addressLocal, setAddressLocal] = useState(hotel?.addressLocal ?? '');
  const [checkIn, setCheckIn] = useState(toDatetimeLocal(hotel?.checkIn));
  const [checkOut, setCheckOut] = useState(toDatetimeLocal(hotel?.checkOut));
  const [mapUrl, setMapUrl] = useState(hotel?.mapUrl ?? '');
  const [urls, setUrls] = useState<string[]>(hotel?.urls ?? []);
  const [phone, setPhone] = useState(hotel?.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('ホテル名を入力してください');
    if (!address.trim()) return setError('住所を入力してください');
    if (!checkIn) return setError('チェックイン日時を入力してください');
    if (!checkOut) return setError('チェックアウト日時を入力してください');

    setError(null);
    setIsSubmitting(true);
    try {
      const data = {
        tripId,
        name: name.trim(),
        address: address.trim(),
        addressLocal: addressLocal.trim(),
        checkIn: fromDatetimeLocal(checkIn),
        checkOut: fromDatetimeLocal(checkOut),
        mapUrl: mapUrl.trim() || undefined,
        urls: urls.length > 0 ? urls : undefined,
        phone: phone.trim() || undefined,
      };
      if (isEdit && hotel) {
        await updateHotel(hotel.id, data);
      } else {
        await createHotel(data);
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
    if (!hotel) return;
    if (!confirm('このホテルを削除しますか?')) return;
    setIsSubmitting(true);
    try {
      await deleteHotel(hotel.id);
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
            {isEdit ? '— edit stay' : '— new stay'}
          </p>
          <h2 className="font-serif-ja text-2xl text-text tracking-[0.05em]">
            {isEdit ? 'ホテルを編集' : 'ホテルを追加'}
          </h2>
        </div>

        <div className="px-7 py-6 space-y-5">
          <Field label="HOTEL NAME" labelJa="ホテル名">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="例: フュージョン マイア ダナン"
            />
          </Field>

          <Field label="ADDRESS" labelJa="住所(日本語)">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input min-h-[60px] resize-none"
              placeholder="例: ベトナム ダナン市 ..."
            />
          </Field>

          <Field label="ADDRESS · LOCAL" labelJa="住所(現地語)" optional>
            <textarea
              value={addressLocal}
              onChange={(e) => setAddressLocal(e.target.value)}
              className="form-input min-h-[60px] resize-none"
              placeholder="例: Đà Nẵng, Việt Nam"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="CHECK-IN" labelJa="チェックイン">
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="CHECK-OUT" labelJa="チェックアウト">
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="MAP URL" labelJa="地図リンク" optional>
            <input
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="form-input"
              placeholder="https://maps.google.com/..."
            />
          </Field>

          <Field label="LINKS" labelJa="関連URL" optional>
            <UrlListInput value={urls} onChange={setUrls} />
            <p className="font-serif-ja text-[10px] text-text-sub/70 mt-2 italic">
              予約サイト・公式サイト・レビュー記事など、複数登録できます
            </p>
          </Field>

          <Field label="PHONE" labelJa="電話番号" optional>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              placeholder="+84 ..."
            />
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

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}
