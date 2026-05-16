import { create } from 'zustand';
import { db } from './db';
import type { Meal } from './types';

interface MealsState {
  meals: Meal[];
  isLoading: boolean;
  loadMeals: (tripId: string) => Promise<void>;
  createMeal: (data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Meal>;
  updateMeal: (id: string, updates: Partial<Omit<Meal, 'id' | 'createdAt'>>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  getByTripId: (tripId: string) => Meal[];
  getByStatus: (tripId: string, status: 'draft' | 'confirmed') => Meal[];
}

export const useMealsStore = create<MealsState>((set, get) => ({
  meals: [],
  isLoading: false,

  loadMeals: async (tripId: string) => {
    set({ isLoading: true });
    try {
      const meals = await db.meals
        .where('tripId')
        .equals(tripId)
        .toArray();
      // 確定(scheduledAt あり)を時刻順、その後に候補を作成順
      meals.sort((a, b) => {
        const aScheduled = a.status === 'confirmed' && a.scheduledAt ? a.scheduledAt : null;
        const bScheduled = b.status === 'confirmed' && b.scheduledAt ? b.scheduledAt : null;
        if (aScheduled && bScheduled) return aScheduled.localeCompare(bScheduled);
        if (aScheduled && !bScheduled) return -1;
        if (!aScheduled && bScheduled) return 1;
        return a.createdAt.localeCompare(b.createdAt);
      });
      set({ meals, isLoading: false });
    } catch (error) {
      console.error('Failed to load meals:', error);
      set({ isLoading: false });
    }
  },

  createMeal: async (data) => {
    const now = new Date().toISOString();
    const meal: Meal = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.meals.add(meal);
    set({ meals: [...get().meals, meal] });
    return meal;
  },

  updateMeal: async (id, updates) => {
    const now = new Date().toISOString();
    await db.meals.update(id, { ...updates, updatedAt: now });
    const meals = get().meals.map((m) =>
      m.id === id ? { ...m, ...updates, updatedAt: now } : m
    );
    set({ meals });
  },

  deleteMeal: async (id) => {
    await db.meals.delete(id);
    set({ meals: get().meals.filter((m) => m.id !== id) });
  },

  toggleStatus: async (id) => {
    const meal = get().meals.find((m) => m.id === id);
    if (!meal) return;
    const newStatus = meal.status === 'draft' ? 'confirmed' : 'draft';
    await get().updateMeal(id, { status: newStatus });
  },

  getByTripId: (tripId) => {
    return get().meals.filter((m) => m.tripId === tripId);
  },

  getByStatus: (tripId, status) => {
    return get().meals.filter((m) => m.tripId === tripId && m.status === status);
  },
}));
