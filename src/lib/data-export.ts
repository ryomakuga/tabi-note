// ============================================
// Tabi Note - データのエクスポート/インポート
// 要件定義書 8.2:データ消失リスクへの対策
// 要件定義書 3.13:共同編集・データ共有
// JSON ファイルで全データを書き出し/復元
// 共有用 URL の生成・復号
// ============================================

import { db } from './db';
import type { Trip, Flight, Hotel, Spot, Meal, Photo } from './types';
import { encrypt, decrypt } from './crypto';
import type { EncryptedData } from './crypto';

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

/* ───────── エクスポート(全データバックアップ) ───────── */

export async function exportAllData(): Promise<ExportData> {
  const [trips, flights, hotels, spots, meals, photos] = await Promise.all([
    db.trips.toArray(),
    db.flights.toArray(),
    db.hotels.toArray(),
    db.spots.toArray(),
    db.meals.toArray(),
    db.photos.toArray(),
  ]);

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

export async function downloadExportFile(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().split('T')[0];
  a.download = `tabi-note-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ───────── インポート(全データ復元) ───────── */

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

export interface ImportResult {
  trips: number;
  flights: number;
  hotels: number;
  spots: number;
  meals: number;
  photos: number;
}

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

  await db.transaction('rw', [db.trips, db.flights, db.hotels, db.spots, db.meals, db.photos], async () => {
    await Promise.all([
      db.trips.clear(),
      db.flights.clear(),
      db.hotels.clear(),
      db.spots.clear(),
      db.meals.clear(),
      db.photos.clear(),
    ]);

    await db.trips.bulkAdd(data.trips);
    await db.flights.bulkAdd(data.flights);
    await db.hotels.bulkAdd(data.hotels);
    await db.spots.bulkAdd(data.spots);
    await db.meals.bulkAdd(data.meals);

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

/* ═══════════════════════════════════════════
   共有機能(F-12)
   - 1旅行分のデータを暗号化して URL に埋め込み
   - 写真は含めない(各自のデバイスで撮影・保管)
   - 共有用PIN(別PIN)で暗号化
═══════════════════════════════════════════ */

export interface ShareData {
  formatVersion: 1;
  appName: 'tabi-note';
  type: 'share';
  exportedAt: string;
  trip: Trip;
  flights: Flight[];
  hotels: Hotel[];
  spots: Spot[];
  meals: Meal[];
}

export async function buildShareData(tripId: string): Promise<ShareData> {
  const trip = await db.trips.get(tripId);
  if (!trip) {
    throw new Error('指定された旅行が見つかりませんでした。');
  }

  const [flights, hotels, spots, meals] = await Promise.all([
    db.flights.where('tripId').equals(tripId).toArray(),
    db.hotels.where('tripId').equals(tripId).toArray(),
    db.spots.where('tripId').equals(tripId).toArray(),
    db.meals.where('tripId').equals(tripId).toArray(),
  ]);

  return {
    formatVersion: 1,
    appName: 'tabi-note',
    type: 'share',
    exportedAt: new Date().toISOString(),
    trip,
    flights,
    hotels,
    spots,
    meals,
  };
}

export async function encryptShareData(
  data: ShareData,
  sharePin: string
): Promise<string> {
  const json = JSON.stringify(data);
  const encrypted = await encrypt(json, sharePin);
  const payload = JSON.stringify(encrypted);
  return base64ToBase64Url(btoa(payload));
}

export function buildShareUrl(encryptedPayload: string): string {
  const origin = window.location.origin;
  return `${origin}/#share=${encryptedPayload}`;
}

export async function generateShareUrl(
  tripId: string,
  sharePin: string
): Promise<{ url: string; payload: string }> {
  const data = await buildShareData(tripId);
  const payload = await encryptShareData(data, sharePin);
  const url = buildShareUrl(payload);
  return { url, payload };
}

export async function decryptShareData(
  payload: string,
  sharePin: string
): Promise<ShareData> {
  const base64 = base64UrlToBase64(payload);
  const json = atob(base64);
  const encrypted = JSON.parse(json) as EncryptedData;
  const decryptedJson = await decrypt(encrypted, sharePin);
  const data = JSON.parse(decryptedJson) as unknown;
  if (!validateShareData(data)) {
    throw new Error('共有データの形式が正しくありません。');
  }
  return data;
}

export function extractSharePayloadFromUrl(url: string): string | null {
  const match = url.match(/#share=([^&]+)/);
  return match ? match[1] : null;
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}

function validateShareData(data: unknown): data is ShareData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<ShareData>;
  return (
    d.formatVersion === 1 &&
    d.appName === 'tabi-note' &&
    d.type === 'share' &&
    !!d.trip &&
    Array.isArray(d.flights) &&
    Array.isArray(d.hotels) &&
    Array.isArray(d.spots) &&
    Array.isArray(d.meals)
  );
}
