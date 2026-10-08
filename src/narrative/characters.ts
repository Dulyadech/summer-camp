import type { Character } from "@/types";

export const CHARACTERS: Record<string, Character> = {
  narrator: {
    id: "narrator",
    name: "Narrator",
    colorTheme: "#94a3b8",
  },
  maya: {
    id: "maya",
    name: "Counselor Maya",
    role: "Camp Guide",
    colorTheme: "#f59e0b",
  },
  ben: {
    id: "ben",
    name: "Camp Director Ben",
    role: "Head Counselor",
    colorTheme: "#38bdf8",
  },
  camper: {
    id: "camper",
    name: "Player Camper",
    role: "New Arrival",
    colorTheme: "#10b981",
  },
};
