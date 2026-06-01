import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readConfig } from "../../config/docugit-yml.ts";
import { computeSemanticDiff } from "../../diff/engine.ts";
import { formatHtmlDiff } from "../../diff/html.ts";
import { formatJsonDiff } from "../../diff/json.ts";
import { formatTerminalDiff } from "../../diff/terminal.ts";
import { gitOutput, passthroughToGit } from "../../utils/git.ts";
import { getRepoRoot } from "../../utils/repo.ts";
import { writeAndOpenHtml } from "../../utils/temp.ts";
import { listOoxmlParts, writePart } from "../../ooxml/pack.ts";

export interface DiffOptions {
  html?: boolean;
  json?: boolean;
  ref?: string;
}

async function checkoutRefToTemp(repoRoot: string, ref: string): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "docugit-diff-"));
  const parts = await listOoxmlParts(repoRoot);
  for (const part of parts) {
    try {
      const content = gitOutput(["show", `${ref}:${part}`], repoRoot);
      await writePart(tempDir, part, content);
    } catch {
      /* skip missing parts */
    }
  }
  return tempDir;
}

export async function runDiff(options: DiffOptions = {}): Promise<number> {
  const repoRoot = getRepoRoot();
  const config = await readConfig(repoRoot);

  let repoA: string;
  let repoB = repoRoot;

  if (options.ref) {
    repoA = await checkoutRefToTemp(repoRoot, options.ref);
  } else {
    repoA = await checkoutRefToTemp(repoRoot, "HEAD");
    // Compare staged + unstaged against HEAD
    try {
      const staged = gitOutput(["diff", "--cached", "--name-only"], repoRoot);
      const unstaged = gitOutput(["diff", "--name-only"], repoRoot);
      if (!staged && !unstaged) {
        const result = await computeSemanticDiff(repoA, repoB, config.document.type);
        if (options.json) {
          console.log(formatJsonDiff(result));
        } else if (options.html) {
          await writeAndOpenHtml(formatHtmlDiff(result));
        } else {
          console.log(formatTerminalDiff(result));
        }
        return 0;
      }
    } catch {
      /* fall through */
    }
  }

  const result = await computeSemanticDiff(repoA, repoB, config.document.type);

  if (options.json) {
    console.log(formatJsonDiff(result));
  } else if (options.html) {
    await writeAndOpenHtml(formatHtmlDiff(result));
  } else {
    console.log(formatTerminalDiff(result));
  }

  return 0;
}

export async function runStatus(): Promise<number> {
  const code = passthroughToGit(["status"]);
  const repoRoot = getRepoRoot();
  try {
    const config = await readConfig(repoRoot);
    const headDir = await checkoutRefToTemp(repoRoot, "HEAD");
    const result = await computeSemanticDiff(headDir, repoRoot, config.document.type);
    if (result.changes.length > 0) {
      console.log("\nDocuGit semantic summary:", result.summary);
    }
  } catch {
    /* not a docugit repo */
  }
  return code;
}

export async function runLog(args: string[]): Promise<number> {
  return passthroughToGit(["log", ...args]);
}
