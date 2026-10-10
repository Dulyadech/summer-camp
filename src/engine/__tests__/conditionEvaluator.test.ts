import { describe, expect, it } from "vitest";
import {
  evaluateDeclarativeCondition,
  evaluateDeclarativeConditions,
} from "../conditionEvaluator";
import type { DeclarativeCondition, GameState } from "@/types";

describe("conditionEvaluator - DeclarativeCondition evaluation", () => {
  const mockGameState: GameState = {
    currentSceneId: "scene_1_1",
    protagonistName: "Alex",
    characters: {
      jake: { attraction: 45, trust: 60, status: "romantic_interest" },
      ethan: { attraction: 70, trust: 30, status: "mutually_acknowledged" },
      ryan: { attraction: 10, trust: 50, status: "casual_interest" },
    },
    flags: {
      met_at_dock: true,
      told_the_truth: false,
    },
    history: ["scene_1_1"],
  };

  describe("stat condition evaluation (attraction & trust)", () => {
    it("evaluates equality '==' and '!=", () => {
      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "attraction",
            operator: "==",
            value: 45,
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "attraction",
            operator: "!=",
            value: 50,
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "attraction",
            operator: "==",
            value: 50,
          },
          mockGameState
        )
      ).toBe(false);
    });

    it("evaluates comparison operators '>', '>=', '<', '<='", () => {
      // jake.trust is 60
      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "trust",
            operator: ">=",
            value: 60,
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "trust",
            operator: ">",
            value: 60,
          },
          mockGameState
        )
      ).toBe(false);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "trust",
            operator: "<=",
            value: 60,
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            target: "jake",
            statKey: "trust",
            operator: "<",
            value: 60,
          },
          mockGameState
        )
      ).toBe(false);
    });

    it("returns false for invalid character target or missing key", () => {
      expect(
        evaluateDeclarativeCondition(
          {
            type: "stat",
            // @ts-expect-error test invalid target
            target: "unknown_char",
            statKey: "attraction",
            operator: "==",
            value: 45,
          },
          mockGameState
        )
      ).toBe(false);
    });
  });

  describe("flag condition evaluation", () => {
    it("evaluates true flags", () => {
      expect(
        evaluateDeclarativeCondition(
          {
            type: "flag",
            flagKey: "met_at_dock",
            operator: "==",
            value: true,
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "flag",
            flagKey: "met_at_dock",
            operator: "!=",
            value: false,
          },
          mockGameState
        )
      ).toBe(true);
    });

    it("evaluates false and missing flags", () => {
      expect(
        evaluateDeclarativeCondition(
          {
            type: "flag",
            flagKey: "told_the_truth",
            operator: "==",
            value: false,
          },
          mockGameState
        )
      ).toBe(true);

      // missing flag evaluates to false
      expect(
        evaluateDeclarativeCondition(
          {
            type: "flag",
            flagKey: "non_existent_flag",
            operator: "==",
            value: false,
          },
          mockGameState
        )
      ).toBe(true);
    });
  });

  describe("relationshipStatus condition evaluation", () => {
    it("evaluates exact equality '==' and '!='", () => {
      expect(
        evaluateDeclarativeCondition(
          {
            type: "relationshipStatus",
            target: "jake",
            operator: "==",
            value: "romantic_interest",
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "relationshipStatus",
            target: "jake",
            operator: "!=",
            value: "casual_interest",
          },
          mockGameState
        )
      ).toBe(true);
    });

    it("evaluates progression hierarchy with '>=', '>', '<=', '<'", () => {
      // ethan status is 'mutually_acknowledged' (rank 3)
      // casual_interest (1) < romantic_interest (2) < mutually_acknowledged (3) < exclusive (4)
      expect(
        evaluateDeclarativeCondition(
          {
            type: "relationshipStatus",
            target: "ethan",
            operator: ">=",
            value: "romantic_interest",
          },
          mockGameState
        )
      ).toBe(true);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "relationshipStatus",
            target: "ethan",
            operator: ">",
            value: "mutually_acknowledged",
          },
          mockGameState
        )
      ).toBe(false);

      expect(
        evaluateDeclarativeCondition(
          {
            type: "relationshipStatus",
            target: "ethan",
            operator: "<=",
            value: "exclusive",
          },
          mockGameState
        )
      ).toBe(true);
    });
  });

  describe("evaluateDeclarativeConditions (logical AND)", () => {
    it("returns true when all conditions match", () => {
      const conditions: DeclarativeCondition[] = [
        {
          type: "stat",
          target: "jake",
          statKey: "attraction",
          operator: ">=",
          value: 40,
        },
        {
          type: "stat",
          target: "jake",
          statKey: "trust",
          operator: ">=",
          value: 50,
        },
        {
          type: "flag",
          flagKey: "met_at_dock",
          operator: "==",
          value: true,
        },
        {
          type: "relationshipStatus",
          target: "jake",
          operator: "==",
          value: "romantic_interest",
        },
      ];

      expect(evaluateDeclarativeConditions(conditions, mockGameState)).toBe(true);
    });

    it("returns false if any condition in the list fails", () => {
      const conditions: DeclarativeCondition[] = [
        {
          type: "stat",
          target: "jake",
          statKey: "attraction",
          operator: ">=",
          value: 40,
        },
        {
          type: "flag",
          flagKey: "told_the_truth", // is false in mock state
          operator: "==",
          value: true,
        },
      ];

      expect(evaluateDeclarativeConditions(conditions, mockGameState)).toBe(false);
    });

    it("returns true for empty or undefined conditions (vacuum truth)", () => {
      expect(evaluateDeclarativeConditions([], mockGameState)).toBe(true);
      expect(evaluateDeclarativeConditions(undefined, mockGameState)).toBe(true);
    });
  });
});
