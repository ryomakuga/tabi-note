import { create } from 'zustand';
import { db } from './db';
import type { Spot } from './types';

interface SpotsState {
  spots: Spot[];
  isLoading: boolean;
  loadSpots: (tripId: string) => Promise<void>;
  createSpot: (data: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Spot>;
  updateSpot: (id: string, updates: Partial<Omit<Spot, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSpot: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  getByTripId: (tripId: string) => Spot[];
  getByStatus: (tripId: string, status: 'draft' | 'confirmed') => Spot[];
}

export const useSpotsStore = create<SpotsState>((set, get) => ({
  spots: [],
  isLoading: false,

  loadSpots: async (tripId: string) => {
    set({ isLoading: true });
    try {
      const spots = await db.spots
        .where('tripId')
        .equals(tripId)
        .toArray();
      // createdAt 順にソート(新しいものが下)
      spots.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      set({ spots, isLoading: false });
    } catch (error) {
      console.error('Failed to load spots:', error);
      set({ isLoading: false });
    }
  },

  createSpot: async (data) => {
    const now = new Date().toISOString();
    const spot: Spot = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.spots.add(spot);
    set({ spots: [...get().spots, spot] });
    return spot;
  },

  updateSpot: async (id, updates) => {
    const now = new Date().toISOString();
    await db.spots.update(id, { ...updates, updatedAt: now });
    const spots = get().spots.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: now } : s
    );
    set({ spots });
  },

  deleteSpot: async (id) => {
    await db.spots.delete(id);
    set({ spots: get().spots.filter((s) => s.id !== id) });
  },

  toggleStatus: async (id) => {
    const spot = get().spots.find((s) => s.id === id);
    if (!spot) return;
    const newStatus = spot.status === 'draft' ? 'confirmed' : 'draft';
    await get().updateSpot(id, { status: newStatus });
  },

  getByTripId: (tripId) => {
    return get().spots.filter((s) => s.tripId === tripId);
  },

  getByStatus: (tripId, status) => {
    return get().spots.filter((s) => s.tripId === tripId && s.status === status);
  },
}));
