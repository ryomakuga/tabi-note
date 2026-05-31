// ============================================
// Tabi Note - データベース定義 (Dexie.js)
// 要件定義書 V1.5 / 5.2 のエンティティに対応
// V1.5: travelers / flightSeats テーブルを削除
// V2: musicTracks テーブルを追加(ムービー用の保存音楽)
// ============================================
import Dexie, { type Table } from 'dexie';
import type {
  Trip,
  Flight,
  Hotel,
  Spot,
  Meal,
  Photo,
  MusicTrack,
} from './types';
export class TabiNoteDB extends Dexie {
  trips!: Table<Trip, string>;
  flights!: Table<Flight, string>;
  hotels!: Table<Hotel, string>;
  spots!: Table<Spot, string>;
  meals!: Table<Meal, string>;
  photos!: Table<Photo, string>;
  musicTracks!: Table<MusicTrack, string>;
  constructor() {
    super('TabiNoteDB');
    this.version(1).stores({
      trips: 'id, startDate, endDate, createdAt',
      flights: 'id, tripId, direction, departureTime',
      hotels: 'id, tripId, checkIn',
      spots: 'id, tripId, status, scheduledAt',
      meals: 'id, tripId, status, scheduledAt',
      photos: 'id, tripId, takenAt, isFavorite',
    });
    this.version(2).stores({
      musicTracks: 'id, createdAt',
    });
  }
}
export const db = new TabiNoteDB();
/**
 * 一意なIDを生成
 */
export function generateId(): string {
  return crypto.randomUUID();
}
/**
 * 現在時刻をISO 8601文字列で取得
 */
export function now(): string {
  return new Date().toISOString();
}
