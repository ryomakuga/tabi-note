// ============================================
// Tabi Note - データのエクスポート/インポート
// 要件定義書 8.2:データ消失リスクへの対策
// 要件定義書 3.13:共同編集・データ共有
// JSON ファイルで全データを書き出し/復元
// 共有用 URL の生成・復号
// ============================================

import { db } from './db';
import type { Trip, Flight, Hotel, Spot, Meal, Photo, MusicTrack, Movie } from './types';
import { decrypt, encryptBytes, decryptBytes } from './crypto';
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
  /** 旧形式のバックアップには存在しないため任意 */
  musicTracks?: MusicTrackExport[];
  movies?: MovieExport[];
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
  thumbBlobBase64?: string;
}

interface MusicTrackExport {
  id: string;
  name: string;
  blobBase64: string;
  blobType: string;
  createdAt: string;
}

interface MovieExport {
  id: string;
  tripId: string;
  name: string;
  blobBase64: string;
  blobType: string;
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
  const [trips, flights, hotels, spots, meals, photos, musicTracks, movies] = await Promise.all([
    db.trips.toArray(),
    db.flights.toArray(),
    db.hotels.toArray(),
    db.spots.toArray(),
    db.meals.toArray(),
    db.photos.toArray(),
    db.musicTracks.toArray(),
    db.movies.toArray(),
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
      thumbBlobBase64: p.thumbBlob ? await blobToBase64(p.thumbBlob) : undefined,
    }))
  );

  const musicTracksExport: MusicTrackExport[] = await Promise.all(
    musicTracks.map(async (m) => ({
      id: m.id,
      name: m.name,
      blobBase64: await blobToBase64(m.blob),
      blobType: m.blob.type || 'audio/mpeg',
      createdAt: m.createdAt,
    }))
  );

  const moviesExport: MovieExport[] = await Promise.all(
    movies.map(async (m) => ({
      id: m.id,
      tripId: m.tripId,
      name: m.name,
      blobBase64: await blobToBase64(m.blob),
      blobType: m.blob.type || 'video/mp4',
      createdAt: m.createdAt,
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
    musicTracks: musicTracksExport,
    movies: moviesExport,
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
  musicTracks: number;
  movies: number;
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

  await db.transaction('rw', [db.trips, db.flights, db.hotels, db.spots, db.meals, db.photos, db.musicTracks, db.movies], async () => {

    await db.trips.bulkPut(data.trips);
    await db.flights.bulkPut(data.flights);
    await db.hotels.bulkPut(data.hotels);
    await db.spots.bulkPut(data.spots);
    await db.meals.bulkPut(data.meals);

    const photosRestored: Photo[] = data.photos.map((p) => ({
      id: p.id,
      tripId: p.tripId,
      filename: p.filename,
      blob: base64ToBlob(p.blobBase64, p.blobType),
      thumbBlob: p.thumbBlobBase64 ? base64ToBlob(p.thumbBlobBase64, 'image/jpeg') : undefined,
      takenAt: p.takenAt,
      isFavorite: p.isFavorite,
      createdAt: p.createdAt,
    }));
    await db.photos.bulkPut(photosRestored);

    // 旧形式のバックアップには musicTracks / movies が無いので空配列で扱う
    const musicTracksRestored: MusicTrack[] = (data.musicTracks ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      blob: base64ToBlob(m.blobBase64, m.blobType),
      createdAt: m.createdAt,
    }));
    await db.musicTracks.bulkPut(musicTracksRestored);

    const moviesRestored: Movie[] = (data.movies ?? []).map((m) => ({
      id: m.id,
      tripId: m.tripId,
      name: m.name,
      blob: base64ToBlob(m.blobBase64, m.blobType),
      createdAt: m.createdAt,
    }));
    await db.movies.bulkPut(moviesRestored);
  });

  return {
    trips: data.trips.length,
    flights: data.flights.length,
    hotels: data.hotels.length,
    spots: data.spots.length,
    meals: data.meals.length,
    photos: data.photos.length,
    musicTracks: data.musicTracks?.length ?? 0,
    movies: data.movies?.length ?? 0,
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

/* ───────── 共有ペイロードのバイナリ形式 ─────────
   payload = base64url( version(1) + salt(16) + iv(12) + ciphertext )

   version 0x01: 平文 JSON を deflate-raw で圧縮してから AES-256-GCM
   version 0x02: 圧縮なし(CompressionStream が使えない環境のフォールバック)

   旧形式(2026-05 に生成した URL)は base64url( JSON{ciphertext,iv,salt} ) で、
   復号すると先頭バイトが '{'(0x7B)になる。version バイトにこの値は使わない。
   ───────────────────────────────────────── */
const SHARE_FORMAT_DEFLATE = 0x01;
const SHARE_FORMAT_PLAIN = 0x02;
const LEGACY_JSON_FIRST_BYTE = 0x7b; // '{'

function canUseDeflate(): boolean {
  try {
    if (typeof CompressionStream === 'undefined') return false;
    // 'deflate-raw' 非対応の実装はここで例外になる
    new CompressionStream('deflate-raw');
    return true;
  } catch {
    return false;
  }
}

function canUseInflate(): boolean {
  try {
    if (typeof DecompressionStream === 'undefined') return false;
    new DecompressionStream('deflate-raw');
    return true;
  } catch {
    return false;
  }
}

async function deflateRaw(input: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflateRaw(input: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encryptShareData(
  data: ShareData,
  sharePin: string
): Promise<string> {
  const json = stringToBytes(JSON.stringify(data));

  // 圧縮できる環境なら deflate-raw、無理なら非圧縮。version バイトで区別する
  let version = SHARE_FORMAT_PLAIN;
  let body: Uint8Array<ArrayBuffer> = json;
  if (canUseDeflate()) {
    try {
      const packed = await deflateRaw(json);
      if (packed.length < json.length) {
        body = packed;
        version = SHARE_FORMAT_DEFLATE;
      }
    } catch (e) {
      console.warn('共有データの圧縮に失敗したため非圧縮で続行します:', e);
    }
  }

  const encrypted = await encryptBytes(body, sharePin);
  const out = new Uint8Array(1 + encrypted.length);
  out[0] = version;
  out.set(encrypted, 1);
  return bytesToBase64Url(out);
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
  const bytes = base64UrlToBytes(payload);
  if (bytes.length === 0) {
    throw new Error('共有データが空です。');
  }

  let decryptedJson: string;
  if (bytes[0] === LEGACY_JSON_FIRST_BYTE) {
    // 旧形式: base64url( JSON{ciphertext,iv,salt} )
    const encrypted = JSON.parse(bytesToString(bytes)) as EncryptedData;
    decryptedJson = await decrypt(encrypted, sharePin);
  } else {
    const version = bytes[0];
    if (version !== SHARE_FORMAT_DEFLATE && version !== SHARE_FORMAT_PLAIN) {
      throw new Error(`未対応の共有データ形式です(version ${version})。アプリを最新版に更新してください。`);
    }
    const plain = await decryptBytes(bytes.subarray(1), sharePin);
    if (version === SHARE_FORMAT_DEFLATE) {
      if (!canUseInflate()) {
        throw new Error('この端末では圧縮された共有URLを開けません。iOS 16.4 以降、または最新の Chrome / Safari をお使いください。');
      }
      decryptedJson = bytesToString(await inflateRaw(plain));
    } else {
      decryptedJson = bytesToString(plain);
    }
  }

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

/* ═══════════════════════════════════════════
   共有データのインポート(F-12 受信側)
   - URL から復号した ShareData を自分のデバイスに保存
   - 既存データと衝突しないよう新しい ID を発行して追加
═══════════════════════════════════════════ */

export interface ShareImportResult {
  tripTitle: string;
  destination: string;
  flightsCount: number;
  hotelsCount: number;
  spotsCount: number;
  mealsCount: number;
}

/**
 * ShareData を自分のデバイスにインポート
 * - Trip / Flight / Hotel / Spot / Meal すべてに新しい ID を発行
 * - 既存の旅と並列に追加(置き換えはしない)
 */
export async function importShareData(data: ShareData): Promise<ShareImportResult> {
  // 新しい Trip ID を生成
  const newTripId = crypto.randomUUID();

  const now = new Date().toISOString();

  // Trip を新 ID で複製
  const newTrip: Trip = {
    ...data.trip,
    id: newTripId,
    createdAt: now,
    updatedAt: now,
  };

  // 関連データも新 ID + tripId を貼り替え
  const newFlights: Flight[] = data.flights.map((f) => ({
    ...f,
    id: crypto.randomUUID(),
    tripId: newTripId,
  }));

  const newHotels: Hotel[] = data.hotels.map((h) => ({
    ...h,
    id: crypto.randomUUID(),
    tripId: newTripId,
  }));

  const newSpots: Spot[] = data.spots.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    tripId: newTripId,
  }));

  const newMeals: Meal[] = data.meals.map((m) => ({
    ...m,
    id: crypto.randomUUID(),
    tripId: newTripId,
  }));

  // トランザクションで一括追加
  await db.transaction('rw', [db.trips, db.flights, db.hotels, db.spots, db.meals], async () => {
    await db.trips.add(newTrip);
    if (newFlights.length > 0) await db.flights.bulkAdd(newFlights);
    if (newHotels.length > 0) await db.hotels.bulkAdd(newHotels);
    if (newSpots.length > 0) await db.spots.bulkAdd(newSpots);
    if (newMeals.length > 0) await db.meals.bulkAdd(newMeals);
  });

  return {
    tripTitle: newTrip.title,
    destination: newTrip.destination,
    flightsCount: newFlights.length,
    hotelsCount: newHotels.length,
    spotsCount: newSpots.length,
    mealsCount: newMeals.length,
  };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return base64ToBytes(base64);
}

function stringToBytes(str: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
