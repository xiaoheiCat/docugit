import { basename } from "node:path";
import {
  openDocumentForEditing,
  syncOpenSessionFromRepo,
} from "../../utils/open-session.ts";
import { getRepoRoot } from "../../utils/repo.ts";

export async function runOpen(): Promise<number> {
  try {
    const repoRoot = getRepoRoot();
    const filePath = await syncOpenSessionFromRepo(repoRoot);
    await openDocumentForEditing(filePath);
    console.log(`Opened: ${basename(filePath)}`);
    console.log("hint: Save in Office, then run `docugit commit` to record changes.");
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
