// src/movie/MovieMaker.tsx
import { useState, useRef, useEffect, type ChangeEvent, type CSSProperties } from "react";
import {
  makeSlideshowWithMusic,
  makeSlideshowFromBlobs,
  makeMixedMovie,
  makeMixedMovieWithDucking,
  makeCoverPNG,
  downloadVideo,
} from "./ffmpegTest";
import { usePhotosStore } from "../lib/photos-store";
import { useSpotsStore } from "../lib/spots-store";
import { useMusicStore } from "../lib/music-store";
import { useMoviesStore } from "../lib/movies-store";
import type { Photo, MusicTrack } from "../lib/types";

type Step = "source" | "appPhotos" | "music" | "generating" | "done" | "error";

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
  tripId,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
}) {
  const [step, setStep] = useState<Step>("source");
  const [photos, setPhotos] = useState<File[]>([]);
  const [music, setMusic] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [captions, setCaptions] = useState<Record<number, { jp?: string; en?: string }>>({});
  const [spotNames, setSpotNames] = useState<Record<number, string>>({});

  const photoInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);

  // 写真ボックス(全写真のうち、この旅行ぶん)
  const loadPhotos = usePhotosStore((s) => s.loadPhotos);
  const loadSpots = useSpotsStore((s) => s.loadSpots);
  const spots = useSpotsStore((s) => s.spots);
  const allPhotos = usePhotosStore((s) => s.photos);
  const boxPhotos = allPhotos.filter((p) => p.tripId === tripId);

  // 保存済みの音楽
  const loadTracks = useMusicStore((s) => s.loadTracks);
  const addTrack = useMusicStore((s) => s.addTrack);
  const removeTrack = useMusicStore((s) => s.removeTrack);
  const tracks = useMusicStore((s) => s.tracks);

  // アプリ内ムービー保存
  const addMovie = useMoviesStore((s) => s.addMovie);

  useEffect(() => {
    if (open && tripId) { loadPhotos(tripId); loadSpots(tripId); }
    if (open) loadTracks();
  }, [open, tripId, loadPhotos, loadSpots, loadTracks]);

  if (!open) return null;

  const reset = () => {
    setStep("source"); setPhotos([]); setMusic(null);
    setVideoUrl(""); setErrorMsg(""); setSelectedIds([]); setSaveState("idle");
  };
  const close = () => { reset(); onClose(); };

  // 生成したムービーをアプリに保存
  const saveToApp = async () => {
    if (!videoUrl) return;
    setSaveState("saving");
    try {
      const blob = await fetch(videoUrl).then((r) => r.blob());
      await addMovie(tripId, blob);
      setSaveState("saved");
    } catch (err) {
      console.error("ムービーの保存に失敗:", err);
      setSaveState("idle");
    }
  };

  // ファイルから写真を選ぶ
  const pickPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setPhotos(files);
      setStep("music");
    }
  };

  // 音楽ファイルを選ぶ → 自動で保存
  const pickMusic = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusic(file);
    try {
      await addTrack(file); // IndexedDB に保存(次回から一覧に出る)
    } catch (err) {
      console.error("音楽の保存に失敗:", err);
    }
    if (musicInput.current) musicInput.current.value = "";
  };

  // 保存済みの曲を選ぶ
  const chooseSavedTrack = (t: MusicTrack) => {
    const file = new File([t.blob], t.name, { type: t.blob.type || "audio/mpeg" });
    setMusic(file);
  };

  // アプリの写真:選択トグル
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // アプリの写真:選択確定 → File[] に変換して music へ
  const confirmAppPhotos = () => {
    const chosen = boxPhotos.filter((p) => selectedIds.includes(p.id));
    chosen.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    const files = chosen.map((p) => {
      const file = new File([p.blob], p.filename || `${p.id}.jpg`, { type: p.blob.type || "image/jpeg" });
      (file as any).takenAt = p.takenAt;
      return file;
    });
    setPhotos(files);
    setStep("music");
  };

  const generate = async (withMusic: boolean) => {
    setStep("generating");
    setProgress(0);
    setProgressLabel("");
    setErrorMsg("");
    try {
      const items: { blob: Blob; isVideo: boolean; takenAt?: string; caption?: { jp?: string; en?: string }; spot?: string }[] = photos.map((f, i) => ({ blob: f as Blob, isVideo: f.type.startsWith("video/"), takenAt: (f as any).takenAt as string | undefined, caption: captions[i], spot: spotNames[i]?.trim() || undefined }));
      if (movieTitle.trim()) {
        const cover = await makeCoverPNG(movieTitle.trim());
        if (cover) items.unshift({ blob: cover, isVideo: false });
      }
      const result = await makeMixedMovieWithDucking(
        items,
        withMusic && music ? music : null,
        2,
        0.12,
        (p) => setProgress(Math.max(0, Math.min(100, Math.round(p * 100)))),
        (label) => setProgressLabel(label)
      );
      setVideoUrl(result.url);
      if (result.skipped > 0) {
        console.warn(result.skipped + "件の動画は対応していない形式のためスキップしました");
      }
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

        {(step === "source" || step === "appPhotos" || step === "music") && (
          <div style={S.dots}>
            {[0, 1, 2].map((i) => {
              const cur = step === "music" ? 1 : 0;
              return (
                <span key={i} style={{ ...S.dot, background: i <= cur ? C.accent : C.line }} />
              );
            })}
          </div>
        )}

        {/* ───── ステップ1:写真ソースの選択 ───── */}
        {step === "source" && (
          <div>
            <div style={S.lead}>ステップ 1 — 写真を選ぶ</div>

            <button
              style={S.outlineBtn}
              onClick={() => { setSelectedIds([]); setStep("appPhotos"); }}
            >
              ＋ アプリの写真から選ぶ（{boxPhotos.length}）
            </button>

            <input ref={photoInput} type="file" accept="image/*,.heic,.heif"
              multiple style={{ display: "none" }} onChange={pickPhotos} />
            <button style={S.outlineBtn} onClick={() => photoInput.current?.click()}>
              ＋ ファイルから選ぶ
            </button>

            <div style={S.hint}>
              「アプリの写真」は、写真ボックスに保存した写真から選べます。<br />
              「ファイル」は、スマホやPC内の写真を直接選べます。
            </div>
          </div>
        )}

        {/* ───── ステップ1b:アプリの写真グリッド ───── */}
        {step === "appPhotos" && (
          <div>
            <div style={S.lead}>写真を選ぶ（タップで選択）</div>

            {boxPhotos.length === 0 ? (
              <div style={S.hint}>
                写真ボックスにまだ写真がありません。<br />
                先に Memories で写真を追加するか、「ファイルから選ぶ」をお使いください。
              </div>
            ) : (
              <div style={S.grid}>
                {boxPhotos.map((p) => (
                  <PhotoThumb
                    key={p.id}
                    photo={p}
                    selected={selectedIds.includes(p.id)}
                    order={selectedIds.indexOf(p.id)}
                    onClick={() => toggleSelect(p.id)}
                  />
                ))}
              </div>
            )}

            {selectedIds.length > 0 && (
              <div style={S.note}>{selectedIds.length} 枚を選択中</div>
            )}

            <button
              style={{ ...S.solidBtn, opacity: selectedIds.length ? 1 : 0.35 }}
              disabled={!selectedIds.length}
              onClick={confirmAppPhotos}
            >
              次へ —
            </button>
            <button style={S.textBtn} onClick={() => setStep("source")}>← 戻る</button>
          </div>
        )}

        {/* ───── ステップ2:音楽 ───── */}
        {step === "music" && (
          <div>
            <div style={S.lead}>ステップ 2 — 音楽を選ぶ</div>
            <div style={S.note}>{photos.length} 枚の写真でムービーを作ります</div>

            {/* 保存済みの曲 */}
            {tracks.length > 0 && (
              <div style={{ marginTop: 18, marginBottom: 8 }}>
                <div style={S.sitesLabel}>— 保存した音楽から選ぶ</div>
                <div style={S.trackList}>
                  {tracks.map((t) => {
                    const isSel = music?.name === t.name;
                    return (
                      <div key={t.id} style={{ ...S.trackRow, ...(isSel ? S.trackRowSel : {}) }}>
                        <button style={S.trackName} onClick={() => chooseSavedTrack(t)}>
                          {isSel ? "♪ " : ""}{t.name}
                        </button>
                        <button style={S.trackDel} onClick={() => removeTrack(t.id)} title="削除">×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <input ref={musicInput} type="file" accept="audio/*"
              style={{ display: "none" }} onChange={pickMusic} />
            <button style={S.outlineBtn} onClick={() => musicInput.current?.click()}>
              ＋ 音楽ファイルを選ぶ（新しく読み込む）
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
              一度読み込んだ曲は保存され、次回から上の一覧で選べます。
            </div>

            <div style={S.sitesLabel}>— オープニングタイトル(任意)</div>
            <input
              type="text"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              placeholder="例:Đà Nẵng 2026(空欄なら表紙なし)"
              style={{
                width: "100%", padding: "12px 14px", marginTop: 6,
                background: "rgba(255,255,255,0.5)", border: "1px solid rgba(58,47,31,0.2)",
                fontFamily: "'Noto Serif JP', serif", fontWeight: 300, fontSize: 14,
                color: "#3A2F1F", letterSpacing: "0.05em", outline: "none", borderRadius: 2,
                boxSizing: "border-box",
              }}
            />
            <div style={S.sitesLabel}>— キャプション(任意)</div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300, fontSize: 11, color: "#8B7355", letterSpacing: "0.05em", marginTop: 4, lineHeight: 1.7 }}>
              写真ごとに一言を添えられます(空欄なら日付だけ)。
            </div>
            {photos.map((f, i) => {
              if (f.type.startsWith("video/")) return null;
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: 52, height: 52, objectFit: "cover", flexShrink: 0, borderRadius: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input type="text" value={captions[i]?.jp || ""}
                      onChange={(e) => setCaptions((c) => ({ ...c, [i]: { ...c[i], jp: e.target.value } }))}
                      placeholder="例:海岸通りの夕暮れ"
                      style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(58,47,31,0.2)", fontFamily: "'Noto Serif JP', serif", fontWeight: 300, fontSize: 13, color: "#3A2F1F", letterSpacing: "0.05em", outline: "none", borderRadius: 2, boxSizing: "border-box" }} />
                    <input type="text" value={captions[i]?.en || ""}
                      onChange={(e) => setCaptions((c) => ({ ...c, [i]: { ...c[i], en: e.target.value } }))}
                      placeholder="英字(任意) 例:evening glow"
                      style={{ width: "100%", padding: "6px 10px", marginTop: 4, background: "rgba(255,255,255,0.35)", border: "1px solid rgba(58,47,31,0.15)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "#8B7355", letterSpacing: "0.08em", outline: "none", borderRadius: 2, boxSizing: "border-box" }} />
                    {spots.length > 0 && (
                      <select value={spotNames[i] || ""} onChange={(e) => setSpotNames((c) => ({ ...c, [i]: e.target.value }))}
                        style={{ width: "100%", padding: "6px 8px", marginTop: 4, background: "rgba(255,255,255,0.35)", border: "1px solid rgba(58,47,31,0.15)", fontFamily: "'Noto Serif JP', serif", fontWeight: 300, fontSize: 11.5, color: "#8B7355", letterSpacing: "0.04em", outline: "none", borderRadius: 2, boxSizing: "border-box" }}>
                        <option value="">— スポットから選ぶ</option>
                        {spots.map((sp) => (<option key={sp.id} value={sp.name}>{sp.name}{sp.nameLocal ? ` / ${sp.nameLocal}` : ""}</option>))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
            <button style={{ ...S.solidBtn, opacity: music ? 1 : 0.35 }}
              disabled={!music} onClick={() => generate(true)}>
              ムービーを作成 —
            </button>
            <button style={S.textBtn} onClick={() => generate(false)}>音楽なしで作る</button>
            <button style={S.textBtn} onClick={() => setStep("source")}>← 写真を選び直す</button>
          </div>
        )}

        {step === "generating" && (
          <div style={S.center}>
            <div style={{ ...S.ornament, animation: "tn-pulse 1.6s ease-in-out infinite" }}>· · ·</div>
            <div style={S.lead}>生成中…</div>
            {progressLabel && (
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 300, fontSize: 12, color: "#8B7355", letterSpacing: "0.08em", marginTop: 6 }}>{progressLabel}</div>
            )}
            <div style={{ width: "100%", maxWidth: 280, margin: "20px auto 8px" }}>
              <div style={{ height: 1, background: "rgba(58,47,31,0.15)", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: 1, width: progress + "%", background: "#8B7355", transition: "width 0.3s ease" }} />
              </div>
              <div style={{ textAlign: "right", marginTop: 8, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#8B7355", letterSpacing: "0.1em" }}>{progress}%</div>
            </div>
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
            <button
              style={{ ...S.outlineBtn, marginTop: 14, opacity: saveState === "saved" ? 0.5 : 1 }}
              disabled={saveState !== "idle"}
              onClick={saveToApp}
            >
              {saveState === "saving" ? "保存中…" : saveState === "saved" ? "✓ アプリに保存しました" : "＋ アプリに保存する"}
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

/* ───── サムネイル(アプリ写真選択用) ───── */
function PhotoThumb({
  photo, selected, order, onClick,
}: {
  photo: Photo; selected: boolean; order: number; onClick: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isVideo = photo.blob.type.startsWith('video/');
  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);
  return (
    <button onClick={onClick} style={{ ...S.thumb, ...(selected ? S.thumbSel : {}) }}>
      {url && (isVideo ? (
        <video src={`${url}#t=0.1`} style={S.thumbImg} muted playsInline preload="metadata" />
      ) : (
        <img src={url} alt={photo.filename} style={S.thumbImg} />
      ))}
      {isVideo && (
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "#fff", fontSize: 22, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>▶</span>
      )}
      {selected && <span style={S.thumbBadge}>{order + 1}</span>}
    </button>
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
  note: { fontFamily: FE, fontStyle: "italic", fontSize: 13, color: C.accent, marginBottom: 4, marginTop: 4 },
  sitesLabel: { fontFamily: FS, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase",
    color: C.sub, marginTop: 28, marginBottom: 12 },
  sites: { display: "flex", flexDirection: "column", gap: 10 },
  siteLink: { fontFamily: FJ, fontSize: 13, color: C.text, textDecoration: "none",
    borderBottom: `1px solid ${C.line}`, paddingBottom: 8 },
  hint: { fontFamily: FJ, fontWeight: 300, fontSize: 11.5, color: C.sub, lineHeight: 1.9, marginTop: 14 },
  center: { textAlign: "center", padding: "30px 0" },
  ornament: { fontFamily: FE, fontSize: 20, letterSpacing: "0.5em", color: C.secondary, marginBottom: 14 },
  video: { width: "100%", borderRadius: 2, marginTop: 6, background: "#000" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 4 },
  thumb: { position: "relative", aspectRatio: "1 / 1", padding: 0, border: "1px solid transparent",
    background: C.bgAlt, cursor: "pointer", overflow: "hidden" },
  thumbSel: { border: `2px solid ${C.accent}` },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbBadge: { position: "absolute", top: 4, right: 4, minWidth: 18, height: 18,
    background: C.accent, color: C.bg, borderRadius: "50%", fontFamily: FE, fontSize: 11,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
  trackList: { display: "flex", flexDirection: "column", gap: 8 },
  trackRow: { display: "flex", alignItems: "center", justifyContent: "space-between",
    border: `1px solid ${C.line}`, padding: "0 4px 0 12px" },
  trackRowSel: { border: `1px solid ${C.accent}`, background: C.bgAlt },
  trackName: { flex: 1, textAlign: "left", background: "transparent", border: "none",
    fontFamily: FJ, fontSize: 12.5, color: C.text, padding: "12px 0", cursor: "pointer" },
  trackDel: { background: "transparent", border: "none", color: C.sub, fontSize: 18,
    cursor: "pointer", padding: "8px 10px", lineHeight: 1 },
};
