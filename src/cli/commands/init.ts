import { resolve } from "node:path";
import {
  initRepoFromFile,
  newRepo,
  exportDocument,
  requireDocuGitRepoRoot,
  resolveNewRepoTarget,
  resolveInitRepoTarget,
} from "../../utils/repo.ts";
import type { DocumentType } from "../../config/docugit-yml.ts";

export async function runInit(file: string, dir?: string): Promise<number> {
  try {
    const target = await resolveInitRepoTarget(dir ?? ".", file);
    await initRepoFromFile(resolve(file), target);
    console.log(`Initialized DocuGit repository: ${target}`);
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}

export async function runNew(type: DocumentType, name: string, dir?: string): Promise<number> {
  try {
    const target = await resolveNewRepoTarget(dir ?? ".", name, type);
    await newRepo(type, target, name);
    console.log(`Created ${type} document repository: ${target}`);
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}

export async function runExport(output?: string): Promise<number> {
  try {
    const out = await exportDocument(await requireDocuGitRepoRoot(), output);
    console.log(`Exported: ${out}`);
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
