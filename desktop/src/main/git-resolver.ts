import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";

function bundledBinDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "bin");
  }
  return join(app.getAppPath(), "resources", "bin");
}

function bundledGitPath(): string | null {
  const dir = bundledBinDir();
  const candidates =
    process.platform === "win32"
      ? [join(dir, "git.exe"), join(dir, "cmd", "git.exe")]
      : [join(dir, "git")];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function systemGitPath(): string | null {
  try {
    if (process.platform === "win32") {
      const result = spawnSync("where", ["git"], { encoding: "utf-8" });
      if (result.status === 0 && result.stdout.trim()) {
        return result.stdout.trim().split("\n")[0]?.trim() ?? null;
      }
      return null;
    }
    const result = execSync("which git", { encoding: "utf-8" });
    return result.trim() || null;
  } catch {
    return null;
  }
}

export interface GitResolution {
  path: string;
  source: "system" | "bundled";
}

export function resolveGit(): GitResolution {
  const system = systemGitPath();
  if (system) {
    return { path: system, source: "system" };
  }
  const bundled = bundledGitPath();
  if (bundled) {
    return { path: bundled, source: "bundled" };
  }
  throw new Error("fatal: git not found; install Git or use a DocuGit Desktop build with bundled git");
}

export function resolveDocugit(): string {
  const dir = bundledBinDir();
  const appPath = app.getAppPath();
  const repoRoot = app.isPackaged
    ? join(appPath, "..", "..")
    : join(appPath, "..", "..");
  const devFallback = join(repoRoot, "dist", "docugit");
  const devSource = join(repoRoot, "src", "cli", "index.ts");
  const candidates =
    process.platform === "win32"
      ? [join(dir, "docugit.exe"), join(dir, "docugit-windows-amd64.exe")]
      : [
          join(dir, "docugit"),
          join(dir, "docugit-darwin-arm64"),
          join(dir, "docugit-darwin-amd64"),
        ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  if (existsSync(devFallback)) {
    return devFallback;
  }

  if (existsSync(devSource)) {
    return process.platform === "win32" ? "bun.exe" : "bun";
  }

  throw new Error("fatal: docugit binary not found");
}

export function docugitSpawnArgs(docugitPath: string, args: string[]): { command: string; args: string[] } {
  const appPath = app.getAppPath();
  const repoRoot = join(appPath, "..", "..");
  const devSource = join(repoRoot, "src", "cli", "index.ts");
  if ((docugitPath === "bun" || docugitPath === "bun.exe") && existsSync(devSource)) {
    return { command: docugitPath, args: ["run", devSource, ...args] };
  }
  return { command: docugitPath, args };
}

export function getDataRoot(): string {
  return join(app.getPath("home"), ".docugit-desktop");
}

export function getBinDir(): string {
  return bundledBinDir();
}
