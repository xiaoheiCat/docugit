import type { DiffCommitRef, SemanticDiffResult } from "../diff/engine.ts";
import { gitOutput } from "./git.ts";

export type { DiffCommitRef } from "../diff/engine.ts";

export function resolveCommitRef(repoRoot: string, ref: string): DiffCommitRef {
  const hash = gitOutput(["rev-parse", ref], repoRoot).trim();
  const shortHash = gitOutput(["rev-parse", "--short", hash], repoRoot).trim();
  return { hash, shortHash };
}

export type DiffCompareHead = DiffCommitRef | "worktree";

export function attachDiffRefs(
  result: SemanticDiffResult,
  base: DiffCommitRef,
  head: DiffCompareHead,
): SemanticDiffResult {
  return {
    ...result,
    base,
    head: head === "worktree" ? undefined : head,
    compareWorktree: head === "worktree",
  };
}

export function formatDiffCompareLabel(result: SemanticDiffResult): string {
  if (result.base && result.head) {
    return `${result.base.shortHash} <-> ${result.head.shortHash}`;
  }
  if (result.base && result.compareWorktree) {
    return `${result.base.shortHash} <-> worktree`;
  }
  return result.documentType;
}
