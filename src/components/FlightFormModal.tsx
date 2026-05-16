import { useState } from 'react';
import { useFlightsStore } from '../lib/flights-store';
import type { Flight } from '../lib/types';

interface FlightFormModalProps {
  tripId: string;
  flight?: Flight; // 編集モードのとき渡す
  onClose: () => void;
}

export function FlightFormModal({ tripId, flight, onClose }: FlightFormModalProps) {
  const createFlight = useFlightsStore((s) => s.createFlight);
  const updateFlight = useFlightsStore((s) => s.updateFlight);

  const isEdit = !!flight;

  const [direction, setDirection] = useState<'outbound' | 'return'>(
    flight?.direction ?? 'outbound'
  );
  const [flightNo, setFlightNo] = useState(flight?.flightNo ?? '');
  const [airline, setAirline] = useState(flight?.airline ?? '');
  const [departureAirport, setDepartureAirport] = useState(flight?.departureAirport ?? '');
  const [arrivalAirport, setArrivalAirport] = useState(flight?.arrivalAirport ?? '');
  const [departureTime, setDepartureTime] = useState(
    flight?.departureTime ? toDatetimeLocal(flight.departureTime) : ''
  );
  const [arrivalTime, setArrivalTime] = useState(
    flight?.arrivalTime ? toDatetimeLocal(flight.arrivalTime) : ''
  );
  const [departureTerminal, setDepartureTerminal] = useState(flight?.departureTerminal ?? '');
  const [arrivalTerminal, setArrivalTerminal] = useState(flight?.arrivalTerminal ?? '');
  const [bookingNo, setBookingNo] = useState(flight?.bookingNo ?? '');
  const [eTicketNo, setETicketNo] = useState(flight?.eTicketNo ?? '');
  const [memo, setMemo] = useState(flight?.memo ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ISO datetime → "YYYY-MM-DDTHH:mm" (input[type=datetime-local] 用)
  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // datetime-local → ISO datetime
  function fromDatetimeLocal(local: string): string {
    return new Date(local).toISOString();
  }

  function validate(): string | null {
    if (!flightNo.trim()) return '便名を入力してください';
    if (!airline.trim()) return '航空会社を入力してください';
    if (!departureAirport.trim()) return '出発空港を入力してください';
    if (!arrivalAirport.trim()) return '到着空港を入力してください';
    if (!departureTime) return '出発時刻を選んでください';
    if (!arrivalTime) return '到着時刻を選んでください';
    if (!bookingNo.trim()) return '予約番号を入力してください';
    if (new Date(arrivalTime) <= new Date(departureTime)) {
      return '到着時刻は出発時刻より後にしてください';
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
      tripId,
      direction,
      flightNo: flightNo.trim(),
      airline: airline.trim(),
      departureAirport: departureAirport.trim(),
      arrivalAirport: arrivalAirport.trim(),
      departureTime: fromDatetimeLocal(departureTime),
      arrivalTime: fromDatetimeLocal(arrivalTime),
      departureTerminal: departureTerminal.trim() || undefined,
      arrivalTerminal: arrivalTerminal.trim() || undefined,
      bookingNo: bookingNo.trim(),
      eTicketNo: eTicketNo.trim() || undefined,
      memo: memo.trim() || undefined,
    };

    try {
      if (isEdit && flight) {
        await updateFlight(flight.id, data);
      } else {
        await createFlight(data);
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
        {/* ヘッダー */}
        <div className="px-8 pt-8 pb-6 border-b border-text-sub/10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-text-sub mb-3">
            {isEdit ? 'Edit Flight' : 'New Flight'}
          </p>
          <h2 className="font-serif text-3xl text-text">
            {isEdit ? 'フライトを編集' : 'フライトを追加'}
          </h2>
        </div>

        {/* フォーム */}
        <div className="px-8 py-6 space-y-5">
          {/* 方向(往路/復路)*/}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('outbound')}
                disabled={isSubmitting}
                className={`py-2 text-[11px] tracking-[0.25em] uppercase rounded-sm border transition-colors ${
                  direction === 'outbound'
                    ? 'bg-accent text-bg border-accent'
                    : 'bg-bg-alt text-text-sub border-text-sub/20 hover:border-accent'
                }`}
              >
                Outbound · 往路
              </button>
              <button
                type="button"
                onClick={() => setDirection('return')}
                disabled={isSubmitting}
                className={`py-2 text-[11px] tracking-[0.25em] uppercase rounded-sm border transition-colors ${
                  direction === 'return'
                    ? 'bg-accent text-bg border-accent'
                    : 'bg-bg-alt text-text-sub border-text-sub/20 hover:border-accent'
                }`}
              >
                Return · 復路
              </button>
            </div>
          </div>

          {/* 便名 + 航空会社 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
                Flight No.
              </label>
              <input
                type="text"
                value={flightNo}
                onChange={(e) => setFlightNo(e.target.value)}
                placeholder="VN337"
                className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
                Airline
              </label>
              <input
                type="text"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="ベトナム航空"
                className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* 出発空港 */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Departure Airport
            </label>
            <input
              type="text"
              value={departureAirport}
              onChange={(e) => setDepartureAirport(e.target.value)}
              placeholder="関西国際空港"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* 出発ターミナル(任意) */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Departure Terminal <span className="text-text-sub/60 normal-case tracking-normal">(任意)</span>
            </label>
            <input
              type="text"
              value={departureTerminal}
              onChange={(e) => setDepartureTerminal(e.target.value)}
              placeholder="第1ターミナル 4F 国際線出国ロビー"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* 出発時刻 */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Departure Time <span className="text-text-sub/60 normal-case tracking-normal">(現地時間)</span>
            </label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* 到着空港 */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Arrival Airport
            </label>
            <input
              type="text"
              value={arrivalAirport}
              onChange={(e) => setArrivalAirport(e.target.value)}
              placeholder="ダナン国際空港"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* 到着ターミナル(任意) */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Arrival Terminal <span className="text-text-sub/60 normal-case tracking-normal">(任意)</span>
            </label>
            <input
              type="text"
              value={arrivalTerminal}
              onChange={(e) => setArrivalTerminal(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* 到着時刻 */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Arrival Time <span className="text-text-sub/60 normal-case tracking-normal">(現地時間)</span>
            </label>
            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* 予約番号 */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Booking No.
            </label>
            <input
              type="text"
              value={bookingNo}
              onChange={(e) => setBookingNo(e.target.value)}
              placeholder="N25004536"
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* eチケット番号(任意) */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              E-Ticket No. <span className="text-text-sub/60 normal-case tracking-normal">(任意)</span>
            </label>
            <input
              type="text"
              value={eTicketNo}
              onChange={(e) => setETicketNo(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* メモ(任意) */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-text-sub mb-2">
              Memo <span className="text-text-sub/60 normal-case tracking-normal">(任意)</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="自身でチェックイン、など"
              rows={2}
              className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="text-sm text-red-700 font-serif-ja py-2 px-3 bg-red-50 border border-red-200 rounded-sm">
              {error}
            </div>
          )}
        </div>

        {/* フッター */}
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
