import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore, INITIAL_GAME_STATE } from "../gameStore";

describe("gameStore - state mutations and stat clamping", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it("initializes with GDD default values", () => {
    const state = useGameStore.getState();

    expect(state.characters.jake).toEqual({
      attraction: 0,
      trust: 50,
      status: "casual_interest",
    });
    expect(state.characters.ethan).toEqual({
      attraction: 0,
      trust: 50,
      status: "casual_interest",
    });
    expect(state.characters.ryan).toEqual({
      attraction: 0,
      trust: 50,
      status: "casual_interest",
    });
    expect(state.flags).toEqual({});
    expect(state.history).toEqual([]);
    expect(state.currentSceneId).toBe(INITIAL_GAME_STATE.currentSceneId);
    expect(state.protagonistName).toBe(INITIAL_GAME_STATE.protagonistName);
  });

  describe("attraction clamping (0 - 100)", () => {
    it("increases attraction within bounds", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "jake",
        attractionDelta: 35,
      });

      expect(useGameStore.getState().characters.jake.attraction).toBe(35);
    });

    it("clamps attraction to upper bound of 100 when exceeding", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "jake",
        attractionDelta: 150,
      });

      expect(useGameStore.getState().characters.jake.attraction).toBe(100);
    });

    it("clamps attraction to lower bound of 0 when delta is negative", () => {
      const { applyConsequences } = useGameStore.getState();

      // First give some attraction
      applyConsequences({
        targetCharacter: "ethan",
        attractionDelta: 20,
      });
      expect(useGameStore.getState().characters.ethan.attraction).toBe(20);

      // Decreasing beyond 0 must clamp to 0
      applyConsequences({
        targetCharacter: "ethan",
        attractionDelta: -50,
      });

      expect(useGameStore.getState().characters.ethan.attraction).toBe(0);
    });
  });

  describe("trust clamping (0 - 100)", () => {
    it("increases trust within bounds from default 50", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "ryan",
        trustDelta: 25,
      });

      expect(useGameStore.getState().characters.ryan.trust).toBe(75);
    });

    it("clamps trust to upper bound of 100 when exceeding", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "ryan",
        trustDelta: 80, // 50 + 80 = 130 -> 100
      });

      expect(useGameStore.getState().characters.ryan.trust).toBe(100);
    });

    it("clamps trust to lower bound of 0 when decreasing below zero", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "ryan",
        trustDelta: -80, // 50 - 80 = -30 -> 0
      });

      expect(useGameStore.getState().characters.ryan.trust).toBe(0);
    });
  });

  describe("character isolation and flags mutation", () => {
    it("modifying one character does not mutate other characters", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "jake",
        attractionDelta: 40,
        trustDelta: 20,
        newStatus: "romantic_interest",
      });

      const state = useGameStore.getState();
      expect(state.characters.jake).toEqual({
        attraction: 40,
        trust: 70,
        status: "romantic_interest",
      });

      // Ethan and Ryan remain at defaults
      expect(state.characters.ethan).toEqual({
        attraction: 0,
        trust: 50,
        status: "casual_interest",
      });
      expect(state.characters.ryan).toEqual({
        attraction: 0,
        trust: 50,
        status: "casual_interest",
      });
    });

    it("updates flags and relationship status simultaneously", () => {
      const { applyConsequences } = useGameStore.getState();

      applyConsequences({
        targetCharacter: "ethan",
        newStatus: "romantic_interest",
        setFlags: {
          met_at_dock: true,
          lied_about_canoe: false,
        },
      });

      const state = useGameStore.getState();
      expect(state.characters.ethan.status).toBe("romantic_interest");
      expect(state.flags).toEqual({
        met_at_dock: true,
        lied_about_canoe: false,
      });
    });
  });

  describe("direct mutations and navigation", () => {
    it("setCharacterStat also enforces 0 - 100 clamping", () => {
      const { setCharacterStat } = useGameStore.getState();

      setCharacterStat("jake", {
        attraction: 999,
        trust: -50,
      });

      const state = useGameStore.getState();
      expect(state.characters.jake.attraction).toBe(100);
      expect(state.characters.jake.trust).toBe(0);
    });

    it("records visited scenes in history and sets current scene", () => {
      const { setCurrentScene, recordHistory } = useGameStore.getState();

      setCurrentScene("scene_1_2");
      recordHistory("scene_1_1");
      recordHistory("scene_1_2");
      // Duplicate should not create duplicate entries
      recordHistory("scene_1_1");

      const state = useGameStore.getState();
      expect(state.currentSceneId).toBe("scene_1_2");
      expect(state.history).toEqual(["scene_1_1", "scene_1_2"]);
    });

    it("resets state back to initial state cleanly", () => {
      const { applyConsequences, setCurrentScene, recordHistory, resetGame } =
        useGameStore.getState();

      applyConsequences({
        targetCharacter: "ryan",
        attractionDelta: 50,
        setFlags: { secret_unlocked: true },
      });
      setCurrentScene("scene_2_1");
      recordHistory("scene_1_1");

      resetGame();

      const state = useGameStore.getState();
      expect(state.characters.ryan.attraction).toBe(0);
      expect(state.flags).toEqual({});
      expect(state.history).toEqual([]);
      expect(state.currentSceneId).toBe(INITIAL_GAME_STATE.currentSceneId);
    });
  });
});
