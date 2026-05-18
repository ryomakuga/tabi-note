import { useState } from 'react';
import { useTripsStore } from '../lib/trips-store';
import { CountrySelect } from './CountrySelect';
import { findCountryByCode, findCountryByTimezone, getTimezoneOffsetText } from '../lib/timezones';
import type { CountryOption } from '../lib/timezones';
import type { Trip } from '../lib/types';

interface TripFormModalProps {
  trip?: Trip; // 編集モードのとき渡す
  onClose: () => void;
}

export function TripFormModal({ trip, onClose }: TripFormModalProps) {
  const createTrip = useTripsStore((s) => s.createTrip);
  const updateTrip = useTripsStore((s) => s.updateTrip);

  const isEdit = !!trip;

  // 既存 trip があれば timezone から country を逆引き
  const initialCountry = trip?.timezone ? findCountryByTimezone(trip.timezone) : undefined;

  const [title, setTitle] = useState(trip?.title ?? '');
  const [destination, setDestination] = useState(trip?.destination ?? '');
  const [origin, setOrigin] = useState(trip?.origin ?? '日本');
  const [countryCode, setCountryCode] = useState<string | undefined>(initialCountry?.code);
  const [localLanguage, setLocalLanguage] = useState(trip?.localLanguage ?? '');
  const [startDate, setStartDate] = useState(trip?.startDate ?? '');
  const [endDate, setEndDate] = useState(trip?.endDate ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCountry = findCountryByCode(countryCode);
  const offsetText = selectedCountry ? getTimezoneOffsetText(selectedCountry.timezone) : '';

  function handleCountryChange(option: CountryOption | undefined) {
    setCountryCode(option?.code);
  }

  function validate(): string | null {
    if (!title.trim()) return 'タイトルを入力してください';
    if (!destination.trim()) return '行き先を入力してください';
    if (!startDate) return '出発日を選んでください';
    if (!endDate) return '帰国日を選んでください';
    if (new Date(endDate) < new Date(startDate)) {
      return '帰国日は出発日より後の日付にしてください';
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const data = {
      title: title.trim(),
      destination: destination.trim(),
      origin: origin.trim() || '日本',
      localLanguage: localLanguage.trim(),
      timezone: selectedCountry?.timezone,
      startDate,
      endDate,
    };

    try {
      if (isEdit && trip) {
        await updateTrip(trip.id, data);
      } else {
        await createTrip(data);
      }
      onClose();
    } catch (e) {
      console.error(e);
      setError('保存に失敗しました');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg rounded-sm shadow-2xl border border-text-sub/20 max-h-[90vh] overflow-y-auto">
        <div className="px-8 pt-8 pb-6 border-b border-text-sub/10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-text-sub mb-3">
            {isEdit ? 'Edit Journey' : 'New Journey'}
          </p>
          <h2 className="font-serif text-3xl text-text">
            {isEdit ? '旅を編集' : '新しい旅'}
          </h2>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ダナンの夏"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例: ダナン、ベトナム"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Country <span className="text-text-sub/60 normal-case tracking-normal">(行き先の国)</span>
            </label>
            <CountrySelect
              value={countryCode}
              onChange={handleCountryChange}
              disabled={isSubmitting}
            />
            {offsetText && (
              <p className="mt-2 text-[11px] font-serif-ja text-text-sub italic">
                {offsetText}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Origin
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="例: 日本"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Local Language <span className="text-text-sub/60 normal-case tracking-normal">(任意)</span>
            </label>
            <input
              type="text"
              value={localLanguage}
              onChange={(e) => setLocalLanguage(e.target.value)}
              placeholder="例: ベトナム語"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
                Departure
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text focus:outline-none focus:border-accent transition-colors"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
                Return
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text focus:outline-none focus:border-accent transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 font-serif-ja py-2 px-3 bg-red-50 border border-red-200 rounded-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-text-sub/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 text-[11px] tracking-[0.25em] uppercase text-text-sub hover:text-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-accent text-bg text-[11px] tracking-[0.25em] uppercase rounded-sm hover:bg-text transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
