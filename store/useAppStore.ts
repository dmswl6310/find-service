import { create } from "zustand";
import { KakaoLocation } from "@/types/kakao";
import { getCurrentDateTime } from "@/utils/dateTime";

interface AppState {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  useDepartureTime: boolean;
  targetDate: string; // YYYYMMDD
  targetTime: string; // HHMM
  
  addStart: (location: KakaoLocation) => void;
  removeStart: (id: string) => void;
  setStarts: (locations: KakaoLocation[]) => void;
  
  addEnd: (location: KakaoLocation) => void;
  removeEnd: (id: string) => void;
  setEnds: (locations: KakaoLocation[]) => void;
  
  setUseDepartureTime: (enabled: boolean) => void;
  setTargetDate: (date: string) => void;
  setTargetTime: (time: string) => void;

  clearAll: () => void;
}

// 기본값은 오늘 날짜와 현재 시간
const now = getCurrentDateTime();
const defaultDate = now.date;
const defaultTime = now.time;

export const useAppStore = create<AppState>((set) => ({
  starts: [],
  ends: [],
  useDepartureTime: true,
  targetDate: defaultDate,
  targetTime: defaultTime,

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

  setStarts: (locations) => set({ starts: locations }),

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
    
  setEnds: (locations) => set({ ends: locations }),
  
  setUseDepartureTime: (enabled) => set({ useDepartureTime: enabled }),
  setTargetDate: (date) => set({ targetDate: date }),
  setTargetTime: (time) => set({ targetTime: time }),

  clearAll: () => set({ starts: [], ends: [] }),
}));
