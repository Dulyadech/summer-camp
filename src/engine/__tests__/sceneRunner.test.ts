import { beforeEach, describe, expect, it } from "vitest";
import {
  SceneRunner,
  initSceneRunner,
  getCurrentLine,
  advanceDialogue,
  selectChoice,
} from "../sceneRunner";
import { useGameStore } from "@/state";
import type { GameScene } from "@/types";

describe("sceneRunner - dialogue stepping, conditional variants, and priority routing", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  const mockSceneWithVariants: GameScene = {
    id: "scene_1_1",
    episode: 1,
    day: 1,
    backgroundId: "cabin_interior",
    dialogue: [
      {
        id: "line_1",
        speaker: "narrator",
        text: "The wooden floorboards creak under your feet as you enter Cabin 3.",
      },
      {
        id: "line_2",
        speaker: "jake",
        text: "Hey there! Welcome to the camp.",
        spriteState: {
          character: "jake",
          position: "center",
          expression: "friendly_smile",
        },
        conditionalVariant: {
          conditions: [
            {
              type: "stat",
              target: "jake",
              statKey: "attraction",
              operator: ">=",
              value: 20,
            },
          ],
          overrideText: "Hey there, handsome! I was hoping you'd be assigned to my cabin.",
          overrideExpression: "blush_smile",
        },
      },
      {
        id: "line_3",
        speaker: "narrator",
        text: "Jake sets down his sports bag and looks over.",
      },
    ],
    choices: [
      {
        id: "choice_bold",
        text: "Smile and step closer.",
        category: "tone",
        consequences: {
          targetCharacter: "jake",
          attractionDelta: 15,
          trustDelta: 5,
          setFlags: { greeted_jake_boldly: true },
        },
        nextSceneId: "scene_1_2_special", // Priority 1 destination
      },
      {
        id: "choice_polite",
        text: "Just nod politely.",
        category: "tone",
        consequences: {
          targetCharacter: "jake",
          trustDelta: 10,
        },
        // No choice-level destination (relies on scene-level fallback)
      },
      {
        id: "choice_leave",
        text: "Turn and leave.",
        category: "action",
        consequences: {},
      },
    ],
    nextSceneId: "scene_1_2_default", // Priority 2 fallback
  };

  const mockSceneTerminal: GameScene = {
    id: "scene_4_6",
    episode: 4,
    day: 5,
    backgroundId: "campfire_night",
    dialogue: [
      {
        id: "line_ending",
        speaker: "narrator",
        text: "The campfire embers drift into the starlit sky.",
      },
    ],
    choices: [
      {
        id: "choice_final_farewell",
        text: "Bid everyone farewell.",
        category: "tone",
        consequences: {
          setFlags: { game_completed: true },
        },
        // Neither choice nor scene has nextSceneId -> Priority 3
      },
    ],
    // No nextSceneId (terminal scene)
  };

  describe("getCurrentLine and conditional variant resolution", () => {
    it("returns the raw dialogue line when no conditionalVariant is defined", () => {
      const runner = new SceneRunner(mockSceneWithVariants);
      const line = runner.getCurrentLine();

      expect(line?.text).toBe(
        "The wooden floorboards creak under your feet as you enter Cabin 3."
      );
      expect(line?.speaker).toBe("narrator");
    });

    it("returns base text if conditionalVariant conditions are not met", () => {
      const runner = new SceneRunner(mockSceneWithVariants);
      runner.advanceDialogue(); // Move to line_2 (Jake speaking)

      // Jake attraction is 0 (below condition >= 20)
      const line = runner.getCurrentLine();
      expect(line?.text).toBe("Hey there! Welcome to the camp.");
      expect(line?.spriteState?.expression).toBe("friendly_smile");
    });

    it("returns overrideText and overrideExpression when conditionalVariant conditions pass", () => {
      // Set Jake's attraction to 25 (passes condition >= 20)
      useGameStore.getState().applyConsequences({
        targetCharacter: "jake",
        attractionDelta: 25,
      });

      const runner = new SceneRunner(mockSceneWithVariants);
      runner.advanceDialogue(); // Move to line_2

      const line = runner.getCurrentLine();
      expect(line?.text).toBe(
        "Hey there, handsome! I was hoping you'd be assigned to my cabin."
      );
      expect(line?.spriteState?.expression).toBe("blush_smile");
    });
  });

  describe("advanceDialogue line stepping", () => {
    it("advances sequentially through dialogue lines", () => {
      const runner = new SceneRunner(mockSceneWithVariants);

      expect(runner.getCurrentLineIndex()).toBe(0);

      const advanced1 = runner.advanceDialogue();
      expect(advanced1).toBe(true);
      expect(runner.getCurrentLineIndex()).toBe(1);

      const advanced2 = runner.advanceDialogue();
      expect(advanced2).toBe(true);
      expect(runner.getCurrentLineIndex()).toBe(2);

      // Reached the last line
      const advanced3 = runner.advanceDialogue();
      expect(advanced3).toBe(false);
      expect(runner.getCurrentLineIndex()).toBe(2);
      expect(runner.isDialogueFinished()).toBe(true);
    });
  });

  describe("selectChoice and Priority Routing hierarchy", () => {
    it("Priority 1: routes to ChoiceOption.nextSceneId when provided", () => {
      const runner = new SceneRunner(mockSceneWithVariants);

      const resolution = runner.selectChoice("choice_bold");

      expect(resolution.priority).toBe(1);
      expect(resolution.nextSceneId).toBe("scene_1_2_special");
      expect(resolution.isConclusion).toBe(false);

      // Verify gameStore state updates
      const state = useGameStore.getState();
      expect(state.characters.jake.attraction).toBe(15);
      expect(state.characters.jake.trust).toBe(55); // 50 + 5
      expect(state.flags.greeted_jake_boldly).toBe(true);
      expect(state.currentSceneId).toBe("scene_1_2_special");
      expect(state.history).toContain("scene_1_2_special");
    });

    it("Priority 2: falls back to GameScene.nextSceneId when choice has no nextSceneId", () => {
      const runner = new SceneRunner(mockSceneWithVariants);

      const resolution = runner.selectChoice("choice_polite");

      expect(resolution.priority).toBe(2);
      expect(resolution.nextSceneId).toBe("scene_1_2_default");
      expect(resolution.isConclusion).toBe(false);

      const state = useGameStore.getState();
      expect(state.characters.jake.trust).toBe(60); // 50 + 10
      expect(state.currentSceneId).toBe("scene_1_2_default");
      expect(state.history).toContain("scene_1_2_default");
    });

    it("Priority 3: signals Episode / Story Conclusion when neither has nextSceneId", () => {
      const runner = new SceneRunner(mockSceneTerminal);

      const resolution = runner.selectChoice("choice_final_farewell");

      expect(resolution.priority).toBe(3);
      expect(resolution.nextSceneId).toBeNull();
      expect(resolution.isConclusion).toBe(true);

      const state = useGameStore.getState();
      expect(state.flags.game_completed).toBe(true);
    });

    it("throws an error when selecting a non-existent choice ID", () => {
      const runner = new SceneRunner(mockSceneWithVariants);

      expect(() => runner.selectChoice("invalid_choice_id")).toThrow(
        /was not found/
      );
    });
  });

  describe("singleton standalone functions API", () => {
    it("works via initSceneRunner, getCurrentLine, advanceDialogue, selectChoice", () => {
      initSceneRunner(mockSceneWithVariants);

      expect(getCurrentLine()?.text).toBe(
        "The wooden floorboards creak under your feet as you enter Cabin 3."
      );

      advanceDialogue();
      expect(getCurrentLine()?.speaker).toBe("jake");

      const res = selectChoice("choice_bold");
      expect(res.priority).toBe(1);
      expect(res.nextSceneId).toBe("scene_1_2_special");
    });
  });
});
