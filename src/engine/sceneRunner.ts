import type {
  ChoiceOption,
  DialogueChoice,
  DialogueLine,
  DialogueNode,
  GameScene,
  GameState,
  Scene,
} from "@/types";
import { evaluateConditions, evaluateDeclarativeConditions } from "./conditionEvaluator";
import { useGameStore } from "@/state";

export type RoutingPriority = 1 | 2 | 3;

export interface ChoiceResolution {
  choice: ChoiceOption;
  priority: RoutingPriority;
  nextSceneId: string | null;
  isConclusion: boolean;
}

/**
 * SceneRunner manages dialogue progression, conditional text resolution,
 * and deterministic choice routing matching GDD Section 8 & 20.
 */
export class SceneRunner {
  private currentScene: GameScene;
  private currentLineIndex: number = 0;
  private gameScenes?: Record<string, GameScene>;

  constructor(
    initialScene: GameScene,
    gameScenes?: Record<string, GameScene>,
    initialLineIndex: number = 0
  ) {
    this.currentScene = initialScene;
    this.gameScenes = gameScenes;
    this.currentLineIndex = initialLineIndex;
  }

  /**
   * Sets the active scene and resets line index to 0.
   */
  public setScene(scene: GameScene, resetIndex: boolean = true): void {
    this.currentScene = scene;
    if (resetIndex) {
      this.currentLineIndex = 0;
    }
  }

  /**
   * Returns current active scene.
   */
  public getCurrentScene(): GameScene {
    return this.currentScene;
  }

  /**
   * Returns current dialogue line index.
   */
  public getCurrentLineIndex(): number {
    return this.currentLineIndex;
  }

  /**
   * Returns the active dialogue line.
   * If the line has a conditionalVariant whose conditions pass against GameState,
   * it overrides text and expression accordingly.
   */
  public getCurrentLine(gameState?: GameState): DialogueLine | null {
    if (
      !this.currentScene.dialogue ||
      this.currentLineIndex < 0 ||
      this.currentLineIndex >= this.currentScene.dialogue.length
    ) {
      return null;
    }

    const rawLine = this.currentScene.dialogue[this.currentLineIndex];
    if (!rawLine) return null;

    if (rawLine.conditionalVariant) {
      const state = gameState ?? useGameStore.getState();
      const isSatisfied = evaluateDeclarativeConditions(
        rawLine.conditionalVariant.conditions,
        state
      );

      if (isSatisfied) {
        return {
          ...rawLine,
          text: rawLine.conditionalVariant.overrideText,
          spriteState: rawLine.conditionalVariant.overrideExpression
            ? {
                character: rawLine.spriteState?.character ?? "jake",
                position: rawLine.spriteState?.position ?? "center",
                expression: rawLine.conditionalVariant.overrideExpression,
              }
            : rawLine.spriteState,
        };
      }
    }

    return rawLine;
  }

  /**
   * Steps to the next line in the active scene.
   * Returns true if there was a next line, or false if the end of dialogue is reached.
   */
  public advanceDialogue(): boolean {
    if (this.currentLineIndex < this.currentScene.dialogue.length - 1) {
      this.currentLineIndex += 1;
      return true;
    }
    return false;
  }

  /**
   * Returns true if the dialogue in the current scene has reached its last line.
   */
  public isDialogueFinished(): boolean {
    return (
      !this.currentScene.dialogue ||
      this.currentLineIndex >= this.currentScene.dialogue.length - 1
    );
  }

  /**
   * Returns the list of choices for the current scene.
   */
  public getChoices(): ChoiceOption[] {
    return this.currentScene.choices ?? [];
  }

  /**
   * Selects a choice by ID, applies its consequences to gameStore, and resolves
   * routing based on the strict GDD priority hierarchy:
   * - Priority 1: ChoiceOption.nextSceneId
   * - Priority 2: GameScene.nextSceneId (fallback)
   * - Priority 3: Episode / Story Conclusion (when neither exists)
   */
  public selectChoice(choiceId: string): ChoiceResolution {
    const choices = this.currentScene.choices ?? [];
    const choice = choices.find((c) => c.id === choiceId);

    if (!choice) {
      throw new Error(
        `Choice with id "${choiceId}" was not found in scene "${this.currentScene.id}".`
      );
    }

    // 1. Apply choice consequences to gameStore
    if (choice.consequences) {
      useGameStore.getState().applyConsequences(choice.consequences);
    }

    // 2. Resolve destination according to priority hierarchy
    // Priority 1: Choice-level nextSceneId
    if (choice.nextSceneId && choice.nextSceneId.trim() !== "") {
      const destination = choice.nextSceneId;
      useGameStore.getState().setCurrentScene(destination);
      useGameStore.getState().recordHistory(destination);

      if (this.gameScenes && this.gameScenes[destination]) {
        this.setScene(this.gameScenes[destination]);
      }

      return {
        choice,
        priority: 1,
        nextSceneId: destination,
        isConclusion: false,
      };
    }

    // Priority 2: Scene-level fallback nextSceneId
    if (this.currentScene.nextSceneId && this.currentScene.nextSceneId.trim() !== "") {
      const destination = this.currentScene.nextSceneId;
      useGameStore.getState().setCurrentScene(destination);
      useGameStore.getState().recordHistory(destination);

      if (this.gameScenes && this.gameScenes[destination]) {
        this.setScene(this.gameScenes[destination]);
      }

      return {
        choice,
        priority: 2,
        nextSceneId: destination,
        isConclusion: false,
      };
    }

    // Priority 3: Episode / Story Conclusion
    return {
      choice,
      priority: 3,
      nextSceneId: null,
      isConclusion: true,
    };
  }
}

// ==========================================
// Module-level Singleton API & Standalone Helpers
// ==========================================

let activeRunnerInstance: SceneRunner | null = null;

export function initSceneRunner(
  scene: GameScene,
  allScenes?: Record<string, GameScene>
): SceneRunner {
  activeRunnerInstance = new SceneRunner(scene, allScenes);
  return activeRunnerInstance;
}

export function getSceneRunner(): SceneRunner {
  if (!activeRunnerInstance) {
    throw new Error(
      "SceneRunner has not been initialized. Call initSceneRunner(scene) first."
    );
  }
  return activeRunnerInstance;
}

export function getCurrentLine(gameState?: GameState): DialogueLine | null {
  return getSceneRunner().getCurrentLine(gameState);
}

export function advanceDialogue(): boolean {
  return getSceneRunner().advanceDialogue();
}

export function selectChoice(choiceId: string): ChoiceResolution {
  return getSceneRunner().selectChoice(choiceId);
}

// ==========================================
// Backward Compatibility for Legacy Node Graph
// ==========================================

export interface SceneRunnerState {
  currentScene: Scene;
  currentNode: DialogueNode;
  availableChoices: DialogueChoice[];
  isSceneComplete: boolean;
}

export function getAvailableChoices(
  node: DialogueNode,
  flags: Record<string, boolean>,
  stats: Record<string, number>
): DialogueChoice[] {
  if (!node.choices) return [];
  return node.choices.filter((choice) =>
    evaluateConditions(choice.conditions, flags, stats)
  );
}

export function advanceNode(
  scene: Scene,
  currentNode: DialogueNode,
  chosenChoiceId?: string
): DialogueNode | null {
  if (chosenChoiceId && currentNode.choices) {
    const choice = currentNode.choices.find((c) => c.id === chosenChoiceId);
    if (choice && choice.targetNodeId && scene.nodes[choice.targetNodeId]) {
      return scene.nodes[choice.targetNodeId];
    }
  }

  if (currentNode.nextNodeId && scene.nodes[currentNode.nextNodeId]) {
    return scene.nodes[currentNode.nextNodeId];
  }

  return null;
}
