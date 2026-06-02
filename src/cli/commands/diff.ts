import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readConfig } from "../../config/docugit-yml.ts";
import { computeSemanticDiff } from "../../diff/engine.ts";
import { formatHtmlDiff } from "../../diff/html.ts";
import { formatJsonDiff } from "../../diff/json.ts";
import type { StatusJson } from "../../diff/json-schemas.ts";
import { formatTerminalDiff } from "../../diff/terminal.ts";
import { gitOutput, passthroughToGit } from "../../utils/git.ts";
import { formatLogJson } from "../../utils/log-json.ts";
import { getOpenSessionFilePath, openSessionFileExists } from "../../utils/open-session.ts";
import { getRepoRoot } from "../../utils/repo.ts";
import { parseGitStatus } from "../../utils/status-json.ts";
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

export interface StatusOptions {
  json?: boolean;
}

export async function runStatus(options: StatusOptions = {}): Promise<number> {
  const repoRoot = getRepoRoot();
  const git = parseGitStatus(repoRoot);

  let semantic = null;
  try {
    const config = await readConfig(repoRoot);
    const headDir = await checkoutRefToTemp(repoRoot, "HEAD");
    semantic = await computeSemanticDiff(headDir, repoRoot, config.document.type);
  } catch {
    semantic = null;
  }

  let openSessionPath: string | null = null;
  let openSessionActive = false;
  try {
    openSessionActive = await openSessionFileExists(repoRoot);
    if (openSessionActive) {
      openSessionPath = await getOpenSessionFilePath(repoRoot);
    }
  } catch {
    openSessionActive = false;
    openSessionPath = null;
  }

  if (options.json) {
    const payload: StatusJson = {
      git,
      semantic,
      openSession: { active: openSessionActive, path: openSessionPath },
    };
    console.log(JSON.stringify(payload, null, 2));
    return 0;
  }

  const code = passthroughToGit(["status"]);
  if (semantic && semantic.changes.length > 0) {
    console.log("\nDocuGit semantic summary:", semantic.summary);
  }
  return code;
}

export interface LogOptions {
  json?: boolean;
  limit?: number;
}

export async function runLog(args: string[], options: LogOptions = {}): Promise<number> {
  if (options.json) {
    const repoRoot = getRepoRoot();
    console.log(JSON.stringify(formatLogJson(repoRoot, options.limit ?? 50), null, 2));
    return 0;
  }
  return passthroughToGit(["log", ...args]);
}
