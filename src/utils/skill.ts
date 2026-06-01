import { spawnSync } from "node:child_process";
import { cp, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function resolveDocuGitSkillSource(): Promise<string | null> {
  const candidates = [
    join(__dirname, "../../skills/docugit"),
    join(dirname(process.execPath), "../skills/docugit"),
    join(dirname(process.execPath), "skills/docugit"),
  ];

  for (const candidate of candidates) {
    const skillFile = join(candidate, "SKILL.md");
    if (await pathExists(skillFile)) {
      return resolve(candidate);
    }
  }

  return null;
}

function tryNpxSkillsAdd(skillSource: string): { ok: boolean; reason?: string } {
  const npxCheck = spawnSync("npx", ["--version"], { encoding: "utf-8" });
  if (npxCheck.error || npxCheck.status !== 0) {
    return { ok: false, reason: "npx is not available" };
  }

  const result = spawnSync("npx", ["skills", "add", skillSource, "-y"], {
    encoding: "utf-8",
    stdio: "pipe",
  });

  if (result.status === 0) {
    return { ok: true };
  }

  const stderr = result.stderr?.trim() || result.stdout?.trim();
  return {
    ok: false,
    reason: stderr || `skills add exited with code ${result.status ?? "unknown"}`,
  };
}

async function copySkillToRepo(repoRoot: string, skillSource: string): Promise<void> {
  const target = join(repoRoot, ".agents/skills/docugit");
  await cp(skillSource, target, { recursive: true, force: true });
}

export async function setupRepoSkill(repoRoot: string): Promise<void> {
  const skillSource = await resolveDocuGitSkillSource();
  if (!skillSource) {
    console.warn(
      "Warning: DocuGit Skill source not found. To work with an AI agent, install the Skill manually into a directory supported by your agent.",
    );
    return;
  }

  const npxResult = tryNpxSkillsAdd(skillSource);
  if (npxResult.ok) {
    return;
  }

  console.warn(
    [
      `Warning: Failed to initialize DocuGit Skill via npx (${npxResult.reason ?? "unknown error"}).`,
      "To work with an AI agent, install the Skill manually into a directory supported by your agent.",
    ].join("\n"),
  );

  try {
    await copySkillToRepo(repoRoot, skillSource);
  } catch {
    /* fallback failed silently */
  }
}
