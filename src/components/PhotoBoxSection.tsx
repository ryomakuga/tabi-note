import { useEffect, useRef, useState } from 'react';
import { usePhotosStore } from '../lib/photos-store';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import MovieMaker from '../movie/MovieMaker';
import type { Photo } from '../lib/types';

interface Props {
  tripId: string;
}

export function PhotoBoxSection({ tripId }: Props) {
  const loadPhotos = usePhotosStore((s) => s.loadPhotos);
  const addPhotos = usePhotosStore((s) => s.addPhotos);
  const allPhotos = usePhotosStore((s) => s.photos);
  const photos = allPhotos.filter((p) => p.tripId === tripId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isMovieOpen, setIsMovieOpen] = useState(false);

  useEffect(() => {
    if (tripId) loadPhotos(tripId);
  }, [tripId, loadPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsAdding(true);
    try {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileArray.length > 0) {
        await addPhotos(tripId, fileArray);
      }
    } catch (err) {
      console.error('Failed to add photos:', err);
    } finally {
      setIsAdding(false);
      // 同じファイルを再選択できるようリセット
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const favCount = photos.filter((p) => p.isFavorite).length;
  const dayCount = countUniqueDays(photos);

  return (
    <>
      {/* メタ情報行(枚数 + add ボタン) */}
      <div className="flex justify-between items-center py-4 border-t border-line border-b border-line mb-6">
        <div className="font-serif italic text-[13px] text-text">
          <span className="text-[20px] text-accent mr-1">{photos.length}</span>
          <span>枚の写真</span>
          {dayCount > 0 && (
            <span className="ml-3 text-text-sub text-[11px]">
              · {dayCount} 日間
            </span>
          )}
          {favCount > 0 && (
            <span className="ml-2 text-text-sub text-[11px]">
              · {favCount} お気に入り
            </span>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAdding}
          className="font-serif italic text-[12px] text-accent tracking-[0.15em] disabled:opacity-40"
        >
          {isAdding ? '— adding…' : '+ add photos'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 写真グリッド or 空状態 */}
      {photos.length === 0 ? (
        <EmptyState onAdd={() => fileInputRef.current?.click()} />
      ) : (
        <>
          <PhotoGrid photos={photos.slice(0, 10)} onSelect={setSelectedPhoto} />

          {/* すべて見るボタン */}
          <div className="mt-7 pt-6 border-t border-line text-center">
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="inline-block border border-accent px-7 py-3 font-serif text-[10.5px] tracking-[0.4em] uppercase text-text hover:bg-accent hover:text-bg transition-colors"
            >
              — see all ({photos.length}) —
            </button>
            {photos.length > 10 && (
              <p className="font-serif italic text-[11px] text-text-sub mt-3 tracking-[0.1em]">
                {photos.length - 10} more photos in the gallery
              </p>
            )}

            {/* ムービー生成への動線 */}
            <button
              onClick={() => setIsMovieOpen(true)}
              className="block w-full mt-4 border border-text px-7 py-3.5 font-serif text-[10.5px] tracking-[0.4em] uppercase text-bg bg-text hover:bg-transparent hover:text-text transition-colors"
            >
              — Make a Movie —
            </button>
          </div>
        </>
      )}

      {/* 写真詳細モーダル */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* ギャラリー全画面オーバーレイ */}
      {isGalleryOpen && (
        <PhotoGalleryModal
          tripId={tripId}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      {/* ムービー生成オーバーレイ */}
      {isMovieOpen && (
        <MovieMaker open={isMovieOpen} onClose={() => setIsMovieOpen(false)} tripId={tripId} />
      )}
    </>
  );
}

/* ───────── 空状態 ───────── */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="font-serif italic text-[28px] text-gold mb-4 tracking-[0.3em]">— ◌ —</p>
      <p className="font-serif-ja text-[13px] text-text-sub leading-[1.8] mb-6">
        旅の写真を、ここに集めましょう。<br />
        撮影日順に自動で並びます。
      </p>
      <button
        onClick={onAdd}
        className="inline-block border border-accent px-6 py-3 font-serif text-[10.5px] tracking-[0.4em] uppercase text-text hover:bg-accent hover:text-bg transition-colors"
      >
        — Add photos —
      </button>
    </div>
  );
}

/* ───────── 写真グリッド(不均等レイアウト) ───────── */
function PhotoGrid({
  photos,
  onSelect,
}: {
  photos: Photo[];
  onSelect: (p: Photo) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-[6px]">
      {photos.map((p, i) => {
        // 雑誌風の不均等配置:7 枚に 1 枚を大きく(span-2x2)、3 枚に 1 枚を横長(span-2x1)
        const isLarge = i % 7 === 0;
        const isWide = !isLarge && i % 3 === 0;
        const className = isLarge
          ? 'col-span-2 row-span-2 aspect-square'
          : isWide
          ? 'col-span-2 aspect-[2/1]'
          : 'aspect-square';
        return <PhotoCell key={p.id} photo={p} className={className} onClick={() => onSelect(p)} />;
      })}
    </div>
  );
}

/* ───────── 個別セル ───────── */
function PhotoCell({
  photo,
  className,
  onClick,
}: {
  photo: Photo;
  className: string;
  onClick: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden bg-bg-alt ${className}`}
    >
      {url && (
        <img
          src={url}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
      {photo.isFavorite && (
        <span className="absolute top-2 right-2 w-[6px] h-[6px] bg-gold rounded-full ring-1 ring-bg" />
      )}
    </button>
  );
}

/* ───────── 詳細モーダル(全画面プレビュー) ───────── */
function PhotoDetailModal({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const toggleFavorite = usePhotosStore((s) => s.toggleFavorite);
  const removePhoto = usePhotosStore((s) => s.removePhoto);

  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);

  const handleDelete = async () => {
    if (!confirm('この写真を削除しますか?')) return;
    await removePhoto(photo.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-text/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg max-w-[420px] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {url && (
          <img
            src={url}
            alt={photo.filename}
            className="w-full max-h-[60vh] object-contain bg-bg-alt"
          />
        )}
        <div className="p-6">
          <p className="font-serif italic text-[11px] text-text-sub tracking-[0.2em] mb-2">
            {formatPhotoDate(photo.takenAt)}
          </p>
          <p className="font-serif-ja text-[12px] text-text break-all mb-6">{photo.filename}</p>

          <div className="flex gap-3">
            <button
              onClick={() => toggleFavorite(photo.id)}
              className={`flex-1 border py-3 font-serif text-[10.5px] tracking-[0.3em] uppercase transition-colors ${
                photo.isFavorite
                  ? 'border-gold bg-gold text-bg'
                  : 'border-line text-text hover:border-gold'
              }`}
            >
              {photo.isFavorite ? '◉ Favorite' : '◌ Favorite'}
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 border border-line py-3 font-serif text-[10.5px] tracking-[0.3em] uppercase text-text-sub hover:border-text hover:text-text"
            >
              — Delete —
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-3 font-serif italic text-[12px] text-text-sub tracking-[0.15em]"
          >
            — close —
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPhotoDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function countUniqueDays(photos: Photo[]): number {
  const set = new Set<string>();
  for (const p of photos) {
    const d = new Date(p.takenAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    set.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return set.size;
}
