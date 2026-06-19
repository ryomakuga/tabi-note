import { useEffect, useState } from 'react';
import { usePhotosStore } from '../lib/photos-store';
import type { Photo } from '../lib/types';

type ViewMode = 'grid' | 'timeline' | 'favorites';

interface Props {
  tripId: string;
  initialView?: ViewMode;
  onClose: () => void;
}

export function PhotoGalleryModal({ tripId, initialView = 'grid', onClose }: Props) {
  const allPhotos = usePhotosStore((s) => s.photos);
  const photos = allPhotos.filter((p) => p.tripId === tripId);

  const [view, setView] = useState<ViewMode>(initialView);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) setSelectedPhoto(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, selectedPhoto]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const favCount = photos.filter((p) => p.isFavorite).length;
  const dayCount = countUniqueDays(photos);

  return (
    <div className="fixed inset-0 z-40 bg-bg overflow-y-auto">
      <div className="max-w-[420px] mx-auto px-7 pt-14 pb-24">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onClose} className="font-serif italic text-[13px] text-text-sub tracking-[0.15em]">
            ← back
          </button>
          <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-accent">
            — all photos
          </p>
          <div className="w-12" />
        </div>

        <div className="mb-8">
          <p className="font-serif italic text-[12px] tracking-[0.2em] text-gold mb-2">— chapter six</p>
          <h2 className="font-serif text-[44px] leading-[0.95] text-text mb-3 tracking-[-0.01em]">Memories</h2>
          <p className="font-serif-ja text-[14px] text-text mb-1 tracking-[0.06em]">旅の記憶</p>
          <p className="font-serif italic text-[12px] text-text-sub tracking-[0.05em]">moments quietly gathered</p>
        </div>

        <div className="flex justify-between items-center py-4 border-t border-line border-b border-line mb-7">
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
        </div>

        <div className="flex justify-center gap-6 py-3 mb-7">
          <ViewTab label="— Grid" active={view === 'grid'} onClick={() => setView('grid')} />
          <ViewTab label="— Timeline" active={view === 'timeline'} onClick={() => setView('timeline')} />
          <ViewTab label="— Favorites" active={view === 'favorites'} onClick={() => setView('favorites')} />
        </div>

        {view === 'grid' && <GridView photos={photos} onSelect={setSelectedPhoto} />}
        {view === 'timeline' && <TimelineView photos={photos} onSelect={setSelectedPhoto} />}
        {view === 'favorites' && <FavoritesView photos={photos} onSelect={setSelectedPhoto} />}

        <p className="text-center text-secondary text-[14px] tracking-[0.5em] my-8">· · ·</p>
      </div>

      {selectedPhoto && (
        <PhotoDetailOverlay photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}

function ViewTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`font-serif text-[10.5px] tracking-[0.35em] uppercase pb-1 transition-colors ${
        active ? 'text-text border-b border-accent' : 'text-text-sub'
      }`}
    >
      {label}
    </button>
  );
}

function GridView({ photos, onSelect }: { photos: Photo[]; onSelect: (p: Photo) => void }) {
  if (photos.length === 0) return <EmptyMessage text="写真がまだありません" />;
  return (
    <div className="grid grid-cols-3 gap-[6px]">
      {photos.map((p, i) => {
        const isLarge = i % 7 === 0;
        const isWide = !isLarge && i % 5 === 0;
        const className = isLarge
          ? 'col-span-2 row-span-2 aspect-square'
          : isWide
          ? 'col-span-2 aspect-[2/1]'
          : 'aspect-square';
        return <GalleryCell key={p.id} photo={p} className={className} onClick={() => onSelect(p)} />;
      })}
    </div>
  );
}

function TimelineView({ photos, onSelect }: { photos: Photo[]; onSelect: (p: Photo) => void }) {
  if (photos.length === 0) return <EmptyMessage text="写真がまだありません" />;
  const groups = new Map<string, Photo[]>();
  for (const p of photos) {
    const d = new Date(p.takenAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const sortedDates = Array.from(groups.keys()).sort();
  return (
    <div>
      {sortedDates.map((date, dayIndex) => {
        const items = groups.get(date)!;
        const dayNum = String(dayIndex + 1).padStart(2, '0');
        return (
          <div key={date} className="mb-9">
            <div className="flex items-baseline gap-4 mb-4">
              <div className="font-serif text-[32px] text-text leading-none tracking-[0.02em]">
                Day<span className="text-[12px] text-accent align-super ml-1 tracking-[0.1em]">{dayNum}</span>
              </div>
              <div className="flex-1 border-b border-line pb-2">
                <div className="font-serif italic text-[11px] text-text-sub tracking-[0.15em]">{formatDayDate(date)}</div>
              </div>
              <div className="font-serif italic text-[11px] tracking-[0.15em] text-accent">{items.length} photos</div>
            </div>
            <div className="grid grid-cols-3 gap-[6px]">
              {items.map((p, i) => {
                const isLarge = i === 0 && items.length >= 4;
                const className = isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square';
                return <GalleryCell key={p.id} photo={p} className={className} onClick={() => onSelect(p)} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FavoritesView({ photos, onSelect }: { photos: Photo[]; onSelect: (p: Photo) => void }) {
  const favs = photos.filter((p) => p.isFavorite);
  if (favs.length === 0) {
    return (
      <div className="text-center py-12 px-3">
        <p className="font-serif italic text-[24px] text-gold mb-2">◌</p>
        <p className="font-serif-ja text-[12px] text-text-sub leading-[1.8] tracking-[0.05em]">
          お気に入りはまだありません。<br />
          写真をタップして、お気に入りに追加できます。
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="text-center mb-9 px-3">
        <p className="font-serif italic text-[24px] text-gold mb-2">◌</p>
        <p className="font-serif-ja text-[12px] text-text-sub leading-[1.8] tracking-[0.05em]">
          お気に入りの {favs.length} 枚
        </p>
      </div>
      {favs.map((p, i) => (
        <div key={p.id} className="mb-10">
          <button onClick={() => onSelect(p)} className="block w-full aspect-[4/5] relative overflow-hidden bg-bg-alt mb-3">
            <PhotoImage photo={p} />
          </button>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-serif italic text-[22px] text-secondary leading-none">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex-1 h-px bg-line" />
            <span className="font-serif text-[8.5px] tracking-[0.3em] uppercase text-text-sub">{formatPhotoDate(p.takenAt)}</span>
          </div>
          <p className="font-serif-ja text-[13px] text-text break-all tracking-[0.05em]">{p.filename}</p>
        </div>
      ))}
    </div>
  );
}

function GalleryCell({ photo, className, onClick }: { photo: Photo; className: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative overflow-hidden bg-bg-alt ${className}`}>
      <PhotoImage photo={photo} />
      {photo.isFavorite && (
        <span className="absolute top-2 right-2 w-[6px] h-[6px] bg-gold rounded-full ring-1 ring-bg" />
      )}
    </button>
  );
}

function PhotoImage({ photo }: { photo: Photo }) {
  const [url, setUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const isVideo = photo.blob.type.startsWith('video/');
  useEffect(() => {
    if (!photo.thumbBlob) { setThumbUrl(null); return; }
    const tu = URL.createObjectURL(photo.thumbBlob);
    setThumbUrl(tu);
    return () => URL.revokeObjectURL(tu);
  }, [photo.thumbBlob]);
  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);
  if (!url) return null;
  if (isVideo) {
    return (
      <div className="relative w-full h-full">
        {thumbUrl ? (
          <img src={thumbUrl} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <video src={`${url}#t=0.1`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
        )}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-bg text-[20px]">▶</span>
        </span>
      </div>
    );
  }
  return <img src={url} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />;
}

function PhotoDetailOverlay({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const toggleFavorite = usePhotosStore((s) => s.toggleFavorite);
  const removePhoto = usePhotosStore((s) => s.removePhoto);

  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);

  const handleFavorite = async () => {
    const willBeFav = !photo.isFavorite;
    await toggleFavorite(photo.id);
    setPulse(true);
    setToast(willBeFav ? '✓ お気に入りに追加しました' : 'お気に入りを外しました');
    setTimeout(() => setPulse(false), 500);
    setTimeout(() => setToast(null), 1800);
  };

  const handleDelete = async () => {
    if (!confirm('この写真を削除しますか？')) return;
    await removePhoto(photo.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg max-w-[420px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          {url && <img src={url} alt={photo.filename} className="w-full max-h-[60vh] object-contain bg-bg-alt" />}
          {/* トースト表示 */}
          {toast && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
              <div className="bg-text/85 text-bg px-6 py-3 font-serif italic text-[14px] tracking-[0.1em] backdrop-blur-sm animate-fadeInScale">
                {toast}
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <p className="font-serif italic text-[11px] text-text-sub tracking-[0.2em] mb-2">{formatPhotoDate(photo.takenAt)}</p>
          <p className="font-serif-ja text-[12px] text-text break-all mb-6">{photo.filename}</p>
          <div className="flex gap-3">
            <button
              onClick={handleFavorite}
              className={`flex-1 border py-3 font-serif text-[10.5px] tracking-[0.3em] uppercase transition-all duration-300 ${
                photo.isFavorite ? 'border-gold bg-gold text-bg' : 'border-line text-text hover:border-gold'
              } ${pulse ? 'scale-105 shadow-lg' : ''}`}
            >
              <span className={`inline-block transition-transform duration-300 ${pulse ? 'scale-125' : ''}`}>
                {photo.isFavorite ? '◉' : '◌'}
              </span>
              <span className="ml-2">Favorite</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 border border-line py-3 font-serif text-[10.5px] tracking-[0.3em] uppercase text-text-sub hover:border-text hover:text-text"
            >
              — Delete —
            </button>
          </div>
          <button onClick={onClose} className="w-full mt-4 py-3 font-serif italic text-[12px] text-text-sub tracking-[0.15em]">
            — close —
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="text-center py-12">
      <p className="font-serif italic text-[24px] text-gold mb-3">◌</p>
      <p className="font-serif-ja text-[12px] text-text-sub">{text}</p>
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

function formatDayDate(date: string): string {
  try {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return `${d} ${months[m - 1]} · ${weekdays[dt.getDay()]}`;
  } catch {
    return date;
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
