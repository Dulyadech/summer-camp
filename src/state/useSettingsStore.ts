import { create } from "zustand";

export interface SettingsState {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  textSpeed: number; // chars per second (or delay ms)
  autoSpeed: number; // delay ms before auto advance
  themeVariant: "camp" | "glass";

  // Actions
  setMasterVolume: (val: number) => void;
  setBgmVolume: (val: number) => void;
  setSfxVolume: (val: number) => void;
  setVoiceVolume: (val: number) => void;
  setTextSpeed: (val: number) => void;
  setAutoSpeed: (val: number) => void;
  setThemeVariant: (val: "camp" | "glass") => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  masterVolume: 80,
  bgmVolume: 70,
  sfxVolume: 85,
  voiceVolume: 90,
  textSpeed: 40,
  autoSpeed: 2500,
  themeVariant: "camp",

  setMasterVolume: (val) => set({ masterVolume: val }),
  setBgmVolume: (val) => set({ bgmVolume: val }),
  setSfxVolume: (val) => set({ sfxVolume: val }),
  setVoiceVolume: (val) => set({ voiceVolume: val }),
  setTextSpeed: (val) => set({ textSpeed: val }),
  setAutoSpeed: (val) => set({ autoSpeed: val }),
  setThemeVariant: (val) => set({ themeVariant: val }),
}));
