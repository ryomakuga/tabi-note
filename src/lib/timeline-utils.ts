// ============================================
// Tabi Note - タイムライン構築ユーティリティ
// 全エンティティ(Flight/Hotel/Spot/Meal)を統合して日付別に並べる
// ============================================

import type { Flight, Hotel, Spot, Meal } from './types';

export type TimelineCategory = 'flight' | 'hotel-in' | 'hotel-out' | 'spot' | 'meal';

export type TimelineItem = {
  id: string;                  // 一意キー
  category: TimelineCategory;
  datetime: string;            // ISO 文字列(ソート用)
  hasTime: boolean;            // 時刻ありフラグ(時刻なしは日付の最後にソート)
  title: string;               // 例: 「VN337」「Check-in」
  titleLocal?: string;         // 例: 「Madame Lân」「Ngũ Hành Sơn」
  detail?: string;             // 例: 「関空 → ダナン」「ベトナム ダナン市…」
  endTime?: string;            // フライト到着時刻表示用
  raw: Flight | Hotel | Spot | Meal;  // 編集モーダル起動用
};

export type TimelineDay = {
  date: string;                // YYYY-MM-DD
  items: TimelineItem[];
};

/**
 * 全エンティティを TimelineItem 配列に変換
 * - Flight: 出発時刻ベースで 1 件
 * - Hotel: チェックイン / チェックアウトで 2 件
 * - Spot: 確定 + scheduledAt あり のみ
 * - Meal: 確定 + scheduledAt あり のみ
 */
export function buildTimelineItems(
  flights: Flight[],
  hotels: Hotel[],
  spots: Spot[],
  meals: Meal[]
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Flight
  for (const f of flights) {
    items.push({
      id: `flight-${f.id}`,
      category: 'flight',
      datetime: f.departureTime,
      hasTime: true,
      title: f.flightNo || 'フライト',
      detail: formatFlightDetail(f),
      endTime: f.arrivalTime,
      raw: f,
    });
  }

  // Hotel: チェックイン / チェックアウト で 2 件
  for (const h of hotels) {
    if (h.checkIn) {
      items.push({
        id: `hotel-in-${h.id}`,
        category: 'hotel-in',
        datetime: h.checkIn,
        hasTime: hasTimeComponent(h.checkIn),
        title: 'Check-in',
        titleLocal: h.name,
        detail: h.address,
        raw: h,
      });
    }
    if (h.checkOut) {
      items.push({
        id: `hotel-out-${h.id}`,
        category: 'hotel-out',
        datetime: h.checkOut,
        hasTime: hasTimeComponent(h.checkOut),
        title: 'Check-out',
        titleLocal: h.name,
        detail: h.address,
        raw: h,
      });
    }
  }

  // Spot: 確定 + scheduledAt あり のみ
  for (const s of spots) {
    if (s.status === 'confirmed' && s.scheduledAt) {
      items.push({
        id: `spot-${s.id}`,
        category: 'spot',
        datetime: s.scheduledAt,
        hasTime: true,
        title: s.name,
        titleLocal: s.nameLocal,
        detail: s.memo,
        raw: s,
      });
    }
  }

  // Meal: 確定 + scheduledAt あり のみ
  for (const m of meals) {
    if (m.status === 'confirmed' && m.scheduledAt) {
      items.push({
        id: `meal-${m.id}`,
        category: 'meal',
        datetime: m.scheduledAt,
        hasTime: true,
        title: m.name,
        titleLocal: m.nameLocal,
        detail: m.genre,
        raw: m,
      });
    }
  }

  return items;
}

/**
 * TimelineItem 配列を日付ごとにグルーピング + 各日内で時刻順ソート
 * 時刻なしは日付の最後に配置
 */
export function groupByDay(items: TimelineItem[]): TimelineDay[] {
  const map = new Map<string, TimelineItem[]>();

  for (const item of items) {
    // ローカルタイム基準で YYYY-MM-DD を作る(JST の人なら JST の日付)
    const d = new Date(item.datetime);
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(item);
  }

  const sortedDates = Array.from(map.keys()).sort();
  return sortedDates.map((date) => {
    const items = map.get(date)!;
    items.sort((a, b) => {
      if (a.hasTime && !b.hasTime) return -1;
      if (!a.hasTime && b.hasTime) return 1;
      return a.datetime.localeCompare(b.datetime);
    });
    return { date, items };
  });
}

/**
 * Day ラベル整形: 「Day 01」「Sunday」「28 June」
 */
export function formatDayLabel(date: string, dayIndex: number): {
  dayLabel: string;
  weekday: string;
  dateLabel: string;
} {
  const d = new Date(date + 'T00:00:00');
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return {
    dayLabel: `Day ${String(dayIndex).padStart(2, '0')}`,
    weekday: weekdays[d.getDay()],
    dateLabel: `${d.getDate()} ${months[d.getMonth()]}`,
  };
}

/**
 * 時刻整形: 「09:30」
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * フライトの detail 整形: 「関空 → ダナン空港」
 */
function formatFlightDetail(f: Flight): string {
  const dep = f.departureAirport || '';
  const arr = f.arrivalAirport || '';
  if (dep && arr) return `${dep} → ${arr}`;
  return dep || arr || '';
}

/**
 * ISO 文字列に時刻成分があるか
 * "2026-06-28" だけなら false、"2026-06-28T15:00..." なら true
 */
function hasTimeComponent(iso: string): boolean {
  if (!iso.includes('T')) return false;
  const timePart = iso.split('T')[1];
  if (!timePart) return false;
  // 時刻が 00:00 系統(UTC midnight)なら時刻なしと判定
  return !/^00:00(:00)?/.test(timePart);
}
