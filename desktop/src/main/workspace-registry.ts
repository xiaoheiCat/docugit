import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
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
import {
  broadcastCloneProgress,
  feedGitCloneProgress,
  parseGitCloneProgress,
} from "./git-clone-progress.ts";

const REGISTRY_FILE = "registry.json";
const SESSION_ACTIVE_WORKSPACE_KEY = "session.activeWorkspaceId";

function workspaceRecency(entry: WorkspaceEntry): number {
  return new Date(entry.lastOpenedAt ?? entry.createdAt).getTime();
}

function sortWorkspaces(workspaces: WorkspaceEntry[]): WorkspaceEntry[] {
  return [...workspaces].sort((a, b) => workspaceRecency(b) - workspaceRecency(a));
}

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
    return normalizeRegistry(JSON.parse(raw) as WorkspaceRegistry);
  } catch {
    return { workspaces: [] };
  }
}

function loadRegistrySync(): WorkspaceRegistry {
  try {
    const raw = readFileSync(registryPath(), "utf-8");
    return normalizeRegistry(JSON.parse(raw) as WorkspaceRegistry);
  } catch {
    return { workspaces: [] };
  }
}

function normalizeRegistry(registry: WorkspaceRegistry): WorkspaceRegistry {
  return {
    workspaces: registry.workspaces.map((entry) => ({
      ...entry,
      lastOpenedAt: entry.lastOpenedAt ?? entry.createdAt,
    })),
  };
}

async function saveRegistry(registry: WorkspaceRegistry): Promise<void> {
  await ensureDataRoot();
  await writeFile(registryPath(), JSON.stringify(registry, null, 2), "utf-8");
}

function saveRegistrySync(registry: WorkspaceRegistry): void {
  writeFileSync(registryPath(), JSON.stringify(registry, null, 2), "utf-8");
}

function stampWorkspace(registry: WorkspaceRegistry, id: string): boolean {
  const entry = registry.workspaces.find((w) => w.id === id);
  if (!entry) {
    return false;
  }
  entry.lastOpenedAt = new Date().toISOString();
  return true;
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
  workspaceId?: string,
): Promise<WorkspaceEntry> {
  const registry = await loadRegistry();
  const existing = registry.workspaces.find((w) => w.path === repoPath);
  if (existing) {
    return existing;
  }

  const id = workspaceId ?? randomUUID();
  const type = documentType ?? (await detectDocumentType(repoPath));
  const now = new Date().toISOString();
  const entry: WorkspaceEntry = {
    id,
    name,
    path: repoPath,
    documentType: type,
    remoteUrl,
    createdAt: now,
    lastOpenedAt: now,
    source,
  };
  registry.workspaces.push(entry);
  await saveRegistry(registry);
  return entry;
}

function resolveRepoPath(id: string, repoName: string): string {
  return join(workspacesRoot(), id, sanitizeName(repoName));
}

async function isDocuGitRepo(path: string): Promise<boolean> {
  return existsSync(join(path, ".docugit.yml"));
}

async function syncRegistryWithDisk(registry: WorkspaceRegistry): Promise<WorkspaceRegistry> {
  const knownPaths = new Set(registry.workspaces.map((w) => w.path));
  let changed = false;

  try {
    const bucketDirs = await readdir(workspacesRoot(), { withFileTypes: true });
    for (const bucket of bucketDirs) {
      if (!bucket.isDirectory()) continue;
      const bucketPath = join(workspacesRoot(), bucket.name);
      const repoDirs = await readdir(bucketPath, { withFileTypes: true });
      for (const repo of repoDirs) {
        if (!repo.isDirectory()) continue;
        const repoPath = join(bucketPath, repo.name);
        if (knownPaths.has(repoPath)) continue;
        if (!(await isDocuGitRepo(repoPath))) continue;

        const type = await detectDocumentType(repoPath);
        const now = new Date().toISOString();
        registry.workspaces.push({
          id: bucket.name,
          name: repo.name,
          path: repoPath,
          documentType: type,
          createdAt: now,
          lastOpenedAt: now,
          source: "discovered",
        });
        knownPaths.add(repoPath);
        changed = true;
      }
    }
  } catch {
    // workspaces root may not exist yet
  }

  const before = registry.workspaces.length;
  registry.workspaces = registry.workspaces.filter((w) => existsSync(w.path));
  if (registry.workspaces.length !== before) {
    changed = true;
  }

  if (changed) {
    await saveRegistry(registry);
  }

  return registry;
}

export async function listWorkspaces(): Promise<WorkspaceEntry[]> {
  const registry = await syncRegistryWithDisk(await loadRegistry());
  return sortWorkspaces(registry.workspaces);
}

export async function touchWorkspace(id: string): Promise<void> {
  const registry = await loadRegistry();
  if (!stampWorkspace(registry, id)) {
    return;
  }
  await saveRegistry(registry);
}

export function touchWorkspaceSync(id: string): void {
  const registry = loadRegistrySync();
  if (!stampWorkspace(registry, id)) {
    return;
  }
  saveRegistrySync(registry);
}

export { SESSION_ACTIVE_WORKSPACE_KEY };

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
  const entry = registry.workspaces.find((w) => w.id === id);
  if (!entry) {
    throw new Error(`fatal: workspace '${id}' not found`);
  }

  registry.workspaces = registry.workspaces.filter((w) => w.id !== id);
  await saveRegistry(registry);

  if (existsSync(entry.path)) {
    await rm(entry.path, { recursive: true, force: true });
  }

  const bucketPath = dirname(entry.path);
  if (bucketPath.startsWith(workspacesRoot()) && existsSync(bucketPath)) {
    try {
      const remaining = await readdir(bucketPath);
      if (remaining.length === 0) {
        await rm(bucketPath, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
  }
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

  return registerWorkspace(repoPath, repoName, "new", params.type, undefined, id);
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

  return registerWorkspace(repoPath, repoName, "init", undefined, undefined, id);
}

export async function cloneRepo(params: CloneRepoParams): Promise<WorkspaceEntry> {
  const urlParts = params.url.replace(/\.git$/, "").split("/");
  const defaultName = sanitizeName(urlParts[urlParts.length - 1] ?? "repository");
  const repoName = sanitizeName(params.name ?? defaultName);
  const id = randomUUID();
  const repoPath = resolveRepoPath(id, repoName);
  await mkdir(join(workspacesRoot(), id), { recursive: true });

  const progressBuffer = { tail: "" };
  broadcastCloneProgress({ percent: 0, phase: "starting" });

  const result = await runGit(
    join(workspacesRoot(), id),
    ["clone", "--progress", params.url, repoPath],
    {
      onStderrChunk: (chunk) => {
        feedGitCloneProgress(chunk, progressBuffer, broadcastCloneProgress);
      },
    },
  );

  if (progressBuffer.tail) {
    const tail = parseGitCloneProgress(progressBuffer.tail);
    if (tail) {
      broadcastCloneProgress(tail);
    }
  }

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || "git clone failed");
  }

  broadcastCloneProgress({ percent: 100, phase: "done" });

  if (!(await isDocuGitRepo(repoPath))) {
    await rm(repoPath, { recursive: true, force: true });
    throw new Error("fatal: not a DocuGit repository (missing .docugit.yml)");
  }

  return registerWorkspace(repoPath, repoName, "clone", undefined, params.url, id);
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

  return registerWorkspace(repoPath, repoName, "import", undefined, undefined, id);
}

async function updateWorkspaceRemoteUrl(id: string, remoteUrl?: string): Promise<void> {
  const registry = await loadRegistry();
  const entry = registry.workspaces.find((w) => w.id === id);
  if (!entry) {
    return;
  }
  if (remoteUrl) {
    entry.remoteUrl = remoteUrl;
  } else {
    delete entry.remoteUrl;
  }
  await saveRegistry(registry);
}

export async function getWorkspaceOriginUrl(workspaceId: string): Promise<string | null> {
  const workspace = await getWorkspace(workspaceId);
  const result = await runGit(workspace.path, ["remote", "get-url", "origin"]);
  if (result.exitCode !== 0) {
    return null;
  }
  return result.stdout.trim() || null;
}

export async function setWorkspaceOriginUrl(workspaceId: string, url: string): Promise<void> {
  const workspace = await getWorkspace(workspaceId);
  const trimmed = url.trim();
  const existing = await runGit(workspace.path, ["remote", "get-url", "origin"]);

  if (!trimmed) {
    if (existing.exitCode === 0) {
      const removed = await runGit(workspace.path, ["remote", "remove", "origin"]);
      if (removed.exitCode !== 0) {
        throw new Error(removed.stderr || removed.stdout || "git remote remove failed");
      }
    }
    await updateWorkspaceRemoteUrl(workspaceId, undefined);
    return;
  }

  if (existing.exitCode === 0) {
    const updated = await runGit(workspace.path, ["remote", "set-url", "origin", trimmed]);
    if (updated.exitCode !== 0) {
      throw new Error(updated.stderr || updated.stdout || "git remote set-url failed");
    }
  } else {
    const added = await runGit(workspace.path, ["remote", "add", "origin", trimmed]);
    if (added.exitCode !== 0) {
      throw new Error(added.stderr || added.stdout || "git remote add failed");
    }
  }
  await updateWorkspaceRemoteUrl(workspaceId, trimmed);
}
