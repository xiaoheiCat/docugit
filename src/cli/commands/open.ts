import { openDocumentSession } from "../../watch/save-watcher.ts";
import { getRepoRoot } from "../../utils/repo.ts";

export async function runOpen(): Promise<number> {
  try {
    await openDocumentSession({ repoRoot: getRepoRoot() });
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
