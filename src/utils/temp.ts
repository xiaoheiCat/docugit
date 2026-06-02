import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import open from "open";

export async function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function removeTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export function shouldOpenExternally(): boolean {
  return process.env.DOCUGIT_NO_OPEN !== "1";
}

export async function writeAndOpenHtml(html: string, prefix = "docugit-report-"): Promise<string> {
  const dir = await createTempDir(prefix);
  const reportPath = join(dir, "report.html");
  await writeFile(reportPath, html, "utf-8");
  if (shouldOpenExternally()) {
    await open(reportPath);
  }
  return reportPath;
}

export async function writeTempFile(
  prefix: string,
  filename: string,
  content: string | Buffer,
): Promise<{ dir: string; path: string }> {
  const dir = await createTempDir(prefix);
  const path = join(dir, filename);
  await writeFile(path, content);
  return { dir, path };
}
