import {
  getDocumentName,
  renameDocument,
  requireDocuGitRepoRoot,
} from "../../utils/repo.ts";

export async function runName(): Promise<number> {
  try {
    console.log(await getDocumentName(await requireDocuGitRepoRoot()));
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}

export async function runRename(newName: string): Promise<number> {
  try {
    await renameDocument(await requireDocuGitRepoRoot(), newName);
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
