// src/lib/music-store.ts
// ムービー用に読み込んだ音楽を IndexedDB に保存し、次回から再利用できるようにする
import { create } from 'zustand';
import { db, generateId, now } from './db';
import type { MusicTrack } from './types';

interface MusicState {
  tracks: MusicTrack[];
  loadTracks: () => Promise<void>;
  addTrack: (file: File) => Promise<MusicTrack>;
  removeTrack: (id: string) => Promise<void>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  tracks: [],

  loadTracks: async () => {
    try {
      const tracks = await db.musicTracks.toArray();
      // 新しい順に並べる
      tracks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      set({ tracks });
    } catch (error) {
      console.error('Failed to load music tracks:', error);
    }
  },

  addTrack: async (file: File) => {
    const track: MusicTrack = {
      id: generateId(),
      name: file.name,
      blob: file,
      createdAt: now(),
    };
    await db.musicTracks.put(track);
    const merged = [track, ...get().tracks];
    set({ tracks: merged });
    return track;
  },

  removeTrack: async (id: string) => {
    await db.musicTracks.delete(id);
    set({ tracks: get().tracks.filter((t) => t.id !== id) });
  },
}));
