import type { SemanticDiffResult } from "./engine.ts";

export type { SemanticDiffResult, SemanticChange } from "./engine.ts";

export interface GitStatusFile {
  path: string;
  indexStatus: string;
  worktreeStatus: string;
}

export interface GitStatusJson {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  clean: boolean;
  files: GitStatusFile[];
}

export interface OpenSessionJson {
  active: boolean;
  path: string | null;
}

export interface StatusJson {
  git: GitStatusJson;
  semantic: SemanticDiffResult | null;
  openSession: OpenSessionJson;
}

export interface LogEntryJson {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
}

export interface MergeResultJson {
  success: boolean;
  summary?: string;
  conflicts?: SemanticDiffResult;
}
