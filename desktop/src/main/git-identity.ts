import { getDataRoot } from "./git-resolver.ts";
import { resolveGit } from "./git-resolver.ts";
import { spawnCommand } from "./cli-spawner.ts";
import { readSettings, readSettingsSync, setSetting } from "./settings-store.ts";

export const GIT_USER_NAME_KEY = "git.userName";
export const GIT_USER_EMAIL_KEY = "git.userEmail";

export interface GitCommitIdentity {
  name: string | null;
  email: string | null;
}

export interface GitCommitIdentityInput {
  name: string;
  email: string;
}

async function runGlobalGitConfig(args: string[]): Promise<{ exitCode: number; stdout: string }> {
  const git = resolveGit();
  const result = await spawnCommand(git.path, args, getDataRoot());
  return { exitCode: result.exitCode, stdout: result.stdout };
}

export async function readGlobalGitIdentityFromCli(): Promise<GitCommitIdentity> {
  const nameResult = await runGlobalGitConfig(["config", "--global", "--get", "user.name"]);
  const emailResult = await runGlobalGitConfig(["config", "--global", "--get", "user.email"]);
  return {
    name: nameResult.exitCode === 0 ? nameResult.stdout.trim() || null : null,
    email: emailResult.exitCode === 0 ? emailResult.stdout.trim() || null : null,
  };
}

async function unsetGlobalGitConfig(key: string): Promise<void> {
  const current = await runGlobalGitConfig(["config", "--global", "--get", key]);
  if (current.exitCode !== 0) {
    return;
  }
  await runGlobalGitConfig(["config", "--global", "--unset", key]);
}

async function applyGlobalGitConfig(name: string | null, email: string | null): Promise<void> {
  if (name?.trim()) {
    await runGlobalGitConfig(["config", "--global", "user.name", name.trim()]);
  } else {
    await unsetGlobalGitConfig("user.name");
  }

  if (email?.trim()) {
    await runGlobalGitConfig(["config", "--global", "user.email", email.trim()]);
  } else {
    await unsetGlobalGitConfig("user.email");
  }
}

export async function loadGitCommitIdentity(): Promise<GitCommitIdentity> {
  const settings = await readSettings();
  const storedName = settings[GIT_USER_NAME_KEY]?.trim() || null;
  const storedEmail = settings[GIT_USER_EMAIL_KEY]?.trim() || null;
  const cli = await readGlobalGitIdentityFromCli();

  return {
    name: storedName ?? cli.name,
    email: storedEmail ?? cli.email,
  };
}

export async function applyGitCommitIdentity(name: string, email: string): Promise<void> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  await setSetting(GIT_USER_NAME_KEY, trimmedName);
  await setSetting(GIT_USER_EMAIL_KEY, trimmedEmail);
  await applyGlobalGitConfig(trimmedName || null, trimmedEmail || null);
}

export function gitIdentityEnvFromSettings(): Partial<NodeJS.ProcessEnv> {
  const settings = readSettingsSync();
  const name = settings[GIT_USER_NAME_KEY]?.trim();
  const email = settings[GIT_USER_EMAIL_KEY]?.trim();
  const env: Partial<NodeJS.ProcessEnv> = {};

  if (name) {
    env.GIT_AUTHOR_NAME = name;
    env.GIT_COMMITTER_NAME = name;
  }
  if (email) {
    env.GIT_AUTHOR_EMAIL = email;
    env.GIT_COMMITTER_EMAIL = email;
  }

  return env;
}
