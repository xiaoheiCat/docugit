import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDefaultConfig,
  detectDocumentType,
  generateReadme,
  writeConfig,
  type Author,
  type DocumentType,
} from "../config/docugit-yml.ts";
import { unpackFromFile, inferTypeFromParts, listOoxmlParts } from "../ooxml/pack.ts";
import { runGit, gitOutput, isGitRepo } from "../utils/git.ts";
import { setupRepoSkill } from "../utils/skill.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "../../templates");

export function getRepoRoot(cwd = process.cwd()): string {
  return resolve(cwd);
}

export async function copyTemplate(type: DocumentType, targetDir: string): Promise<void> {
  await cp(join(TEMPLATES_DIR, type), targetDir, { recursive: true });
}

export async function initRepoFromFile(
  sourceFile: string,
  targetDir: string,
  authors: Author[] = [],
): Promise<void> {
  const type = detectDocumentType(sourceFile);
  if (!type) {
    throw new Error("Unsupported file type. Use .docx, .xlsx, or .pptx.");
  }

  await mkdir(targetDir, { recursive: true });
  await unpackFromFile(sourceFile, targetDir);

  const originalName = sourceFile.split(/[/\\]/).pop() ?? `document.${type}`;
  const config = createDefaultConfig(type, originalName, authors);
  await writeConfig(targetDir, config);
  await generateReadme(targetDir, config);

  if (!isGitRepo(targetDir)) {
    runGit(["init"], targetDir);
  }

  await writeFile(
    join(targetDir, ".gitignore"),
    [".docugit/\n", "*.tmp\n", ".DS_Store\n"].join(""),
    "utf-8",
  );

  await setupRepoSkill(targetDir);

  runGit(["add", "."], targetDir);
  runGit(["commit", "-m", `docugit: init ${originalName}`], targetDir);
}

export async function newRepo(
  type: DocumentType,
  targetDir: string,
  name: string,
  authors: Author[] = [],
): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  await copyTemplate(type, targetDir);

  const parts = await listOoxmlParts(targetDir);
  const inferred = inferTypeFromParts(parts);
  if (inferred !== type) {
    throw new Error(`Template type mismatch: expected ${type}, got ${inferred}`);
  }

  const originalName = name.endsWith(`.${type}`) ? name : `${name}.${type}`;
  const config = createDefaultConfig(type, originalName, authors);
  await writeConfig(targetDir, config);
  await generateReadme(targetDir, config);

  if (!isGitRepo(targetDir)) {
    runGit(["init"], targetDir);
  }

  await writeFile(join(targetDir, ".gitignore"), ".docugit/\n*.tmp\n.DS_Store\n", "utf-8");
  runGit(["add", "."], targetDir);
  runGit(["commit", "-m", `docugit: create ${originalName}`], targetDir);
}

export async function exportDocument(repoRoot: string, outputPath?: string): Promise<string> {
  const { readConfig } = await import("../config/docugit-yml.ts");
  const { packToFile } = await import("../ooxml/pack.ts");
  const config = await readConfig(repoRoot);
  const out =
    outputPath ??
    join(repoRoot, config.document.originalName.endsWith(`.${config.document.type}`)
      ? config.document.originalName
      : `${config.document.originalName}.${config.document.type}`);
  await packToFile(repoRoot, out);
  return out;
}

export async function getWorkingTreeSnapshot(repoRoot: string): Promise<string> {
  return gitOutput(["write-tree"], repoRoot);
}

export async function prepareCommitMetadata(repoRoot: string): Promise<void> {
  const { readConfig, writeConfig } = await import("../config/docugit-yml.ts");
  const config = await readConfig(repoRoot);
  try {
    const current = parseInt(gitOutput(["rev-list", "--count", "HEAD"], repoRoot), 10);
    config.stats.totalCommits = current + 1;
  } catch {
    config.stats.totalCommits = 1;
  }
  try {
    const author = gitOutput(["config", "user.name"], repoRoot);
    if (author) config.stats.lastModifiedBy = author;
  } catch {
    /* keep existing */
  }
  await writeConfig(repoRoot, config);
  await generateReadme(repoRoot, config);
}

/** @deprecated Use prepareCommitMetadata before committing. */
export async function updateStats(repoRoot: string): Promise<void> {
  await prepareCommitMetadata(repoRoot);
}

export async function readFileIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}
