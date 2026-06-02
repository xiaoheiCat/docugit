import type { GitStatusFile, GitStatusJson } from "../diff/json-schemas.ts";
import { gitOutput } from "./git.ts";

export function parseGitStatus(repoRoot: string): GitStatusJson {
  let branch = "HEAD";
  let upstream: string | null = null;
  let ahead = 0;
  let behind = 0;
  const files: GitStatusFile[] = [];

  try {
    const branchLine = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"], repoRoot);
    branch = branchLine || "HEAD";
  } catch {
    branch = "HEAD";
  }

  try {
    const upstreamRaw = gitOutput(["rev-parse", "--abbrev-ref", "@{upstream}"], repoRoot);
    upstream = upstreamRaw || null;
    if (upstream) {
      const counts = gitOutput(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], repoRoot);
      const match = counts.match(/(\d+)\s+(\d+)/);
      if (match) {
        ahead = parseInt(match[1] ?? "0", 10);
        behind = parseInt(match[2] ?? "0", 10);
      }
    }
  } catch {
    upstream = null;
  }

  let porcelain = "";
  try {
    porcelain = gitOutput(["status", "--porcelain"], repoRoot);
  } catch {
    porcelain = "";
  }

  for (const line of porcelain.split("\n")) {
    if (!line.trim()) continue;
    const indexStatus = line[0] ?? " ";
    const worktreeStatus = line[1] ?? " ";
    const path = line.slice(3).trim();
    if (path) {
      files.push({ path, indexStatus, worktreeStatus });
    }
  }

  return {
    branch,
    upstream,
    ahead,
    behind,
    clean: files.length === 0,
    files,
  };
}
