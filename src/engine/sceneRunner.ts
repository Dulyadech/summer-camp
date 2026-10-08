import type { DialogueChoice, DialogueNode, Scene } from "@/types";
import { evaluateConditions } from "./conditionEvaluator";

export interface SceneRunnerState {
  currentScene: Scene;
  currentNode: DialogueNode;
  availableChoices: DialogueChoice[];
  isSceneComplete: boolean;
}

/**
 * Pure functions to query and advance scene nodes.
 */
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
