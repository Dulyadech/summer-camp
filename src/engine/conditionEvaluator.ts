import type { Condition, DeclarativeCondition, GameState, RelationshipStatus } from "@/types";

const RELATIONSHIP_STATUS_RANK: Record<RelationshipStatus, number> = {
  casual_interest: 1,
  romantic_interest: 2,
  mutually_acknowledged: 3,
  exclusive: 4,
};

/**
 * Compares two primitive values using the specified operator.
 */
function comparePrimitive(
  left: number | string | boolean,
  operator: DeclarativeCondition["operator"],
  right: number | string | boolean
): boolean {
  switch (operator) {
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    default:
      return false;
  }
}

/**
 * Evaluates a single DeclarativeCondition against the current GameState.
 * Supports:
 * - 'stat': compares a target character's attraction or trust
 * - 'flag': compares a boolean flag from gameState.flags
 * - 'relationshipStatus': compares equality or progression ranking of relationship status
 */
export function evaluateDeclarativeCondition(
  condition: DeclarativeCondition,
  gameState: GameState
): boolean {
  if (!condition || !gameState) return false;

  switch (condition.type) {
    case "stat": {
      if (!condition.target || !condition.statKey) return false;
      const character = gameState.characters[condition.target];
      if (!character) return false;

      const currentVal = character[condition.statKey];
      const targetVal = Number(condition.value);
      if (typeof currentVal !== "number" || isNaN(targetVal)) return false;

      return comparePrimitive(currentVal, condition.operator, targetVal);
    }

    case "flag": {
      const flagKey = condition.flagKey;
      if (!flagKey) return false;

      const currentFlag = Boolean(gameState.flags[flagKey]);
      const targetFlag = Boolean(condition.value);

      if (condition.operator === "==") return currentFlag === targetFlag;
      if (condition.operator === "!=") return currentFlag !== targetFlag;
      return comparePrimitive(Number(currentFlag), condition.operator, Number(targetFlag));
    }

    case "relationshipStatus": {
      if (!condition.target) return false;
      const character = gameState.characters[condition.target];
      if (!character) return false;

      const currentStatus = character.status;
      const targetStatus = condition.value as RelationshipStatus;

      if (condition.operator === "==") return currentStatus === targetStatus;
      if (condition.operator === "!=") return currentStatus !== targetStatus;

      const currentRank = RELATIONSHIP_STATUS_RANK[currentStatus];
      const targetRank = RELATIONSHIP_STATUS_RANK[targetStatus];

      if (currentRank === undefined || targetRank === undefined) {
        return false;
      }

      return comparePrimitive(currentRank, condition.operator, targetRank);
    }

    default:
      return false;
  }
}

/**
 * Evaluates a list of DeclarativeConditions using logical AND.
 * Returns true if all conditions are met or if the conditions list is empty/undefined.
 */
export function evaluateDeclarativeConditions(
  conditions: DeclarativeCondition[] | undefined,
  gameState: GameState
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((cond) => evaluateDeclarativeCondition(cond, gameState));
}

// ==========================================
// Backward Compatibility for Legacy Node Graph
// ==========================================

/**
 * Legacy condition evaluator for backward compatibility with early node schemas.
 */
export function evaluateCondition(
  condition: Condition,
  flags: Record<string, boolean>,
  stats: Record<string, number>
): boolean {
  if (condition.type === "flag") {
    const flagVal = Boolean(flags[condition.key]);
    if (condition.operator === "==") return flagVal === Boolean(condition.value);
    if (condition.operator === "!=") return flagVal !== Boolean(condition.value);
    return flagVal;
  }

  if (condition.type === "stat") {
    const currentStat = stats[condition.key] ?? 0;
    const targetVal = Number(condition.value);

    switch (condition.operator) {
      case "==":
        return currentStat === targetVal;
      case "!=":
        return currentStat !== targetVal;
      case ">=":
        return currentStat >= targetVal;
      case "<=":
        return currentStat <= targetVal;
      case ">":
        return currentStat > targetVal;
      case "<":
        return currentStat < targetVal;
      default:
        return false;
    }
  }

  return true;
}

/**
 * Legacy conditions evaluator (logical AND). Returns true if all match or empty.
 */
export function evaluateConditions(
  conditions: Condition[] | undefined,
  flags: Record<string, boolean>,
  stats: Record<string, number>
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((cond) => evaluateCondition(cond, flags, stats));
}
