import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import JSZip from "jszip";
import type { DocumentType } from "../config/docugit-yml.ts";

const RESERVED_FILES = new Set([".docugit.yml", "README.md", ".git", ".gitignore"]);

export async function listOoxmlParts(repoRoot: string): Promise<string[]> {
  const parts: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const rel = relative(repoRoot, fullPath);
      if (rel.startsWith(".git")) continue;
      if (RESERVED_FILES.has(entry.name) && dir === repoRoot) continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        parts.push(rel);
      }
    }
  }

  await walk(repoRoot);
  return parts.sort();
}

export async function packToBuffer(repoRoot: string): Promise<Buffer> {
  const zip = new JSZip();
  const parts = await listOoxmlParts(repoRoot);

  for (const part of parts) {
    const content = await readFile(join(repoRoot, part));
    zip.file(part.replace(/\\/g, "/"), content);
  }

  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

export async function packToFile(repoRoot: string, outputPath: string): Promise<void> {
  const buffer = await packToBuffer(repoRoot);
  await writeFile(outputPath, buffer);
}

export async function unpackFromBuffer(buffer: Buffer, targetDir: string): Promise<void> {
  const zip = await JSZip.loadAsync(buffer);

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) {
      await mkdir(join(targetDir, path), { recursive: true });
    } else {
      const content = await file.async("nodebuffer");
      const fullPath = join(targetDir, path);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content);
    }
  }
}

export async function unpackFromFile(sourcePath: string, targetDir: string): Promise<void> {
  const buffer = await readFile(sourcePath);
  await unpackFromBuffer(buffer, targetDir);
}

export function inferTypeFromParts(parts: string[]): DocumentType | null {
  if (parts.some((p) => p.startsWith("word/"))) return "docx";
  if (parts.some((p) => p.startsWith("xl/"))) return "xlsx";
  if (parts.some((p) => p.startsWith("ppt/"))) return "pptx";
  return null;
}

export async function getDocumentType(repoRoot: string): Promise<DocumentType> {
  const { readConfig } = await import("../config/docugit-yml.ts");
  const config = await readConfig(repoRoot);
  return config.document.type;
}

export async function readPart(repoRoot: string, part: string): Promise<string> {
  return readFile(join(repoRoot, part), "utf-8");
}

export async function writePart(repoRoot: string, part: string, content: string): Promise<void> {
  const fullPath = join(repoRoot, part);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, "utf-8");
}

export async function partExists(repoRoot: string, part: string): Promise<boolean> {
  try {
    const s = await stat(join(repoRoot, part));
    return s.isFile();
  } catch {
    return false;
  }
}
