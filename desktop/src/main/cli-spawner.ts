import { spawn } from "node:child_process";
import type { CommandResult } from "../shared/types.ts";
import { docugitSpawnArgs, getBinDir, resolveDocugit, resolveGit } from "./git-resolver.ts";

function buildEnv(): NodeJS.ProcessEnv {
  const git = resolveGit();
  const binDir = getBinDir();
  const sep = process.platform === "win32" ? ";" : ":";
  const pathParts = [binDir];
  if (git.path) {
    const gitDir = git.path.includes("/") || git.path.includes("\\")
      ? git.path.replace(/[/\\][^/\\]+$/, "")
      : "";
    if (gitDir) pathParts.push(gitDir);
  }
  return {
    ...process.env,
    PATH: `${pathParts.join(sep)}${sep}${process.env.PATH ?? ""}`,
    DOCUGIT_NO_OPEN: "1",
    GIT_TERMINAL_PROMPT: "0",
  };
}

export async function spawnCommand(
  command: string,
  args: string[],
  cwd: string,
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
      stderr += chunk.toString();
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

export async function runGit(cwd: string, args: string[]): Promise<CommandResult> {
  const git = resolveGit();
  return spawnCommand(git.path, args, cwd);
}
