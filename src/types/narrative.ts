/**
 * Core Narrative Types and Schemas for Summer Camp
 */

export interface Character {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  colorTheme?: string; // hex or tailwind class
}

export type ConditionOperator = "==" | "!=" | ">=" | "<=" | ">" | "<" | "has";

export interface Condition {
  type: "flag" | "stat" | "custom";
  key: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export interface DialogueChoice {
  id: string;
  text: string;
  targetNodeId: string;
  conditions?: Condition[];
  onSelectAction?: {
    setFlags?: Record<string, boolean>;
    modifyStats?: Record<string, number>;
  };
}

export interface DialogueNode {
  id: string;
  speakerId?: string; // Character ID or undefined for narration
  text: string;
  background?: string; // Background ID
  bgm?: string; // Audio track ID
  sfx?: string; // Sound effect ID
  cg?: string; // Fullscreen CG artwork ID
  choices?: DialogueChoice[];
  nextNodeId?: string;
  conditions?: Condition[];
  actions?: {
    setFlags?: Record<string, boolean>;
    modifyStats?: Record<string, number>;
  };
}

export interface Scene {
  id: string;
  title: string;
  defaultBackground?: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface Episode {
  id: string;
  title: string;
  summary: string;
  scenes: Record<string, Scene>;
  startSceneId: string;
}

export interface Ending {
  id: string;
  title: string;
  description: string;
  conditions: Condition[];
  cg?: string;
}
