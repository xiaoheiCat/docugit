import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { platform } from "node:os";
import { join } from "node:path";

export function getOpenSessionDir(repoRoot: string): string {
  return join(repoRoot, ".docugit", "open-session");
}

export async function prepareOpenSessionFile(repoRoot: string, filename: string): Promise<string> {
  const dir = getOpenSessionDir(repoRoot);
  await mkdir(dir, { recursive: true });
  return join(dir, filename);
}

/** Clear platform-specific read-only markers before Office opens the file. */
export async function ensureOfficeWritable(filePath: string): Promise<void> {
  switch (platform()) {
    case "darwin":
      spawnSync("xattr", ["-c", filePath], { stdio: "ignore" });
      break;
    case "win32":
      spawnSync("attrib", ["-R", filePath], { shell: true, stdio: "ignore" });
      break;
    default:
      break;
  }
}
