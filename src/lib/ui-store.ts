import { create } from 'zustand';

/**
 * 画面遷移などの UI 状態を管理するストア。
 * データ(Trip など)は別ストアで管理する。
 */
interface UIState {
  // 現在開いている旅行のID。null なら一覧画面、値があれば詳細画面
  selectedTripId: string | null;

  // 旅行詳細画面を開く
  openTrip: (tripId: string) => void;

  // 詳細画面を閉じて一覧に戻る
  closeTrip: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTripId: null,

  openTrip: (tripId) => set({ selectedTripId: tripId }),

  closeTrip: () => set({ selectedTripId: null }),
}));