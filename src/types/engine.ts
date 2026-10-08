/**
 * Game Engine and Execution State Types
 */

export type GameMode = "dialogue" | "choice" | "ending" | "menu";

export type WindowLifecycleState = "VISIBLE_ACTIVE" | "VISIBLE_INACTIVE" | "MINIMIZED_HIDDEN";


export interface HistoryEntry {
  id: string;
  speakerName?: string;
  speakerRole?: string;
  text: string;
  timestamp: number;
}

export interface SaveData {
  version: string;
  timestamp: number;
  slotId: number;
  label: string;
  currentEpisodeId: string;
  currentSceneId: string;
  currentNodeId: string;
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  inventory: string[];
}
