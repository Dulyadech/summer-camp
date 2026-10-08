import { EPISODE_1 } from "./episodes/episode1";
import { CHARACTERS } from "./characters";
import type { Episode } from "@/types";

export * from "./characters";
export * from "./episodes/episode1";

export const EPISODES: Record<string, Episode> = {
  ep1: EPISODE_1,
};

export function getCharacter(id?: string) {
  if (!id) return undefined;
  return CHARACTERS[id] || { id, name: id };
}

export function getEpisode(id: string) {
  return EPISODES[id];
}
