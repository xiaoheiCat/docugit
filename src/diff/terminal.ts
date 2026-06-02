import type { SemanticDiffResult } from "./engine.ts";
import { formatDiffCompareLabel } from "../utils/diff-refs.ts";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

export function formatTerminalDiff(result: SemanticDiffResult): string {
  const lines: string[] = [];
  lines.push(`${colors.cyan}DocuGit Semantic Diff (${formatDiffCompareLabel(result)})${colors.reset}`);
  lines.push(
    `${colors.dim}Summary: +${result.summary.added} -${result.summary.removed} ~${result.summary.modified}${colors.reset}`,
  );
  lines.push("");

  if (result.changes.length === 0) {
    lines.push("No semantic changes.");
    return lines.join("\n");
  }

  for (const change of result.changes) {
    const prefix =
      change.type === "added"
        ? `${colors.green}+${colors.reset}`
        : change.type === "removed"
          ? `${colors.red}-${colors.reset}`
          : `${colors.yellow}~${colors.reset}`;

    lines.push(`${prefix} ${colors.cyan}${change.location}${colors.reset}`);

    if (change.type === "removed" || change.type === "modified") {
      for (const line of change.before.split("\n")) {
        lines.push(`  ${colors.red}- ${line}${colors.reset}`);
      }
    }
    if (change.type === "added" || change.type === "modified") {
      for (const line of change.after.split("\n")) {
        lines.push(`  ${colors.green}+ ${line}${colors.reset}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
