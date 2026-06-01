import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import {
  createDefaultConfig,
  detectDocumentType,
  generateReadme,
  writeConfig,
  formatDocumentFilename,
  normalizeDocumentName,
  readConfig,
  type Author,
  type DocumentType,
} from "../config/docugit-yml.ts";
import { unpackFromFile, inferTypeFromParts, listOoxmlParts } from "../ooxml/pack.ts";
import { runGit, gitOutput, isGitRepo } from "../utils/git.ts";
import { setupRepoSkill } from "../utils/skill.ts";
import { setupDocumentAgentDocs } from "../config/document-agents-md.ts";
import { copyTemplate } from "./templates.ts";

export function getRepoRoot(cwd = process.cwd()): string {
  return resolve(cwd);
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

  const { repairOoxmlPackage, summarizeRepair } = await import("../ooxml/repair.ts");
  const repair = await repairOoxmlPackage(targetDir, {
    sourceFileDir: resolve(dirname(sourceFile)),
    documentType: type,
  });
  const summary = summarizeRepair(repair);
  if (summary !== "no repairs needed") {
    console.warn(`Repaired on init: ${summary}.`);
  }

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
  await setupDocumentAgentDocs(targetDir);

  runGit(["add", "."], targetDir);
  runGit(["commit", "-m", `docugit: init ${originalName}`], targetDir);
}

async function isDirectoryEmpty(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.length === 0;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }
    throw err;
  }
}

function documentBaseName(name: string, type: DocumentType): string {
  const filename = formatDocumentFilename(normalizeDocumentName(name, type), type);
  const ext = `.${type}`;
  return filename.endsWith(ext) ? filename.slice(0, -ext.length) : filename;
}

/** Empty `-d` dir gets the repo; non-empty dirs get `<document-base>/` underneath. */
export async function resolveNewRepoTarget(
  parentDir: string,
  name: string,
  type: DocumentType,
): Promise<string> {
  const parent = resolve(parentDir);
  if (await isDirectoryEmpty(parent)) {
    return parent;
  }

  const subdir = join(parent, documentBaseName(name, type));
  if (!(await isDirectoryEmpty(subdir))) {
    throw new Error(`fatal: ${subdir} already exists and is not empty`);
  }
  return subdir;
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

  await setupRepoSkill(targetDir);
  await setupDocumentAgentDocs(targetDir);

  runGit(["add", "."], targetDir);
  runGit(["commit", "-m", `docugit: create ${originalName}`], targetDir);
}

export async function exportDocument(repoRoot: string, outputPath?: string): Promise<string> {
  const { readConfig } = await import("../config/docugit-yml.ts");
  const { packToFile } = await import("../ooxml/pack.ts");
  const config = await readConfig(repoRoot);
  const filename = formatDocumentFilename(config.document.originalName, config.document.type);
  const out = outputPath ?? join(repoRoot, "..", filename);
  await packToFile(repoRoot, out);
  return out;
}

export async function getDocumentName(repoRoot: string): Promise<string> {
  const config = await readConfig(repoRoot);
  return formatDocumentFilename(config.document.originalName, config.document.type);
}

export async function renameDocument(repoRoot: string, newName: string): Promise<string> {
  const config = await readConfig(repoRoot);
  const normalized = normalizeDocumentName(newName, config.document.type);
  config.document.originalName = normalized;
  await writeConfig(repoRoot, config);
  await generateReadme(repoRoot, config);
  return normalized;
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
