import type { SemanticDiffResult } from "./engine.ts";

export function formatJsonDiff(result: SemanticDiffResult): string {
  return JSON.stringify(result, null, 2);
}
