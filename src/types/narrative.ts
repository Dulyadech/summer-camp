/**
 * Core Narrative Types and Schemas for Summer Camp
 */

import type { RelationshipStatus } from "./game";

// ==========================================
// Declarative Narrative & Scene Graph Schemas
// ==========================================

export interface DeclarativeCondition {
  type: "stat" | "flag" | "relationshipStatus";
  target?: "jake" | "ethan" | "ryan";
  statKey?: "attraction" | "trust";
  flagKey?: string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=";
  value: number | boolean | string;
}

export interface ConditionalDialogueVariant {
  conditions: DeclarativeCondition[];
  overrideText: string;
  overrideExpression?: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  category: "tone" | "action" | "deception";
  consequences: {
    targetCharacter?: "jake" | "ethan" | "ryan";
    attractionDelta?: number;
    trustDelta?: number;
    newStatus?: RelationshipStatus;
    setFlags?: Record<string, boolean>;
  };
  nextSceneId?: string;
}

export interface DialogueLine {
  id: string;
  speaker: "protagonist" | "jake" | "ethan" | "ryan" | "narrator";
  text: string;
  spriteState?: {
    character: "jake" | "ethan" | "ryan";
    expression: string;
    position: "left" | "center" | "right";
  };
  cameraEffect?: "zoom_in" | "pan_left" | "shake" | "default";
  conditionalVariant?: ConditionalDialogueVariant;
}

export interface GameScene {
  id: string;
  episode: 1 | 2 | 3 | 4;
  day: 1 | 2 | 3 | 4 | 5;
  backgroundId: string;
  bgmId?: string;
  dialogue: DialogueLine[];
  choices?: ChoiceOption[];
  nextSceneId?: string;
}

// ==========================================
// Existing Node Graph & Character Contracts
// ==========================================

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
