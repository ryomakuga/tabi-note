// src/movie/MovieMaker.tsx
import { useState, useRef, type ChangeEvent, type CSSProperties } from "react";
import {
  makeSlideshowWithMusic,
  makeSlideshowFromBlobs,
  downloadVideo,
} from "./ffmpegTest";

type Step = "photos" | "music" | "generating" | "done" | "error";

const C = {
  bg: "#ECE5D8", bgAlt: "#F5EFE5", accent: "#8B7355",
  secondary: "#A8A293", gold: "#C49B5C", text: "#3A2F1F",
  sub: "#8B7355", line: "rgba(58,47,31,0.15)",
};
const FE = "'Cormorant Garamond', serif";
const FJ = "'Noto Serif JP', '游明朝', serif";
const FS = "'Inter', sans-serif";

const MUSIC_SITES = [
  { name: "DOVA-SYNDROME", url: "https://dova-s.jp/" },
  { name: "甘茶の音楽工房", url: "https://amachamusic.chagasi.com/" },
  { name: "MusMus", url: "https://musmus.main.jp/" },
];

export default function MovieMaker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("photos");
  const [photos, setPhotos] = useState<File[]>([]);
  const [music, setMusic] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const photoInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setStep("photos"); setPhotos([]); setMusic(null);
    setVideoUrl(""); setErrorMsg("");
  };
  const close = () => { reset(); onClose(); };

  const pickPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setPhotos(files);
  };
  const pickMusic = (e: ChangeEvent<HTMLInputElement>) => {
    setMusic(e.target.files?.[0] ?? null);
  };

  const generate = async (withMusic: boolean) => {
    setStep("generating");
    setErrorMsg("");
    try {
      // ※ HEIC変換は make 関数側で対応済みの想定。もし未対応なら後で convertIfHeic を挟みます。
      const result = (
        withMusic && music
          ? await makeSlideshowWithMusic(photos, music, 2)
          : await makeSlideshowFromBlobs(photos, 2)
      ) as unknown;
      // 戻り値が URL 文字列でも Blob でも動くよう両対応
      const url =
        typeof result === "string" ? result : URL.createObjectURL(result as Blob);
      setVideoUrl(url);
      setStep("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(String((err as Error)?.message ?? err));
      setStep("error");
    }
  };

  return (
    <div style={S.overlay}>
      <style>{`@keyframes tn-pulse{0%,100%{opacity:.25}50%{opacity:.9}}`}</style>
      <div style={S.sheet}>
        <div style={S.header}>
          <div style={S.brand}>Tabi Note</div>
          <div style={S.close} onClick={close}>×</div>
        </div>
        <div style={S.titleEn}>Make a Movie</div>
        <div style={S.titleJa}>旅のムービーを作る</div>

        {(step === "photos" || step === "music") && (
          <div style={S.dots}>
            {[0, 1, 2].map((i) => {
              const cur = step === "photos" ? 0 : 1;
              return (
                <span key={i} style={{ ...S.dot, background: i <= cur ? C.accent : C.line }} />
              );
            })}
          </div>
        )}

        {step === "photos" && (
          <div>
            <div style={S.lead}>ステップ 1 — 写真を選ぶ</div>
            <input ref={photoInput} type="file" accept="image/*,.heic,.heif"
              multiple style={{ display: "none" }} onChange={pickPhotos} />
            <button style={S.outlineBtn} onClick={() => photoInput.current?.click()}>
              ＋ 写真を選ぶ(複数可)
            </button>
            {photos.length > 0 && <div style={S.note}>{photos.length} 枚を選択中</div>}
            <button style={{ ...S.solidBtn, opacity: photos.length ? 1 : 0.35 }}
              disabled={!photos.length} onClick={() => setStep("music")}>
              次へ —
            </button>
          </div>
        )}

        {step === "music" && (
          <div>
            <div style={S.lead}>ステップ 2 — 音楽を選ぶ</div>
            <input ref={musicInput} type="file" accept="audio/*"
              style={{ display: "none" }} onChange={pickMusic} />
            <button style={S.outlineBtn} onClick={() => musicInput.current?.click()}>
              ＋ 音楽ファイルを選ぶ
            </button>
            {music && <div style={S.note}>♪ {music.name}</div>}

            <div style={S.sitesLabel}>— おすすめ音源サイト(無料)</div>
            <div style={S.sites}>
              {MUSIC_SITES.map((m) => (
                <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                  style={S.siteLink}>{m.name} ↗</a>
              ))}
            </div>
            <div style={S.hint}>
              気に入った曲をダウンロードして、上の「音楽ファイルを選ぶ」で読み込んでください。
            </div>

            <button style={{ ...S.solidBtn, opacity: music ? 1 : 0.35 }}
              disabled={!music} onClick={() => generate(true)}>
              ムービーを作成 —
            </button>
            <button style={S.textBtn} onClick={() => generate(false)}>音楽なしで作る</button>
            <button style={S.textBtn} onClick={() => setStep("photos")}>← 写真を選び直す</button>
          </div>
        )}

        {step === "generating" && (
          <div style={S.center}>
            <div style={{ ...S.ornament, animation: "tn-pulse 1.6s ease-in-out infinite" }}>· · ·</div>
            <div style={S.lead}>生成中…</div>
            <div style={S.hint}>
              ブラウザ内で動画を書き出しています。<br />
              枚数によっては少し時間がかかります。このまま閉じずにお待ちください。
            </div>
          </div>
        )}

        {step === "done" && (
          <div>
            <div style={S.lead}>できあがりました</div>
            <video src={videoUrl} controls playsInline style={S.video} />
            <button style={S.solidBtn} onClick={() => downloadVideo(videoUrl, "tabi-note-movie.mp4")}>
              ダウンロード —
            </button>
            <button style={S.textBtn} onClick={reset}>もう一度作る</button>
            <button style={S.textBtn} onClick={close}>閉じる</button>
          </div>
        )}

        {step === "error" && (
          <div>
            <div style={S.lead}>うまくいきませんでした</div>
            <div style={S.hint}>{errorMsg}</div>
            <button style={S.solidBtn} onClick={() => setStep("music")}>戻ってやり直す</button>
            <button style={S.textBtn} onClick={close}>閉じる</button>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: C.bg, zIndex: 1000,
    display: "flex", justifyContent: "center", overflowY: "auto" },
  sheet: { width: "100%", maxWidth: 420, padding: "48px 28px 60px", fontFamily: FJ, color: C.text },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: `1px solid ${C.line}`, paddingBottom: 16 },
  brand: { fontFamily: FE, fontSize: 11, letterSpacing: "0.45em", textTransform: "uppercase", color: C.accent },
  close: { fontSize: 24, color: C.sub, cursor: "pointer", lineHeight: 1 },
  titleEn: { fontFamily: FE, fontWeight: 300, fontSize: 34, marginTop: 28, letterSpacing: "0.01em" },
  titleJa: { fontFamily: FJ, fontSize: 14, color: C.sub, marginTop: 4, marginBottom: 28 },
  dots: { display: "flex", gap: 8, marginBottom: 28 },
  dot: { width: 28, height: 2, borderRadius: 1, display: "inline-block" },
  lead: { fontFamily: FJ, fontSize: 15, marginBottom: 18, letterSpacing: "0.05em" },
  outlineBtn: { width: "100%", padding: "14px 0", background: "transparent",
    border: `1px solid ${C.accent}`, color: C.text, fontFamily: FJ, fontSize: 13,
    letterSpacing: "0.1em", cursor: "pointer", marginBottom: 14 },
  solidBtn: { width: "100%", padding: "14px 0", background: C.text, border: `1px solid ${C.text}`,
    color: C.bg, fontFamily: FE, fontSize: 12, letterSpacing: "0.4em",
    textTransform: "uppercase", cursor: "pointer", marginTop: 20 },
  textBtn: { width: "100%", padding: "12px 0", background: "transparent", border: "none",
    color: C.sub, fontFamily: FJ, fontSize: 12, cursor: "pointer", marginTop: 8 },
  note: { fontFamily: FE, fontStyle: "italic", fontSize: 13, color: C.accent, marginBottom: 4 },
  sitesLabel: { fontFamily: FS, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase",
    color: C.sub, marginTop: 28, marginBottom: 12 },
  sites: { display: "flex", flexDirection: "column", gap: 10 },
  siteLink: { fontFamily: FJ, fontSize: 13, color: C.text, textDecoration: "none",
    borderBottom: `1px solid ${C.line}`, paddingBottom: 8 },
  hint: { fontFamily: FJ, fontWeight: 300, fontSize: 11.5, color: C.sub, lineHeight: 1.9, marginTop: 14 },
  center: { textAlign: "center", padding: "30px 0" },
  ornament: { fontFamily: FE, fontSize: 20, letterSpacing: "0.5em", color: C.secondary, marginBottom: 14 },
  video: { width: "100%", borderRadius: 2, marginTop: 6, background: "#000" },
};
