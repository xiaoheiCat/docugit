import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import type {
  CloneRepoParams,
  DocumentType,
  ImportRepoParams,
  InitRepoParams,
  NewRepoParams,
  WorkspaceEntry,
  WorkspaceRegistry,
  WorkspaceSource,
} from "../shared/types.ts";
import { getDataRoot } from "./git-resolver.ts";
import { runDocugit, runGit } from "./cli-spawner.ts";

const REGISTRY_FILE = "registry.json";

function registryPath(): string {
  return join(getDataRoot(), REGISTRY_FILE);
}

function workspacesRoot(): string {
  return join(getDataRoot(), "workspaces");
}

async function ensureDataRoot(): Promise<void> {
  await mkdir(workspacesRoot(), { recursive: true });
}

async function loadRegistry(): Promise<WorkspaceRegistry> {
  await ensureDataRoot();
  try {
    const raw = await readFile(registryPath(), "utf-8");
    return JSON.parse(raw) as WorkspaceRegistry;
  } catch {
    return { workspaces: [] };
  }
}

async function saveRegistry(registry: WorkspaceRegistry): Promise<void> {
  await ensureDataRoot();
  await writeFile(registryPath(), JSON.stringify(registry, null, 2), "utf-8");
}

function sanitizeName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_").slice(0, 64) || "repository";
}

async function detectDocumentType(repoPath: string): Promise<DocumentType> {
  const raw = await readFile(join(repoPath, ".docugit.yml"), "utf-8");
  if (/type:\s*docx/.test(raw)) return "docx";
  if (/type:\s*xlsx/.test(raw)) return "xlsx";
  if (/type:\s*pptx/.test(raw)) return "pptx";
  return "docx";
}

async function registerWorkspace(
  repoPath: string,
  name: string,
  source: WorkspaceSource,
  documentType?: DocumentType,
  remoteUrl?: string,
): Promise<WorkspaceEntry> {
  const registry = await loadRegistry();
  const id = randomUUID();
  const type = documentType ?? (await detectDocumentType(repoPath));
  const entry: WorkspaceEntry = {
    id,
    name,
    path: repoPath,
    documentType: type,
    remoteUrl,
    createdAt: new Date().toISOString(),
    source,
  };
  registry.workspaces.push(entry);
  await saveRegistry(registry);
  return entry;
}

function resolveRepoPath(id: string, repoName: string): string {
  return join(workspacesRoot(), id, sanitizeName(repoName));
}

export async function listWorkspaces(): Promise<WorkspaceEntry[]> {
  const registry = await loadRegistry();
  return registry.workspaces;
}

export async function getWorkspace(id: string): Promise<WorkspaceEntry> {
  const registry = await loadRegistry();
  const entry = registry.workspaces.find((w) => w.id === id);
  if (!entry) {
    throw new Error(`fatal: workspace '${id}' not found`);
  }
  return entry;
}

export async function removeWorkspace(id: string): Promise<void> {
  const registry = await loadRegistry();
  registry.workspaces = registry.workspaces.filter((w) => w.id !== id);
  await saveRegistry(registry);
}

export async function createNew(params: NewRepoParams): Promise<WorkspaceEntry> {
  const id = randomUUID();
  const repoName = sanitizeName(params.name);
  const repoPath = resolveRepoPath(id, repoName);
  await mkdir(repoPath, { recursive: true });

  const result = await runDocugit(repoPath, ["new", params.type, params.name, "-d", repoPath]);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || "docugit new failed");
  }

  return registerWorkspace(repoPath, repoName, "new", params.type);
}

export async function createInit(params: InitRepoParams): Promise<WorkspaceEntry> {
  const sourceBase = basename(params.sourceFile).replace(/\.(docx|xlsx|pptx)$/i, "");
  const id = randomUUID();
  const repoName = sanitizeName(sourceBase);
  const repoPath = resolveRepoPath(id, repoName);
  await mkdir(repoPath, { recursive: true });

  const result = await runDocugit(repoPath, ["init", params.sourceFile, "-d", repoPath]);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || "docugit init failed");
  }

  return registerWorkspace(repoPath, repoName, "init");
}

export async function cloneRepo(params: CloneRepoParams): Promise<WorkspaceEntry> {
  const urlParts = params.url.replace(/\.git$/, "").split("/");
  const defaultName = sanitizeName(urlParts[urlParts.length - 1] ?? "repository");
  const repoName = sanitizeName(params.name ?? defaultName);
  const id = randomUUID();
  const repoPath = resolveRepoPath(id, repoName);
  await mkdir(join(workspacesRoot(), id), { recursive: true });

  const result = await runGit(join(workspacesRoot(), id), ["clone", params.url, repoPath]);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || "git clone failed");
  }

  return registerWorkspace(repoPath, repoName, "clone", undefined, params.url);
}

async function isDocuGitRepo(path: string): Promise<boolean> {
  return existsSync(join(path, ".docugit.yml"));
}

export async function importRepo(params: ImportRepoParams): Promise<WorkspaceEntry> {
  if (!(await isDocuGitRepo(params.sourcePath))) {
    throw new Error("fatal: not a DocuGit repository (missing .docugit.yml)");
  }

  const sourceName = params.name ?? basename(params.sourcePath);
  const repoName = sanitizeName(sourceName);
  const id = randomUUID();
  const repoPath = resolveRepoPath(id, repoName);
  await mkdir(repoPath, { recursive: true });

  await cp(params.sourcePath, repoPath, { recursive: true, force: true });

  return registerWorkspace(repoPath, repoName, "import");
}
