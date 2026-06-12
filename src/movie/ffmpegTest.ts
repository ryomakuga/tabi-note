import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

async function loadFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => console.log("[ffmpeg]", message));
  ffmpeg.on("progress", ({ progress }) => {
    console.log("[progress]", Math.round(progress * 100) + "%");
    onProgress?.(progress);
  });
  const origin = window.location.origin;
  console.log("LOAD: load()呼び出し直前");
  await ffmpeg.load({
    coreURL: new URL("/ffmpeg/esm-core/ffmpeg-core.js", origin).href,
    wasmURL: new URL("/ffmpeg/esm-core/ffmpeg-core.wasm", origin).href,
    classWorkerURL: new URL("/ffmpeg/esm/worker.js", origin).href,
  });
  console.log("LOAD: load()完了");
  return ffmpeg;
}

export async function testLoadFFmpeg(): Promise<string> {
  await loadFFmpeg();
  return "FFmpeg loaded OK";
}

function makeColorPng(color: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1280, 720);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );
}

export async function testMakeVideo(): Promise<string> {
  console.log("STEP 1: load開始");
  const ffmpeg = await loadFFmpeg();
  console.log("STEP 2: load完了");
  const png0 = await makeColorPng("#8B7355");
  const png1 = await makeColorPng("#5C7548");
  console.log("STEP 3: PNG生成完了", png0.size, png1.size);
  await ffmpeg.writeFile("img0.png", await fetchFile(png0));
  await ffmpeg.writeFile("img1.png", await fetchFile(png1));
  console.log("STEP 5: 書き込み完了");
  const files = await ffmpeg.listDir("/");
  console.log("STEP 6: ファイル一覧", files);
  console.log("STEP 7: exec開始");
  const ret = await ffmpeg.exec([
    "-framerate", "0.5",
    "-i", "img%d.png",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-vf", "fps=30",
    "out.mp4",
  ]);
  console.log("STEP 8: exec完了 ret=", ret);
  const data = await ffmpeg.readFile("out.mp4");
  console.log("STEP 9: readFile完了", (data as Uint8Array).length, "bytes");
  const blob = new Blob([data], { type: "video/mp4" });
  return URL.createObjectURL(blob);
}



// HEICをJPEGに変換するヘルパー(heic2anyを動的import)
async function convertIfHeic(blob: Blob): Promise<Blob> {
  const isHeic =
    blob.type === "image/heic" ||
    blob.type === "image/heif" ||
    /\.heic$|\.heif$/i.test((blob as File).name || "");
  if (!isHeic) return blob;
  console.log("[heic2any] HEIC検出 → JPEG変換");
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(converted) ? converted[0] : converted;
}

// 本番用: 画像Blobの配列から無音MP4を作る(HEIC/JPEG/PNG対応)
export async function makeSlideshowFromBlobs(
  images: Blob[],
  secondsPerImage = 2
): Promise<string> {
  if (images.length === 0) throw new Error("画像が0枚です");

  // 1. HEIC変換(必要なものだけ)
  const prepared: Blob[] = [];
  for (let i = 0; i < images.length; i++) {
    prepared.push(await convertIfHeic(images[i]));
  }
  console.log("画像準備完了:", prepared.length, "枚");

  // 2. FFmpeg起動
  const ffmpeg = await loadFFmpeg();

  // 3. 仮想ファイルシステムに書き込み、concatリスト作成
  const listLines: string[] = [];
  for (let i = 0; i < prepared.length; i++) {
    const ext = prepared[i].type.includes("png") ? "png" : "jpg";
    const filename = `img${i}.${ext}`;
    await ffmpeg.writeFile(filename, await fetchFile(prepared[i]));
    listLines.push(`file '${filename}'`);
    listLines.push(`duration ${secondsPerImage}`);
  }
  // concatデマクサ仕様: 最後の画像をもう一度
  const lastFile = listLines[listLines.length - 2];
  listLines.push(lastFile);

  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listLines.join("\n")));

  // 4. エンコード
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "list.txt",
    "-vsync", "vfr",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-vf", "fps=30,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black",
    "out.mp4",
  ]);

  const data = await ffmpeg.readFile("out.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  return URL.createObjectURL(blob);
}

// Blob URLをmp4ファイルとしてダウンロードする
export function downloadVideo(url: string, filename = "tabi-note-movie.mp4"): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 写真スライドショーに音楽を載せたMP4を作る(HEIC/JPEG/PNG画像 + mp3/m4a/wav音楽)
export async function makeSlideshowWithMusic(
  images: Blob[],
  musicFile: Blob,
  secondsPerImage = 2
): Promise<string> {
  if (images.length === 0) throw new Error("画像が0枚です");
  if (!musicFile) throw new Error("音楽ファイルがありません");

  // 1. HEIC変換(必要なものだけ)
  const prepared: Blob[] = [];
  for (let i = 0; i < images.length; i++) {
    prepared.push(await convertIfHeic(images[i]));
  }
  console.log("画像準備完了:", prepared.length, "枚");

  // 2. FFmpeg起動
  const ffmpeg = await loadFFmpeg();

  // 3. 画像書き込み + concatリスト作成
  const listLines: string[] = [];
  for (let i = 0; i < prepared.length; i++) {
    const ext = prepared[i].type.includes("png") ? "png" : "jpg";
    const filename = `img${i}.${ext}`;
    await ffmpeg.writeFile(filename, await fetchFile(prepared[i]));
    listLines.push(`file '${filename}'`);
    listLines.push(`duration ${secondsPerImage}`);
  }
  listLines.push(listLines[listLines.length - 2]);
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listLines.join("\n")));

  // 4. 音楽ファイル書き込み(拡張子で形式判定)
  const t = musicFile.type;
  const name = (musicFile as File).name || "";
  const audioExt =
    t.includes("mp4") || t.includes("m4a") || /\.m4a$/i.test(name) ? "m4a"
    : t.includes("wav") || /\.wav$/i.test(name) ? "wav"
    : "mp3";
  await ffmpeg.writeFile(`bgm.${audioExt}`, await fetchFile(musicFile));
  console.log("音楽準備完了:", musicFile.type, musicFile.size, "bytes (.", audioExt, ")");

  // 5. エンコード(動画+音楽合成、動画の長さに合わせる)
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "list.txt",
    "-i", `bgm.${audioExt}`,
    "-map", "0:v",
    "-map", "1:a",
    "-vsync", "vfr",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-vf", "fps=30,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black",
    "-shortest",
    "out.mp4",
  ]);

  const data = await ffmpeg.readFile("out.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  return URL.createObjectURL(blob);
}

// ───────── 実験:写真+動画クリップを音声なしで連結できるか検証(段階6-1) ─────────
// 各クリップを 1280x720 / 30fps / libx264 に正規化してから concat する。
// images: 写真Blob[]、videos: 動画Blob[] を、写真→動画 の順に1本へ繋ぐ最小テスト。
export async function testConcatPhotosAndVideos(
  images: Blob[],
  videos: Blob[],
  secondsPerImage = 2
): Promise<string> {
  const ffmpeg = await loadFFmpeg();
  const parts: string[] = [];
  let idx = 0;

  // 1. 写真 → 無音の正規化mp4 に変換
  for (const img of images) {
    const prepared = await convertIfHeic(img);
    const inName = `pin${idx}.jpg`;
    const outName = `seg${idx}.mp4`;
    await ffmpeg.writeFile(inName, await fetchFile(prepared));
    await ffmpeg.exec([
      "-loop", "1",
      "-i", inName,
      "-t", String(secondsPerImage),
      "-r", "30",
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
      "-c:v", "libx264",
      "-an",
      outName,
    ]);
    parts.push(outName);
    idx++;
    console.log("写真セグメント完了:", outName);
  }

  // 2. 動画 → 同じ規格に正規化(音声は一旦なし)
  for (const vid of videos) {
    const inName = `vin${idx}.mp4`;
    const outName = `seg${idx}.mp4`;
    await ffmpeg.writeFile(inName, await fetchFile(vid));
    await ffmpeg.exec([
      "-i", inName,
      "-r", "30",
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
      "-c:v", "libx264",
      "-an",
      outName,
    ]);
    parts.push(outName);
    idx++;
    console.log("動画セグメント完了:", outName);
  }

  // 3. concat リスト作成
  const listLines = parts.map((p) => `file '${p}'`);
  await ffmpeg.writeFile("concatlist.txt", new TextEncoder().encode(listLines.join("\n")));

  // 4. 連結(再エンコードなしでコピー連結)
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "concatlist.txt",
    "-c", "copy",
    "concat_out.mp4",
  ]);

  const data = await ffmpeg.readFile("concat_out.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  console.log("連結完了:", blob.size, "bytes");
  return URL.createObjectURL(blob);
}

// ───────── 実験:写真+動画を連結し、BGMを乗せる(段階6-2、動画の音はまだ無視) ─────────
export async function testConcatWithMusic(
  images: Blob[],
  videos: Blob[],
  musicFile: Blob,
  secondsPerImage = 2
): Promise<string> {
  const ffmpeg = await loadFFmpeg();
  const parts: string[] = [];
  let idx = 0;

  // 1. 写真 → 無音の正規化mp4
  for (const img of images) {
    const prepared = await convertIfHeic(img);
    const inName = `pin${idx}.jpg`;
    const outName = `seg${idx}.mp4`;
    await ffmpeg.writeFile(inName, await fetchFile(prepared));
    await ffmpeg.exec([
      "-loop", "1",
      "-i", inName,
      "-t", String(secondsPerImage),
      "-r", "30",
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
      "-c:v", "libx264",
      "-an",
      outName,
    ]);
    parts.push(outName);
    idx++;
  }

  // 2. 動画 → 同じ規格に正規化(音声なし)
  for (const vid of videos) {
    const inName = `vin${idx}.mp4`;
    const outName = `seg${idx}.mp4`;
    await ffmpeg.writeFile(inName, await fetchFile(vid));
    await ffmpeg.exec([
      "-i", inName,
      "-r", "30",
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
      "-c:v", "libx264",
      "-an",
      outName,
    ]);
    parts.push(outName);
    idx++;
  }

  // 3. concat リスト
  const listLines = parts.map((p) => `file '${p}'`);
  await ffmpeg.writeFile("concatlist.txt", new TextEncoder().encode(listLines.join("\n")));

  // 4. 映像だけ連結(無音)
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "concatlist.txt",
    "-c", "copy",
    "merged_video.mp4",
  ]);

  // 5. BGM を書き込み(拡張子判定)
  const t = musicFile.type;
  const name = (musicFile as File).name || "";
  const audioExt =
    t.includes("mp4") || t.includes("m4a") || /\.m4a$/i.test(name) ? "m4a"
    : t.includes("wav") || /\.wav$/i.test(name) ? "wav"
    : "mp3";
  await ffmpeg.writeFile(`bgm.${audioExt}`, await fetchFile(musicFile));

  // 6. 連結映像 + BGM を合成(映像の長さに合わせる)
  await ffmpeg.exec([
    "-i", "merged_video.mp4",
    "-i", `bgm.${audioExt}`,
    "-map", "0:v",
    "-map", "1:a",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "final_out.mp4",
  ]);

  const data = await ffmpeg.readFile("final_out.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  console.log("BGM付き連結完了:", blob.size, "bytes");
  return URL.createObjectURL(blob);
}

// ───────── 本番用:写真+動画を撮影日時順に1本へ合成(BGM付き、動画の音は当面なし) ─────────
// items: { blob, isVideo } の配列(呼び出し側で takenAt 順に並べて渡す)
// HEVC等で変換に失敗した動画はスキップし、残りで続行する。
export type MixedItem = { blob: Blob; isVideo: boolean; takenAt?: string; caption?: { jp?: string; en?: string } | string; spot?: string };

// ───────── テキストオーバーレイPNG生成(Kinfolkトーン:明朝・白文字・薄い影) ─────────
// 1280x720 の透明キャンバスにテキストを描き、PNG(Uint8Array)で返す。
// 文字が無い(空文字)の場合は null を返す。
async function makeTextOverlayPNG(
  text: string,
  caption?: { jp?: string; en?: string } | string,
  spot?: string
): Promise<Uint8Array | null> {
  const cap =
    typeof caption === "string" ? { jp: caption, en: undefined } : caption || {};
  const jp = cap.jp?.trim() || "";
  const en = cap.en?.trim() || "";
  const spotName = spot?.trim() || "";
  if (!text && !jp && !en && !spotName) return null;

  const W = 1280, H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const MX = 64;
  const MB = 72;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  // キャプション(jp/en):画面下・中央寄せに流す
  if (jp || en) {
    ctx.textAlign = "center";
    const cx = W / 2;
    let cy = H - MB;
    if (jp) {
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 12;
      ctx.font = "300 56px 'Noto Serif JP', 'Yu Mincho', serif";
      ctx.fillStyle = "rgba(247,243,234,0.96)";
      ctx.fillText(jp, cx, cy);
      cy -= 34;
    }
    if (en) {
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(201,168,106,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 6);
      ctx.lineTo(cx + 28, cy - 6);
      ctx.stroke();
      cy -= 22;
      ctx.shadowColor = "rgba(0,0,0,0.40)";
      ctx.font = "300 26px 'Cormorant Garamond', 'Noto Serif JP', serif";
      ctx.fillStyle = "rgba(201,168,106,0.92)";
      const spaced = en.split("").join(" ");
      ctx.fillText(spaced, cx, cy);
    }
  }
  // スポット名 + 日付:右下に固定
  ctx.textAlign = "right";
  let ry = H - MB;
  if (text) {
    ctx.shadowColor = "rgba(0,0,0,0.40)";
    ctx.shadowBlur = 10;
    ctx.font = "italic 24px 'Noto Serif JP', 'Yu Mincho', serif";
    ctx.fillStyle = "rgba(247,243,234,0.78)";
    ctx.fillText(text, W - MX, ry);
    ry -= 34;
  }
  if (spotName) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 10;
    ctx.font = "300 30px 'Noto Serif JP', 'Yu Mincho', serif";
    ctx.fillStyle = "rgba(247,243,234,0.92)";
    ctx.fillText(spotName, W - MX, ry);
  }
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/png")
  );
  const buf = new Uint8Array(await blob.arrayBuffer());
  return buf;
}

// ───────── 表紙カットPNG生成(Kinfolkトーン:ベージュ背景・セリフ体タイトル) ─────────
// 1280x720 のベージュ背景にタイトルを中央配置して PNG Blob で返す。
export async function makeCoverPNG(title: string): Promise<Blob | null> {
  if (!title) return null;
  const W = 1280, H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 背景:ウォームベージュ
  ctx.fillStyle = "#ECE5D8";
  ctx.fillRect(0, 0, W, H);

  // 上の小さなブランド行
  ctx.fillStyle = "#8B7355";
  ctx.font = "300 18px 'Cormorant Garamond', 'Noto Serif JP', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("— T A B I   N O T E —", W / 2, H / 2 - 110);

  // タイトル(長い場合は縮小)
  let size = 72;
  ctx.font = `300 ${size}px 'Cormorant Garamond', 'Noto Serif JP', serif`;
  while (ctx.measureText(title).width > W - 200 && size > 28) {
    size -= 4;
    ctx.font = `300 ${size}px 'Cormorant Garamond', 'Noto Serif JP', serif`;
  }
  ctx.fillStyle = "#3A2F1F";
  ctx.fillText(title, W / 2, H / 2);

  // 下の細い区切り線
  ctx.strokeStyle = "rgba(58, 47, 31, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 80, H / 2 + 90);
  ctx.lineTo(W / 2 + 80, H / 2 + 90);
  ctx.stroke();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95)
  );
  return blob;
}

// takenAt(ISO文字列)を "28 Jun · 18:42" 形式へ。timezone があれば現地時間で。
function formatStamp(takenAt?: string, timezone?: string): string {
  if (!takenAt) return "";
  const d = new Date(takenAt);
  if (isNaN(d.getTime())) return "";
  try {
    const opt: Intl.DateTimeFormatOptions = {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      hour12: false, timeZone: timezone || undefined,
    };
    const parts = new Intl.DateTimeFormat("en-GB", opt).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    return `${get("day")} ${get("month")} · ${get("hour")}:${get("minute")}`;
  } catch {
    return "";
  }
}

export async function makeMixedMovie(
  items: MixedItem[],
  musicFile: Blob | null,
  secondsPerImage = 2
): Promise<{ url: string; skipped: number }> {
  if (items.length === 0) throw new Error("素材が0個です");
  const ffmpeg = await loadFFmpeg();
  const parts: string[] = [];
  let idx = 0;
  let skipped = 0;

  for (const item of items) {
    const outName = `seg${idx}.mp4`;
    try {
      if (item.isVideo) {
        const inName = `vin${idx}.mp4`;
        await ffmpeg.writeFile(inName, await fetchFile(item.blob));
        await ffmpeg.exec([
          "-i", inName,
          "-r", "30",
          "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
          "-c:v", "libx264",
          "-an",
          outName,
        ]);
      } else {
        const prepared = await convertIfHeic(item.blob);
        const inName = `pin${idx}.jpg`;
        await ffmpeg.writeFile(inName, await fetchFile(prepared));
        await ffmpeg.exec([
          "-loop", "1",
          "-i", inName,
          "-t", String(secondsPerImage),
          "-r", "30",
          "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
          "-c:v", "libx264",
          "-an",
          outName,
        ]);
      }
      parts.push(outName);
      idx++;
    } catch (e) {
      console.warn("素材スキップ(変換失敗、HEVC等の可能性):", e);
      skipped++;
      idx++;
    }
  }

  if (parts.length === 0) throw new Error("使える素材がありませんでした（動画がすべて非対応コーデックの可能性）");

  // 連結
  const listLines = parts.map((p) => `file '${p}'`);
  await ffmpeg.writeFile("mixlist.txt", new TextEncoder().encode(listLines.join("\n")));
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "mixlist.txt",
    "-c", "copy",
    "mixed_video.mp4",
  ]);

  // BGM が無ければ無音のまま返す
  if (!musicFile) {
    const data = await ffmpeg.readFile("mixed_video.mp4");
    const blob = new Blob([data], { type: "video/mp4" });
    return { url: URL.createObjectURL(blob), skipped };
  }

  // BGM を乗せる
  const t = musicFile.type;
  const name = (musicFile as File).name || "";
  const audioExt =
    t.includes("mp4") || t.includes("m4a") || /\.m4a$/i.test(name) ? "m4a"
    : t.includes("wav") || /\.wav$/i.test(name) ? "wav"
    : "mp3";
  await ffmpeg.writeFile(`bgm.${audioExt}`, await fetchFile(musicFile));
  await ffmpeg.exec([
    "-i", "mixed_video.mp4",
    "-i", `bgm.${audioExt}`,
    "-map", "0:v",
    "-map", "1:a",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "mixed_final.mp4",
  ]);
  const data = await ffmpeg.readFile("mixed_final.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  console.log("合成完了:", blob.size, "bytes / スキップ:", skipped);
  return { url: URL.createObjectURL(blob), skipped };
}

// ───────── 実験:動画の声を残しBGMをダッキングして混ぜる(段階6-3) ─────────
// 各クリップを正規化(写真=無音, 動画=音声付き)→ 連結 → 連結音声(動画の声)とBGMをamixで合成。
// bgmVolume: BGMの基準音量(0.0〜1.0)。動画区間では動画の声が乗るので相対的にBGMが小さく感じる。
export async function testDuckingMix(
  items: MixedItem[],
  musicFile: Blob,
  secondsPerImage = 2,
  bgmVolume = 0.25
): Promise<{ url: string; skipped: number }> {
  if (items.length === 0) throw new Error("素材が0個です");
  if (!musicFile) throw new Error("音楽がありません");
  const ffmpeg = await loadFFmpeg();
  const parts: string[] = [];
  let idx = 0;
  let skipped = 0;

  for (const item of items) {
    const outName = `dseg${idx}.mp4`;
    try {
      if (item.isVideo) {
        const inName = `dvin${idx}.mp4`;
        await ffmpeg.writeFile(inName, await fetchFile(item.blob));
        // 動画:映像正規化 + 音声をAACで残す。音声が無い動画でも無音トラックを付ける
        await ffmpeg.exec([
          "-i", inName,
          "-f", "lavfi", "-t", "0.1", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
          "-map", "0:v:0",
          "-map", "0:a:0?",
          "-r", "30",
          "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
          "-c:v", "libx264",
          "-c:a", "aac", "-ar", "48000", "-ac", "2",
          "-shortest",
          outName,
        ]);
      } else {
        const prepared = await convertIfHeic(item.blob);
        const inName = `dpin${idx}.jpg`;
        await ffmpeg.writeFile(inName, await fetchFile(prepared));
        // 写真:無音トラックを付けて正規化(音声トラックを揃えるため)
        await ffmpeg.exec([
          "-loop", "1",
          "-i", inName,
          "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
          "-t", String(secondsPerImage),
          "-r", "30",
          "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
          "-c:v", "libx264",
          "-c:a", "aac", "-ar", "48000", "-ac", "2",
          "-shortest",
          outName,
        ]);
      }
      parts.push(outName);
      idx++;
    } catch (e) {
      console.warn("素材スキップ:", e);
      skipped++;
      idx++;
    }
  }
  if (parts.length === 0) throw new Error("使える素材がありませんでした");

  // 連結(映像も音声も持つクリップを繋ぐので再エンコード連結)
  const listLines = parts.map((p) => `file '${p}'`);
  await ffmpeg.writeFile("dlist.txt", new TextEncoder().encode(listLines.join("\n")));
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "dlist.txt",
    "-c:v", "copy",
    "-c:a", "aac",
    "dmerged.mp4",
  ]);

  // BGM 書き込み
  const t = musicFile.type;
  const name = (musicFile as File).name || "";
  const audioExt =
    t.includes("mp4") || t.includes("m4a") || /\.m4a$/i.test(name) ? "m4a"
    : t.includes("wav") || /\.wav$/i.test(name) ? "wav"
    : "mp3";
  await ffmpeg.writeFile(`dbgm.${audioExt}`, await fetchFile(musicFile));

  // 連結映像の音声(動画の声) と BGM を混ぜる。
  // [0:a]=動画の声(そのまま) / [1:a]=BGM(volumeで下げる) を amix。動画の声が入る区間でBGMが相対的に小さくなる。
  await ffmpeg.exec([
    "-i", "dmerged.mp4",
    "-i", `dbgm.${audioExt}`,
    "-filter_complex",
    `[1:a]volume=${bgmVolume}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[aout]`,
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "dducked.mp4",
  ]);

  const data = await ffmpeg.readFile("dducked.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  console.log("ダッキング合成完了:", blob.size, "bytes / スキップ:", skipped);
  return { url: URL.createObjectURL(blob), skipped };
}

// ───────── 切り分け用:動画1本のみ、声+BGMミックス(連結なし) ─────────
export async function testDuckSingle(
  videoBlob: Blob,
  musicFile: Blob,
  bgmVolume = 0.12
): Promise<string> {
  const ffmpeg = await loadFFmpeg();
  await ffmpeg.writeFile("sv.mp4", await fetchFile(videoBlob));
  const t = musicFile.type;
  const name = (musicFile as File).name || "";
  const audioExt =
    t.includes("mp4") || t.includes("m4a") || /\.m4a$/i.test(name) ? "m4a"
    : t.includes("wav") || /\.wav$/i.test(name) ? "wav"
    : "mp3";
  await ffmpeg.writeFile(`sbgm.${audioExt}`, await fetchFile(musicFile));
  // 動画の声(0:a)を1.5倍に持ち上げ、BGM(1:a)を大きく下げる。
  // amix の normalize=0 で自動音量調整を切り、各音量をそのまま保つ。
  await ffmpeg.exec([
    "-i", "sv.mp4",
    "-i", `sbgm.${audioExt}`,
    "-filter_complex",
    `[0:a]volume=1.5[voice];[1:a]volume=${bgmVolume}[bg];[voice][bg]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`,
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "libx264",
    "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    "ssingle.mp4",
  ]);
  const data = await ffmpeg.readFile("ssingle.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  console.log("単体ダッキング完了:", blob.size, "bytes");
  return URL.createObjectURL(blob);
}

// ───────── 本番:写真+動画を連結し、動画の声を出しつつBGMをダッキング(段階6-3完成版) ─────────
// 写真=無音, 動画=音声付き で正規化 → 連結 → 連結音声(動画の声)1.5倍 と BGM(bgmVolume倍)を normalize=0 で混ぜる。
// 「文字だけがふわっと浮かび上がる」1カットを作る。
// 同じ写真の【文字なし】と【文字あり】を作り、xfadeで繋ぐ。写真は同じなので文字だけが出現して見える。
async function makeCaptionXfadeSeg(
  ffmpeg: any,
  inName: string,          // 写真ファイル名（書き込み済み）
  txtName: string,         // キャプションPNGファイル名（書き込み済み）
  outName: string,         // 出力seg名
  secondsPerImage: number,
  idx: number,
): Promise<void> {
  const zpFrames = Math.max(1, Math.round(secondsPerImage * 30));
  const XF = 2.4;                                              // 文字が浮かび上がる時間（長め＝ゆっくり）
  const HOLD = Math.max(0.4, Math.min(0.9, secondsPerImage * 0.18)); // 文字が出る前の間（短め＝早く出る）
  const padVf = "scale=2560:1440:force_original_aspect_ratio=decrease,pad=2560:1440:(ow-iw)/2:(oh-ih)/2:color=black";
  const zoomVf = `zoompan=z='min(1.08,1+0.08*on/${zpFrames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${zpFrames}:s=1280x720:fps=30,format=yuv420p`;
  const aDur = HOLD + XF;                                      // 文字なしパートの長さ
  const bDur = Math.max(XF + 0.3, secondsPerImage - HOLD + XF); // 文字ありパートの長さ
  // segA: 文字なし（頭に黒フェードイン）
  await ffmpeg.exec([
    "-loop", "1", "-i", inName,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-t", String(aDur), "-r", "30",
    "-vf", `${padVf},${zoomVf},fade=t=in:st=0:d=0.5`,
    "-c:v", "libx264", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-shortest",
    `xfA${idx}.mp4`,
  ]);
  // segB: 文字あり（末尾に黒フェードアウト）
  await ffmpeg.exec([
    "-loop", "1", "-i", inName,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-i", txtName,
    "-t", String(bDur), "-r", "30",
    "-filter_complex",
    `[0:v]${padVf},${zoomVf}[bg];[bg][2:v]overlay=0:0:format=auto,fade=t=out:st=${Math.max(0.3, bDur - 0.5)}:d=0.5[v]`,
    "-map", "[v]", "-map", "1:a",
    "-c:v", "libx264", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-shortest",
    `xfB${idx}.mp4`,
  ]);
  // xfade: 文字なし→文字ありを溶かす ＝ 文字だけがふわっと出現
  await ffmpeg.exec([
    "-i", `xfA${idx}.mp4`,
    "-i", `xfB${idx}.mp4`,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-filter_complex",
    `[0:v][1:v]xfade=transition=fade:duration=${XF}:offset=${HOLD}[v]`,
    "-map", "[v]", "-map", "2:a",
    "-c:v", "libx264", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-shortest",
    outName,
  ]);
}


export async function makeMixedMovieWithDucking(
  items: MixedItem[],
  musicFile: Blob | null,
  secondsPerImage = 4.5,
  bgmVolume = 0.12,
  onProgress?: (progress: number) => void,
  onPhase?: (label: string) => void,
  timezone?: string
): Promise<{ url: string; skipped: number }> {
  if (items.length === 0) throw new Error("素材が0個です");
  onPhase?.("素材を準備しています");

  // 全体進捗の正規化:exec1回ごとに 0→1 が来るので、全ステップ数で割って一方向に進める
  const totalSteps = items.length + (musicFile ? 2 : 1);
  let doneSteps = 0;
  const report = (execProgress: number) => {
    const overall = (doneSteps + Math.min(1, Math.max(0, execProgress))) / totalSteps;
    onProgress?.(Math.min(1, overall));
  };

  const ffmpeg = await loadFFmpeg(report);
  const parts: string[] = [];
  let idx = 0;
  let skipped = 0;

  for (const item of items) {
    const outName = `mdseg${idx}.mp4`;
    try {
      if (item.isVideo) {
        const inName = `mdvin${idx}.mp4`;
        await ffmpeg.writeFile(inName, await fetchFile(item.blob));
        const stampV = formatStamp(item.takenAt, timezone);
        const overlayPngV = await makeTextOverlayPNG(stampV, item.caption, item.spot);
        const vBase = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p,fade=t=in:st=0:d=0.5";
        if (overlayPngV) {
          const txtNameV = `mdvtxt${idx}.png`;
          await ffmpeg.writeFile(txtNameV, overlayPngV);
          const vScale = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p";
          await ffmpeg.exec([
            "-i", inName,
            "-loop", "1", "-i", txtNameV,
            "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-r", "30",
            "-filter_complex", `[0:v]${vScale},fade=t=in:st=0:d=0.5[bg];[1:v]format=rgba,fade=t=in:st=0.8:d=1.2:alpha=1[txt];[bg][txt]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]`,
            "-map", "[v]", "-map", "0:a:0?", "-map", "2:a:0", "-shortest",
            "-c:v", "libx264", "-c:a", "aac", "-ar", "48000", "-ac", "2",
            outName,
          ]);
        } else {
          await ffmpeg.exec([
            "-i", inName,
            "-f", "lavfi", "-t", "0.1", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-map", "0:v:0",
            "-map", "0:a:0?",
            "-r", "30",
            "-vf", vBase,
            "-c:v", "libx264",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            "-shortest",
            outName,
          ]);
        }
      } else {
        const prepared = await convertIfHeic(item.blob);
        const inName = `mdpin${idx}.jpg`;
        await ffmpeg.writeFile(inName, await fetchFile(prepared));

        // 日付スタンプのテキストPNGを用意(takenAt があれば)
        const stamp = formatStamp(item.takenAt, timezone);
        const overlayPng = await makeTextOverlayPNG(stamp, item.caption, item.spot);
        const zpFrames = Math.max(1, Math.round(secondsPerImage * 30));
        const baseVf = `scale=2560:1440:force_original_aspect_ratio=decrease,pad=2560:1440:(ow-iw)/2:(oh-ih)/2:color=black,zoompan=z='min(1.08,1+0.08*on/${zpFrames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${zpFrames}:s=1280x720:fps=30,format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st=${Math.max(0.6, secondsPerImage - 0.5)}:d=0.5`;

        if (overlayPng) {
          const txtName = `mdtxt${idx}.png`;
          await ffmpeg.writeFile(txtName, overlayPng);
          await ffmpeg.exec([
            "-loop", "1", "-i", inName,
            "-loop", "1", "-i", txtName,
            "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-t", String(secondsPerImage),
            "-r", "30",
            "-filter_complex", `[0:v]${baseVf}[bg];[1:v]format=rgba,fade=t=in:st=0.8:d=1.2:alpha=1,fade=t=out:st=${Math.max(0.6, secondsPerImage - 0.5)}:d=0.5:alpha=1[txt];[bg][txt]overlay=0:0:format=auto,format=yuv420p[v]`,
            "-map", "[v]", "-map", "2:a:0",
            "-c:v", "libx264",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            "-shortest",
            outName,
          ]);
        } else {
          await ffmpeg.exec([
            "-loop", "1",
            "-i", inName,
            "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-t", String(secondsPerImage),
            "-r", "30",
            "-vf", baseVf,
            "-c:v", "libx264",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            "-shortest",
            outName,
          ]);
        }
      }
      parts.push(outName);
      doneSteps++;
      idx++;
    } catch (e) {
      console.warn("素材スキップ:", e);
      doneSteps++;
      skipped++;
      idx++;
    }
  }
  if (parts.length === 0) throw new Error("使える素材がありませんでした");

  // 連結(映像コピー、音声はAAC再エンコードで揃える)
  onPhase?.("つなぎ合わせています");
  const listLines = parts.map((p) => `file '${p}'`);
  await ffmpeg.writeFile("mdlist.txt", new TextEncoder().encode(listLines.join("\n")));
  await ffmpeg.exec([
    "-f", "concat", "-safe", "0",
    "-i", "mdlist.txt",
    "-r", "30",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "mdmerged.mp4",
  ]);
  doneSteps++;

  // BGMが無ければ、連結した(動画の声入り)動画をそのまま返す
  if (!musicFile) {
    const data = await ffmpeg.readFile("mdmerged.mp4");
    const blob = new Blob([data], { type: "video/mp4" });
    onProgress?.(1);
    return { url: URL.createObjectURL(blob), skipped };
  }

  // BGM書き込み
  const t = musicFile.type;
  const name = (musicFile as File).name || "";
  const audioExt =
    t.includes("mp4") || t.includes("m4a") || /\.m4a$/i.test(name) ? "m4a"
    : t.includes("wav") || /\.wav$/i.test(name) ? "wav"
    : "mp3";
  await ffmpeg.writeFile(`mdbgm.${audioExt}`, await fetchFile(musicFile));

  // 連結音声(動画の声)を1.5倍、BGMをbgmVolume倍、normalize=0 で混ぜる
  onPhase?.("仕上げています");
  await ffmpeg.exec([
    "-i", "mdmerged.mp4",
    "-i", `mdbgm.${audioExt}`,
    "-filter_complex",
    `[0:a]volume=1.5[voice];[1:a]volume=${bgmVolume}[bg];[voice][bg]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`,
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "mdfinal.mp4",
  ]);
  doneSteps++;

  const data = await ffmpeg.readFile("mdfinal.mp4");
  const blob = new Blob([data], { type: "video/mp4" });
  onProgress?.(1);
  console.log("ダッキング本番合成完了:", blob.size, "bytes / スキップ:", skipped);
  return { url: URL.createObjectURL(blob), skipped };
}
