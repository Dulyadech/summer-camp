import type { Ending } from "@/types";
import { evaluateConditions } from "./conditionEvaluator";

/**
 * Resolves which ending is met based on story flags and camper stats.
 */
export function resolveEnding(
  endings: Ending[],
  flags: Record<string, boolean>,
  stats: Record<string, number>
): Ending | null {
  for (const ending of endings) {
    if (evaluateConditions(ending.conditions, flags, stats)) {
      return ending;
    }
  }
  return null;
}
