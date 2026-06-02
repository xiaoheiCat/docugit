import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";

/** Returned by resolveDocugit() when spawning via `bun run -- src/cli/index.ts`. */
export const DEV_DOCUGIT = "__docugit_dev_bun__";

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

function resolveBunPath(): string | null {
  try {
    if (process.platform === "win32") {
      const result = spawnSync("where", ["bun"], { encoding: "utf-8" });
      if (result.status === 0 && result.stdout.trim()) {
        return result.stdout.trim().split("\n")[0]?.trim() ?? null;
      }
      return null;
    }
    const result = execSync("which bun", { encoding: "utf-8" });
    return result.trim() || null;
  } catch {
    return null;
  }
}

/** Walk up from the Electron app path until we find the DocuGit tool repo (src/cli/index.ts). */
export function findToolRepoRoot(): string | null {
  let dir = app.getAppPath();
  for (let depth = 0; depth < 8; depth++) {
    const cliEntry = join(dir, "src", "cli", "index.ts");
    if (existsSync(cliEntry)) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

export function devDocugitCliPath(): string | null {
  const repoRoot = findToolRepoRoot();
  if (!repoRoot) {
    return null;
  }
  const cli = join(repoRoot, "src", "cli", "index.ts");
  return existsSync(cli) ? cli : null;
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
  if (!app.isPackaged) {
    const cli = devDocugitCliPath();
    if (cli && resolveBunPath()) {
      return DEV_DOCUGIT;
    }
  }

  const dir = bundledBinDir();
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

  const repoRoot = findToolRepoRoot();
  if (repoRoot) {
    const compiled = join(repoRoot, "dist", "docugit");
    if (existsSync(compiled)) {
      return compiled;
    }

    const cli = devDocugitCliPath();
    if (cli && resolveBunPath()) {
      return DEV_DOCUGIT;
    }
  }

  throw new Error(
    "fatal: docugit binary not found; run `bun run build` in the tool repo or install Bun for dev mode",
  );
}

export function formatDocugitPath(docugitPath: string): string {
  if (docugitPath === DEV_DOCUGIT) {
    const cli = devDocugitCliPath();
    return cli ? `bun run -- ${cli}` : "bun run -- (dev)";
  }
  return docugitPath;
}

export function docugitSpawnArgs(docugitPath: string, args: string[]): { command: string; args: string[] } {
  if (docugitPath === DEV_DOCUGIT) {
    const bun = resolveBunPath();
    const cli = devDocugitCliPath();
    if (!bun || !cli) {
      throw new Error("fatal: docugit dev runtime not found (install Bun and run from the DocuGit repo)");
    }
    return { command: bun, args: ["run", "--", cli, ...args] };
  }
  return { command: docugitPath, args };
}

export function getDataRoot(): string {
  return join(app.getPath("home"), ".docugit-desktop");
}

export function getBinDir(): string {
  return bundledBinDir();
}
