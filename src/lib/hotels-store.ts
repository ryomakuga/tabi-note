import { create } from 'zustand';
import { db } from './db';
import type { Hotel } from './types';

interface HotelsState {
  hotels: Hotel[];
  isLoading: boolean;
  loadHotels: (tripId: string) => Promise<void>;
  createHotel: (data: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Hotel>;
  updateHotel: (id: string, updates: Partial<Omit<Hotel, 'id' | 'createdAt'>>) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  getByTripId: (tripId: string) => Hotel[];
}

export const useHotelsStore = create<HotelsState>((set, get) => ({
  hotels: [],
  isLoading: false,

  loadHotels: async (tripId: string) => {
    set({ isLoading: true });
    try {
      const hotels = await db.hotels
        .where('tripId')
        .equals(tripId)
        .toArray();
      // checkIn 順にソート
      hotels.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
      set({ hotels, isLoading: false });
    } catch (error) {
      console.error('Failed to load hotels:', error);
      set({ isLoading: false });
    }
  },

  createHotel: async (data) => {
    const now = new Date().toISOString();
    const hotel: Hotel = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.hotels.add(hotel);
    const hotels = [...get().hotels, hotel].sort((a, b) =>
      a.checkIn.localeCompare(b.checkIn)
    );
    set({ hotels });
    return hotel;
  },

  updateHotel: async (id, updates) => {
    const now = new Date().toISOString();
    await db.hotels.update(id, { ...updates, updatedAt: now });
    const hotels = get().hotels.map((h) =>
      h.id === id ? { ...h, ...updates, updatedAt: now } : h
    );
    hotels.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    set({ hotels });
  },

  deleteHotel: async (id) => {
    await db.hotels.delete(id);
    set({ hotels: get().hotels.filter((h) => h.id !== id) });
  },

  getByTripId: (tripId) => {
    return get().hotels.filter((h) => h.tripId === tripId);
  },
}));
