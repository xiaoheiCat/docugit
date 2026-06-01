import { spawnSync } from "node:child_process";

export function runGit(args: string[], cwd?: string): number {
  const result = spawnSync("git", args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(`Failed to run git: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

export function gitOutput(args: string[], cwd?: string): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    env: process.env,
  });
  if (result.error) {
    throw new Error(`Failed to run git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

export function isGitRepo(cwd: string): boolean {
  try {
    gitOutput(["rev-parse", "--git-dir"], cwd);
    return true;
  } catch {
    return false;
  }
}

export function passthroughToGit(args: string[]): number {
  return runGit(args);
}
