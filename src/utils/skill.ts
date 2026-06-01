import { spawnSync } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import embeddedSkillMd from "../../skills/docugit/SKILL.md" with { type: "text" };

const __dirname = dirname(fileURLToPath(import.meta.url));

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Dev / sidecar layouts where skills/ sits next to the executable or source tree. */
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

async function writeEmbeddedSkillDir(targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, "SKILL.md"), embeddedSkillMd, "utf-8");
}

function tryNpxSkillsAdd(skillSource: string, repoRoot: string): { ok: boolean; reason?: string } {
  const npxCheck = spawnSync("npx", ["--version"], { encoding: "utf-8" });
  if (npxCheck.error || npxCheck.status !== 0) {
    return { ok: false, reason: "npx is not available" };
  }

  const result = spawnSync("npx", ["skills", "add", skillSource, "-y"], {
    encoding: "utf-8",
    stdio: "pipe",
    cwd: repoRoot,
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

export async function setupRepoSkill(repoRoot: string): Promise<void> {
  const repoSkillDir = join(repoRoot, ".agents/skills/docugit");

  // Bundled at compile time; released into the document repo on init/new.
  await writeEmbeddedSkillDir(repoSkillDir);

  const npxSource = (await resolveDocuGitSkillSource()) ?? repoSkillDir;
  const npxResult = tryNpxSkillsAdd(npxSource, repoRoot);
  if (!npxResult.ok) {
    console.warn(
      [
        `Warning: Failed to initialize DocuGit Skill via npx (${npxResult.reason ?? "unknown error"}).`,
        "The Skill is available in .agents/skills/docugit/ in this repository.",
      ].join("\n"),
    );
  }
}
