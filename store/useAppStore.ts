import { create } from "zustand";
import { KakaoLocation } from "@/types/kakao";

interface AppState {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  
  addStart: (location: KakaoLocation) => void;
  removeStart: (id: string) => void;
  
  addEnd: (location: KakaoLocation) => void;
  removeEnd: (id: string) => void;
  
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  starts: [],
  ends: [],

  addStart: (location) =>
    set((state) => ({
      starts: state.starts.some((loc) => loc.id === location.id)
        ? state.starts // 중복 추가 방지
        : [...state.starts, location],
    })),

  removeStart: (id) =>
    set((state) => ({
      starts: state.starts.filter((loc) => loc.id !== id),
    })),

  addEnd: (location) =>
    set((state) => ({
      ends: state.ends.some((loc) => loc.id === location.id)
        ? state.ends // 중복 추가 방지
        : [...state.ends, location],
    })),

  removeEnd: (id) =>
    set((state) => ({
      ends: state.ends.filter((loc) => loc.id !== id),
    })),

  clearAll: () => set({ starts: [], ends: [] }),
}));
