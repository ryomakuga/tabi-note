// ============================================
// Tabi Note - フライトストア (Zustand)
// 要件定義書 F-03 に準拠
// フライト情報の作成・編集・削除・一覧
// V1.5: 座席情報なし(旅行者管理廃止)
// ============================================

import { create } from 'zustand';
import { db, generateId, now } from './db';
import type { Flight } from './types';

interface FlightsState {
  flights: Flight[];
  isLoading: boolean;

  loadFlights: (tripId: string) => Promise<void>;
  createFlight: (data: Omit<Flight, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Flight>;
  updateFlight: (id: string, data: Partial<Flight>) => Promise<void>;
  deleteFlight: (id: string) => Promise<void>;
  getByTripId: (tripId: string) => Flight[];
  getOutbound: (tripId: string) => Flight[];
  getReturn: (tripId: string) => Flight[];
}

export const useFlightsStore = create<FlightsState>((set, get) => ({
  flights: [],
  isLoading: false,

  loadFlights: async (tripId) => {
    set({ isLoading: true });
    try {
      const flights = await db.flights
        .where('tripId')
        .equals(tripId)
        .sortBy('departureTime');
      set({ flights, isLoading: false });
    } catch (error) {
      console.error('Failed to load flights:', error);
      set({ isLoading: false });
    }
  },

  createFlight: async (data) => {
    const flight: Flight = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    await db.flights.add(flight);
    set((state) => ({
      flights: [...state.flights, flight].sort((a, b) =>
        a.departureTime.localeCompare(b.departureTime)
      ),
    }));
    return flight;
  },

  updateFlight: async (id, data) => {
    const updated = { ...data, updatedAt: now() };
    await db.flights.update(id, updated);
    set((state) => ({
      flights: state.flights.map((f) => (f.id === id ? { ...f, ...updated } : f)),
    }));
  },

  deleteFlight: async (id) => {
    await db.flights.delete(id);
    set((state) => ({
      flights: state.flights.filter((f) => f.id !== id),
    }));
  },

  getByTripId: (tripId) => {
    return get().flights.filter((f) => f.tripId === tripId);
  },

  getOutbound: (tripId) => {
    return get()
      .flights.filter((f) => f.tripId === tripId && f.direction === 'outbound')
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  },

  getReturn: (tripId) => {
    return get()
      .flights.filter((f) => f.tripId === tripId && f.direction === 'return')
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  },
}));
