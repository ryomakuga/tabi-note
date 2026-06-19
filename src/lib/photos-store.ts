import { create } from 'zustand';
import { db } from './db';
import type { Photo } from './types';

async function makeVideoThumb(file: File): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    let done = false;
    let url = "";
    const v = document.createElement("video");

    const fail = (code: string) => {
      // 失敗時:原因コードを焼いた小さな画像を返す(画面で原因が見える)
      try {
        const c = document.createElement("canvas");
        c.width = 320; c.height = 320;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#DDD3C0";
          ctx.fillRect(0, 0, 320, 320);
          ctx.fillStyle = "#8B7355";
          ctx.font = "bold 40px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(code, 160, 175);
          c.toBlob((b) => finish(b || undefined), "image/jpeg", 0.7);
          return;
        }
      } catch {}
      finish(undefined);
    };

    const finish = (b?: Blob) => {
      if (done) return;
      done = true;
      try { v.pause(); } catch {}
      if (url) URL.revokeObjectURL(url);
      resolve(b);
    };

    const draw = (tag: string) => {
      try {
        const w = v.videoWidth, h = v.videoHeight;
        if (!w || !h) { fail("NOSIZE"); return; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) { fail("NOCTX"); return; }
        ctx.drawImage(v, 0, 0, w, h);
        // 真っ黒チェック:中央1pxを見て、ほぼ黒なら失敗扱い
        try {
          const px = ctx.getImageData(Math.floor(w / 2), Math.floor(h / 2), 1, 1).data;
          if (px[0] < 8 && px[1] < 8 && px[2] < 8) { fail("BLACK:" + tag); return; }
        } catch {}
        c.toBlob((b) => finish(b || undefined), "image/jpeg", 0.7);
      } catch {
        fail("DRAWERR");
      }
    };

    try {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.preload = "auto";
      url = URL.createObjectURL(file);
      v.src = url;

      // 最有力:フレームが描画可能になった瞬間に捕まえる(iOS16+)
      const anyV = v as any;
      const hasRVFC = typeof anyV.requestVideoFrameCallback === "function";

      v.addEventListener("loadedmetadata", () => {
        try {
          const t = isFinite(v.duration) && v.duration > 0.3 ? 0.1 : 0;
          v.currentTime = t;
        } catch {}
        // デコーダを起こす
        v.play().then(() => {
          if (hasRVFC) {
            anyV.requestVideoFrameCallback(() => {
              try { v.pause(); } catch {}
              draw("RVFC");
            });
          } else {
            setTimeout(() => { try { v.pause(); } catch {} draw("PLAY"); }, 300);
          }
        }).catch(() => {
          // 自動再生拒否 → seek 完了に賭ける
          v.addEventListener("seeked", () => draw("SEEK"), { once: true });
          try { v.currentTime = 0.1; } catch { fail("NOPLAY"); }
        });
      });

      v.addEventListener("error", () => fail("VIDERR"));
      // 保険:6秒で締める
      setTimeout(() => { if (!done) fail("TIMEOUT"); }, 6000);
      v.load();
    } catch {
      fail("INIT");
    }
  });
}

interface PhotosState {
  photos: Photo[];
  loading: boolean;
  loadPhotos: (tripId: string) => Promise<void>;
  addPhotos: (tripId: string, files: File[]) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
}

/**
 * File オブジェクトから撮影日時を抽出する
 * EXIF があれば EXIF.DateTimeOriginal、無ければ File.lastModified を使う
 */
async function extractTakenAt(file: File): Promise<string> {
  // 軽量に EXIF を読みたいので、画像の先頭 128KB だけ読む(EXIF は通常先頭に入る)
  try {
    const slice = file.slice(0, 128 * 1024);
    const buf = await slice.arrayBuffer();
    const view = new DataView(buf);
    const taken = parseExifDateTime(view);
    if (taken) return taken;
  } catch {
    // EXIF 読み取り失敗時は lastModified にフォールバック
  }
  return new Date(file.lastModified).toISOString();
}

/**
 * 簡易 EXIF パーサ:JPEG の DateTimeOriginal タグだけ拾う
 * 失敗時は null を返す(全ての画像形式に対応するわけではない)
 */
function parseExifDateTime(view: DataView): string | null {
  try {
    // JPEG マジックナンバー: FF D8
    if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return null;

    let offset = 2;
    while (offset < view.byteLength) {
      if (view.getUint8(offset) !== 0xFF) break;
      const marker = view.getUint8(offset + 1);
      const size = view.getUint16(offset + 2);

      // APP1 マーカー(0xE1)が EXIF を含む
      if (marker === 0xE1) {
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        if (exifHeader === 'Exif') {
          // TIFF ヘッダ位置
          const tiffOffset = offset + 10;
          const little = view.getUint16(tiffOffset) === 0x4949;
          const ifdOffset = view.getUint32(tiffOffset + 4, little);
          // IFD0 を走査
          const dt = findExifDateTime(view, tiffOffset, ifdOffset, little);
          if (dt) return dt;
        }
      }
      offset += 2 + size;
    }
  } catch {
    return null;
  }
  return null;
}

function findExifDateTime(
  view: DataView,
  tiffOffset: number,
  ifdOffset: number,
  little: boolean
): string | null {
  try {
    const entries = view.getUint16(tiffOffset + ifdOffset, little);
    for (let i = 0; i < entries; i++) {
      const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
      const tag = view.getUint16(entryOffset, little);
      // 0x8769 = ExifIFDPointer
      if (tag === 0x8769) {
        const subIfdOffset = view.getUint32(entryOffset + 8, little);
        return findDateTimeOriginal(view, tiffOffset, subIfdOffset, little);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function findDateTimeOriginal(
  view: DataView,
  tiffOffset: number,
  ifdOffset: number,
  little: boolean
): string | null {
  try {
    const entries = view.getUint16(tiffOffset + ifdOffset, little);
    for (let i = 0; i < entries; i++) {
      const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
      const tag = view.getUint16(entryOffset, little);
      // 0x9003 = DateTimeOriginal
      if (tag === 0x9003) {
        const dataOffset = view.getUint32(entryOffset + 8, little);
        const str = readAsciiString(view, tiffOffset + dataOffset, 19);
        // EXIF 日付形式: "2026:06:28 18:42:13" → "2026-06-28T18:42:13"
        if (/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
          const iso = str.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T');
          // ローカル時刻として ISO 化
          return new Date(iso).toISOString();
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

function readAsciiString(view: DataView, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const code = view.getUint8(offset + i);
    if (code === 0) break;
    s += String.fromCharCode(code);
  }
  return s;
}

export const usePhotosStore = create<PhotosState>((set, get) => ({
  photos: [],
  loading: false,

  loadPhotos: async (tripId: string) => {
    set({ loading: true });
    try {
      const photos = await db.photos
        .where('tripId')
        .equals(tripId)
        .toArray();
      // takenAt 昇順(古い→新しい)
      photos.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
      set({ photos, loading: false });
      // 既存の動画でサムネ未生成のものを、裏で順に補完する
      void (async () => {
        for (const ph of photos) {
          if (!ph.blob.type.startsWith("video/")) continue;
          if (ph.thumbBlob) continue;
          try {
            const file = new File([ph.blob], ph.filename, { type: ph.blob.type });
            const thumbBlob = await makeVideoThumb(file);
            if (!thumbBlob) continue;
            await db.photos.update(ph.id, { thumbBlob });
            set((st) => ({
              photos: st.photos.map((x) => (x.id === ph.id ? { ...x, thumbBlob } : x)),
            }));
          } catch {}
        }
      })();
    } catch (error) {
      console.error('Failed to load photos:', error);
      set({ loading: false });
    }
  },

  addPhotos: async (tripId: string, files: File[]) => {
    const now = new Date().toISOString();
    const newPhotos: Photo[] = [];
    for (const file of files) {
      const takenAt = await extractTakenAt(file);
      const thumbBlob = file.type.startsWith("video/") ? await makeVideoThumb(file) : undefined;
      const photo: Photo = {
        id: crypto.randomUUID(),
        tripId,
        filename: file.name,
        blob: file,
        thumbBlob,
        takenAt,
        isFavorite: false,
        createdAt: now,
      };
      await db.photos.add(photo);
      newPhotos.push(photo);
    }
    const merged = [...get().photos, ...newPhotos];
    merged.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    set({ photos: merged });
  },

  toggleFavorite: async (id: string) => {
    const photo = get().photos.find((p) => p.id === id);
    if (!photo) return;
    const updated = { ...photo, isFavorite: !photo.isFavorite };
    await db.photos.put(updated);
    set({ photos: get().photos.map((p) => (p.id === id ? updated : p)) });
  },

  removePhoto: async (id: string) => {
    await db.photos.delete(id);
    set({ photos: get().photos.filter((p) => p.id !== id) });
  },
}));
