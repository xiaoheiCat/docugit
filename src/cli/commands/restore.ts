import * as readline from "node:readline/promises";
import { openSessionFileExists, removeOpenSessionFile } from "../../utils/open-session.ts";
import { requireDocuGitRepoRoot } from "../../utils/repo.ts";

async function confirmDiscard(force: boolean): Promise<boolean> {
  if (force) return true;
  if (!process.stdin.isTTY) {
    console.error("fatal: terminal prompts disabled; use -y to discard the open session");
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Discard open session changes [y/N]? ");
    const normalized = answer.trim().toLowerCase();
    return normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}

export async function runRestore(force: boolean): Promise<number> {
  try {
    const repoRoot = await requireDocuGitRepoRoot();

    if (!(await openSessionFileExists(repoRoot))) {
      console.error("error: no open session to discard");
      return 1;
    }

    if (!(await confirmDiscard(force))) {
      return 1;
    }

    await removeOpenSessionFile(repoRoot);
    console.log("Discarded open session.");
    console.log("hint: Run `docugit open` to pack from the repository.");
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
