import { create } from "zustand";
import type { GameState, RelationshipStatus } from "@/types";

export interface ConsequencePayload {
  targetCharacter?: "jake" | "ethan" | "ryan";
  attractionDelta?: number;
  trustDelta?: number;
  newStatus?: RelationshipStatus;
  setFlags?: Record<string, boolean>;
}

export interface GameStore extends GameState {
  // Required mutations
  applyConsequences: (consequences: ConsequencePayload) => void;
  setCurrentScene: (sceneId: string) => void;
  recordHistory: (sceneId: string) => void;
  resetGame: () => void;

  // Convenience mutations
  setProtagonistName: (name: string) => void;
  setFlag: (key: string, value: boolean) => void;
  setCharacterStat: (
    character: "jake" | "ethan" | "ryan",
    stats: Partial<{ attraction: number; trust: number; status: RelationshipStatus }>
  ) => void;
}

const clampStat = (value: number): number => Math.min(100, Math.max(0, value));

export const INITIAL_GAME_STATE: GameState = {
  currentSceneId: "scene_1_1",
  protagonistName: "Alex",
  characters: {
    jake: { attraction: 0, trust: 50, status: "casual_interest" },
    ethan: { attraction: 0, trust: 50, status: "casual_interest" },
    ryan: { attraction: 0, trust: 50, status: "casual_interest" },
  },
  flags: {},
  history: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL_GAME_STATE,

  applyConsequences: (consequences) =>
    set((state) => {
      let updatedCharacters = state.characters;

      if (consequences.targetCharacter) {
        const target = consequences.targetCharacter;
        const current = state.characters[target];
        if (current) {
          updatedCharacters = {
            ...state.characters,
            [target]: {
              ...current,
              attraction:
                consequences.attractionDelta !== undefined
                  ? clampStat(current.attraction + consequences.attractionDelta)
                  : current.attraction,
              trust:
                consequences.trustDelta !== undefined
                  ? clampStat(current.trust + consequences.trustDelta)
                  : current.trust,
              status: consequences.newStatus ?? current.status,
            },
          };
        }
      }

      const updatedFlags = consequences.setFlags
        ? { ...state.flags, ...consequences.setFlags }
        : state.flags;

      return {
        characters: updatedCharacters,
        flags: updatedFlags,
      };
    }),

  setCurrentScene: (sceneId) =>
    set({
      currentSceneId: sceneId,
    }),

  recordHistory: (sceneId) =>
    set((state) => ({
      history: state.history.includes(sceneId)
        ? state.history
        : [...state.history, sceneId],
    })),

  resetGame: () =>
    set({
      ...INITIAL_GAME_STATE,
      characters: {
        jake: { ...INITIAL_GAME_STATE.characters.jake },
        ethan: { ...INITIAL_GAME_STATE.characters.ethan },
        ryan: { ...INITIAL_GAME_STATE.characters.ryan },
      },
      flags: { ...INITIAL_GAME_STATE.flags },
      history: [...INITIAL_GAME_STATE.history],
    }),

  setProtagonistName: (name) =>
    set({
      protagonistName: name,
    }),

  setFlag: (key, value) =>
    set((state) => ({
      flags: { ...state.flags, [key]: value },
    })),

  setCharacterStat: (character, stats) =>
    set((state) => {
      const current = state.characters[character];
      if (!current) return state;

      return {
        characters: {
          ...state.characters,
          [character]: {
            ...current,
            attraction:
              stats.attraction !== undefined
                ? clampStat(stats.attraction)
                : current.attraction,
            trust:
              stats.trust !== undefined ? clampStat(stats.trust) : current.trust,
            status: stats.status ?? current.status,
          },
        },
      };
    }),
}));

// Export alias for non-hook consumption
export const gameStore = useGameStore;
