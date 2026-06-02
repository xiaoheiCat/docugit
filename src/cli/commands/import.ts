import * as readline from "node:readline/promises";
import { resolve } from "node:path";
import type { DocumentType } from "../../config/docugit-yml.ts";
import { validateImportFromFile, applyImportFromFile, getRepoRoot } from "../../utils/repo.ts";
import { runCommit } from "./commit.ts";

async function confirmImport(force: boolean, sourceFile: string): Promise<boolean> {
  if (force) return true;
  if (!process.stdin.isTTY) {
    console.error("fatal: terminal prompts disabled; use -y to import");
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      `This will create a new commit for this repository containing that file. Import ${sourceFile} [y/N]? `,
    );
    const normalized = answer.trim().toLowerCase();
    return normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}

export async function runImport(file: string, force: boolean, message: string[] = []): Promise<number> {
  const repoRoot = getRepoRoot();
  const sourceFile = resolve(file);

  let resolved: string;
  let type: DocumentType;
  try {
    ({ resolved, type } = await validateImportFromFile(repoRoot, sourceFile));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }

  if (!(await confirmImport(force, resolved))) {
    return 1;
  }

  try {
    await applyImportFromFile(repoRoot, resolved, type);
    console.log(`Imported: ${resolved}`);
    return runCommit(message);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
