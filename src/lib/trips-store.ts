// ============================================
// Tabi Note - 旅行ストア (Zustand)
// 要件定義書 F-01 に準拠
// 旅行プロジェクトの作成・編集・削除・一覧
// ============================================

import { create } from 'zustand';
import { db, generateId, now } from './db';
import type { Trip } from './types';

interface TripsState {
  trips: Trip[];
  currentTripId: string | null;
  isLoading: boolean;

  loadTrips: () => Promise<void>;
  createTrip: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setCurrentTrip: (id: string | null) => void;
  getUpcomingTrips: () => Trip[];
  getPastTrips: () => Trip[];
  getDaysUntilStart: (trip: Trip) => number;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  currentTripId: null,
  isLoading: false,

  loadTrips: async () => {
    set({ isLoading: true });
    try {
      const trips = await db.trips.orderBy('startDate').reverse().toArray();
      set({ trips, isLoading: false });
    } catch (error) {
      console.error('Failed to load trips:', error);
      set({ isLoading: false });
    }
  },

  createTrip: async (data) => {
    const trip: Trip = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    await db.trips.add(trip);
    set((state) => ({ trips: [trip, ...state.trips] }));
    return trip;
  },

  updateTrip: async (id, data) => {
    const updated = { ...data, updatedAt: now() };
    await db.trips.update(id, updated);
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
  },

  deleteTrip: async (id) => {
    await db.trips.delete(id);
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      currentTripId: state.currentTripId === id ? null : state.currentTripId,
    }));
  },

  setCurrentTrip: (id) => {
    set({ currentTripId: id });
  },

  getUpcomingTrips: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().trips.filter((t) => t.endDate >= today);
  },

  getPastTrips: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().trips.filter((t) => t.endDate < today);
  },

  getDaysUntilStart: (trip) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);
    const diff = start.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },
}));
