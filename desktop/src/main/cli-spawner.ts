import { spawn } from "node:child_process";
import { join } from "node:path";
import type { CommandResult } from "../shared/types.ts";
import {
  bundledGitRoot,
  docugitSpawnArgs,
  getBinDir,
  resolveDocugit,
  resolveGit,
} from "./git-resolver.ts";
import { gitIdentityEnvFromSettings } from "./git-identity.ts";

function bundledGitPathEntries(gitRoot: string): string[] {
  if (process.platform === "win32") {
    return [join(gitRoot, "cmd"), join(gitRoot, "mingw64", "bin"), gitRoot];
  }
  return [join(gitRoot, "bin")];
}

function buildEnv(): NodeJS.ProcessEnv {
  const git = resolveGit();
  const binDir = getBinDir();
  const sep = process.platform === "win32" ? ";" : ":";
  const pathParts = [binDir];

  if (git.source === "bundled") {
    const gitRoot = bundledGitRoot();
    if (gitRoot) {
      pathParts.push(...bundledGitPathEntries(gitRoot));
    }
  } else if (git.path) {
    const gitDir = git.path.includes("/") || git.path.includes("\\")
      ? git.path.replace(/[/\\][^/\\]+$/, "")
      : "";
    if (gitDir) {
      pathParts.push(gitDir);
    }
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...gitIdentityEnvFromSettings(),
    PATH: `${pathParts.join(sep)}${sep}${process.env.PATH ?? ""}`,
    DOCUGIT_NO_OPEN: "1",
    GIT_TERMINAL_PROMPT: "0",
  };

  if (git.source === "bundled") {
    const gitRoot = bundledGitRoot();
    if (gitRoot) {
      if (process.platform === "darwin") {
        env.GIT_EXEC_PATH = join(gitRoot, "libexec", "git-core");
      }
    }
  }

  return env;
}

export interface SpawnCommandOptions {
  onStderrChunk?: (chunk: string) => void;
}

export async function spawnCommand(
  command: string,
  args: string[],
  cwd: string,
  options?: SpawnCommandOptions,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: buildEnv(),
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      options?.onStderrChunk?.(text);
    });

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}${err.message}`.trim(),
      });
    });
  });
}

export async function runDocugit(cwd: string, args: string[]): Promise<CommandResult> {
  const docugitPath = resolveDocugit();
  const spawnArgs = docugitSpawnArgs(docugitPath, args);
  return spawnCommand(spawnArgs.command, spawnArgs.args, cwd);
}

export async function runGit(
  cwd: string,
  args: string[],
  options?: SpawnCommandOptions,
): Promise<CommandResult> {
  const git = resolveGit();
  return spawnCommand(git.path, args, cwd, options);
}
