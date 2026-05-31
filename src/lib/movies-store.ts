// src/lib/movies-store.ts
// アプリ内に保存したムービーを IndexedDB で管理する
import { create } from 'zustand';
import { db, generateId, now } from './db';
import type { Movie } from './types';

interface MoviesState {
  movies: Movie[];
  loadMovies: (tripId: string) => Promise<void>;
  addMovie: (tripId: string, blob: Blob, name?: string) => Promise<Movie>;
  removeMovie: (id: string) => Promise<void>;
}

export const useMoviesStore = create<MoviesState>((set, get) => ({
  movies: [],

  loadMovies: async (tripId: string) => {
    try {
      const movies = await db.movies.where('tripId').equals(tripId).toArray();
      // 新しい順に並べる
      movies.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      set({ movies });
    } catch (error) {
      console.error('Failed to load movies:', error);
    }
  },

  addMovie: async (tripId: string, blob: Blob, name?: string) => {
    const created = now();
    const movie: Movie = {
      id: generateId(),
      tripId,
      name: name || `movie-${created.slice(0, 10)}.mp4`,
      blob,
      createdAt: created,
    };
    await db.movies.put(movie);
    const merged = [movie, ...get().movies];
    set({ movies: merged });
    return movie;
  },

  removeMovie: async (id: string) => {
    await db.movies.delete(id);
    set({ movies: get().movies.filter((m) => m.id !== id) });
  },
}));
