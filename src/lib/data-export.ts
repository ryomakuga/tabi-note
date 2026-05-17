// ============================================
// Tabi Note - データのエクスポート/インポート
// 要件定義書 8.2:データ消失リスクへの対策
// JSON ファイルで全データを書き出し/復元
// ============================================

import { db } from './db';
import type { Trip, Flight, Hotel, Spot, Meal, Photo } from './types';

/* ───────── エクスポート形式 ───────── */

export interface ExportData {
  formatVersion: 1;
  exportedAt: string;
  appName: 'tabi-note';
  trips: Trip[];
  flights: Flight[];
  hotels: Hotel[];
  spots: Spot[];
  meals: Meal[];
  photos: PhotoExport[];
}

// Photo の blob を base64 に変換した形式
interface PhotoExport {
  id: string;
  tripId: string;
  filename: string;
  blobBase64: string;
  blobType: string;
  takenAt: string;
  isFavorite: boolean;
  createdAt: string;
}

/* ───────── ヘルパー:Blob ↔ Base64 ───────── */

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // "data:image/jpeg;base64,XXXX" の "XXXX" 部分だけ取り出す
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

/* ───────── エクスポート ───────── */

/**
 * 全データを ExportData 形式で書き出す
 */
export async function exportAllData(): Promise<ExportData> {
  const [trips, flights, hotels, spots, meals, photos] = await Promise.all([
    db.trips.toArray(),
    db.flights.toArray(),
    db.hotels.toArray(),
    db.spots.toArray(),
    db.meals.toArray(),
    db.photos.toArray(),
  ]);

  // 写真の blob を base64 に変換
  const photosExport: PhotoExport[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      tripId: p.tripId,
      filename: p.filename,
      blobBase64: await blobToBase64(p.blob),
      blobType: p.blob.type || 'image/jpeg',
      takenAt: p.takenAt,
      isFavorite: p.isFavorite,
      createdAt: p.createdAt,
    }))
  );

  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    appName: 'tabi-note',
    trips,
    flights,
    hotels,
    spots,
    meals,
    photos: photosExport,
  };
}

/**
 * ExportData を JSON ファイルとしてダウンロード
 */
export async function downloadExportFile(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  a.download = `tabi-note-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ───────── インポート ───────── */

/**
 * ExportData のバリデーション
 */
function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<ExportData>;
  return (
    d.formatVersion === 1 &&
    d.appName === 'tabi-note' &&
    Array.isArray(d.trips) &&
    Array.isArray(d.flights) &&
    Array.isArray(d.hotels) &&
    Array.isArray(d.spots) &&
    Array.isArray(d.meals) &&
    Array.isArray(d.photos)
  );
}

/**
 * インポート結果のサマリー
 */
export interface ImportResult {
  trips: number;
  flights: number;
  hotels: number;
  spots: number;
  meals: number;
  photos: number;
}

/**
 * JSON ファイルからデータを復元
 * - 既存データは全削除してから復元(完全置き換え)
 * - 写真の blob は base64 → Blob に変換
 */
export async function importDataFromJson(jsonString: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('JSON の解析に失敗しました。ファイルが壊れている可能性があります。');
  }

  if (!validateExportData(parsed)) {
    throw new Error('Tabi Note のバックアップファイルとして認識できませんでした。');
  }

  const data = parsed;

  // 既存データを全削除
  await db.transaction('rw', [db.trips, db.flights, db.hotels, db.spots, db.meals, db.photos], async () => {
    await Promise.all([
      db.trips.clear(),
      db.flights.clear(),
      db.hotels.clear(),
      db.spots.clear(),
      db.meals.clear(),
      db.photos.clear(),
    ]);

    // 復元
    await db.trips.bulkAdd(data.trips);
    await db.flights.bulkAdd(data.flights);
    await db.hotels.bulkAdd(data.hotels);
    await db.spots.bulkAdd(data.spots);
    await db.meals.bulkAdd(data.meals);

    // 写真は blob を復元
    const photosRestored: Photo[] = data.photos.map((p) => ({
      id: p.id,
      tripId: p.tripId,
      filename: p.filename,
      blob: base64ToBlob(p.blobBase64, p.blobType),
      takenAt: p.takenAt,
      isFavorite: p.isFavorite,
      createdAt: p.createdAt,
    }));
    await db.photos.bulkAdd(photosRestored);
  });

  return {
    trips: data.trips.length,
    flights: data.flights.length,
    hotels: data.hotels.length,
    spots: data.spots.length,
    meals: data.meals.length,
    photos: data.photos.length,
  };
}
