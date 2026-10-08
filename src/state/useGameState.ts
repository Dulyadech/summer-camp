import { create } from "zustand";

export interface GameState {
  currentEpisodeId: string;
  currentSceneId: string;
  currentNodeId: string;
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  inventory: string[];

  // Actions
  setFlag: (key: string, value: boolean) => void;
  modifyStat: (key: string, delta: number) => void;
  setStat: (key: string, value: number) => void;
  addToInventory: (item: string) => void;
  removeFromInventory: (item: string) => void;
  setScenePosition: (episodeId: string, sceneId: string, nodeId: string) => void;
  resetGame: () => void;
}

const INITIAL_STATE = {
  currentEpisodeId: "ep1",
  currentSceneId: "scene_campfire",
  currentNodeId: "node_1",
  flags: {},
  stats: {
    stamina: 100,
    courage: 10,
    curiosity: 10,
    friendship: 0,
  },
  inventory: ["Flashlight", "Camp Handbook"],
};

export const useGameState = create<GameState>((set) => ({
  ...INITIAL_STATE,

  setFlag: (key, value) =>
    set((state) => ({
      flags: { ...state.flags, [key]: value },
    })),

  modifyStat: (key, delta) =>
    set((state) => ({
      stats: {
        ...state.stats,
        [key]: Math.max(0, (state.stats[key] ?? 0) + delta),
      },
    })),

  setStat: (key, value) =>
    set((state) => ({
      stats: { ...state.stats, [key]: value },
    })),

  addToInventory: (item) =>
    set((state) => ({
      inventory: state.inventory.includes(item)
        ? state.inventory
        : [...state.inventory, item],
    })),

  removeFromInventory: (item) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i !== item),
    })),

  setScenePosition: (episodeId, sceneId, nodeId) =>
    set({
      currentEpisodeId: episodeId,
      currentSceneId: sceneId,
      currentNodeId: nodeId,
    }),

  resetGame: () => set(INITIAL_STATE),
}));
