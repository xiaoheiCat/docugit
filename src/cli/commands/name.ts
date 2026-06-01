import { getDocumentName, renameDocument, getRepoRoot } from "../../utils/repo.ts";

export async function runName(): Promise<number> {
  try {
    console.log(await getDocumentName(getRepoRoot()));
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}

export async function runRename(newName: string): Promise<number> {
  try {
    await renameDocument(getRepoRoot(), newName);
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
