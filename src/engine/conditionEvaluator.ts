import type { Condition } from "@/types";

/**
 * Pure condition evaluator for narrative branching, choices, and endings.
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
 * Evaluates a list of conditions (logical AND). Returns true if all match or empty.
 */
export function evaluateConditions(
  conditions: Condition[] | undefined,
  flags: Record<string, boolean>,
  stats: Record<string, number>
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((cond) => evaluateCondition(cond, flags, stats));
}
