import { mkdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import open from "open";
import { readConfig, formatDocumentFilename } from "../config/docugit-yml.ts";
import { applyPackedChanges } from "../merge/three-way.ts";
import { packToFile } from "../ooxml/pack.ts";

export function getOpenSessionDir(repoRoot: string): string {
  return join(repoRoot, ".docugit", "open-session");
}

export async function getOpenSessionFilePath(repoRoot: string): Promise<string> {
  const config = await readConfig(repoRoot);
  const filename = formatDocumentFilename(config.document.originalName, config.document.type);
  return join(getOpenSessionDir(repoRoot), filename);
}

export async function ensureOpenSessionFromRepo(
  repoRoot: string,
): Promise<{ filePath: string; created: boolean }> {
  const filePath = await getOpenSessionFilePath(repoRoot);
  await mkdir(getOpenSessionDir(repoRoot), { recursive: true });

  if (await openSessionFileExists(repoRoot)) {
    return { filePath, created: false };
  }

  await packToFile(repoRoot, filePath);
  return { filePath, created: true };
}

export async function removeOpenSessionFile(repoRoot: string): Promise<boolean> {
  const filePath = await getOpenSessionFilePath(repoRoot);
  try {
    await stat(filePath);
  } catch {
    return false;
  }
  await unlink(filePath);
  return true;
}

export async function openSessionFileExists(repoRoot: string): Promise<boolean> {
  try {
    await stat(await getOpenSessionFilePath(repoRoot));
    return true;
  } catch {
    return false;
  }
}

/** Open with the OS default handler (non-blocking). */
export async function openDocumentForEditing(filePath: string): Promise<void> {
  await open(filePath);
}

export async function applyOpenSessionIfPresent(repoRoot: string): Promise<string | null> {
  const filePath = await getOpenSessionFilePath(repoRoot);
  try {
    await stat(filePath);
  } catch {
    return null;
  }
  return applyPackedChanges(repoRoot, filePath);
}
