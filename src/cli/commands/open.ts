import { basename } from "node:path";
import {
  ensureOpenSessionFromRepo,
  openDocumentForEditing,
} from "../../utils/open-session.ts";
import { requireDocuGitRepoRoot } from "../../utils/repo.ts";

export async function runOpen(): Promise<number> {
  try {
    const repoRoot = await requireDocuGitRepoRoot();
    const { filePath, created } = await ensureOpenSessionFromRepo(repoRoot);
    await openDocumentForEditing(filePath);
    console.log(`Opened: ${basename(filePath)}`);
    if (!created) {
      console.log("hint: Using existing open session; run `docugit restore` to discard changes.");
    }
    console.log("hint: Save in Office, then run `docugit commit` to record changes.");
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
