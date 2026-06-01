import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export function getOpenSessionDir(repoRoot: string): string {
  return join(repoRoot, ".docugit", "open-session");
}

export async function prepareOpenSessionFile(repoRoot: string, filename: string): Promise<string> {
  const dir = getOpenSessionDir(repoRoot);
  await mkdir(dir, { recursive: true });
  return join(dir, filename);
}
