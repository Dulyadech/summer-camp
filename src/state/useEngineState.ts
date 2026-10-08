import { create } from "zustand";
import type { GameMode, HistoryEntry } from "@/types";

export interface EngineState {
  mode: GameMode;
  isAuto: boolean;
  isSkip: boolean;
  isLogOpen: boolean;
  isSettingsOpen: boolean;
  isProfileOpen: boolean;
  history: HistoryEntry[];

  // Actions
  setMode: (mode: GameMode) => void;
  toggleAuto: () => void;
  toggleSkip: () => void;
  setLogOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export const useEngineState = create<EngineState>((set) => ({
  mode: "dialogue",
  isAuto: false,
  isSkip: false,
  isLogOpen: false,
  isSettingsOpen: false,
  isProfileOpen: false,
  history: [],

  setMode: (mode) => set({ mode }),
  toggleAuto: () => set((state) => ({ isAuto: !state.isAuto, isSkip: false })),
  toggleSkip: () => set((state) => ({ isSkip: !state.isSkip, isAuto: false })),
  setLogOpen: (open) => set({ isLogOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),

  addHistoryEntry: (entry) =>
    set((state) => ({
      history: [...state.history, entry],
    })),

  clearHistory: () => set({ history: [] }),
}));
