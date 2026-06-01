import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import JSZip from "jszip";
import type { DocumentType } from "../config/docugit-yml.ts";

/** Root files that are DocuGit metadata, not OOXML parts. */
const NON_OOXML_ROOT_FILES = new Set(["README.md", "AGENTS.md", "CLAUDE.md", "skills-lock.json"]);

function normalizePartPath(part: string): string {
  return part.replace(/\\/g, "/");
}

function sortOoxmlParts(parts: string[]): string[] {
  return [...parts].sort((a, b) => {
    const na = normalizePartPath(a);
    const nb = normalizePartPath(b);
    const rank = (part: string) => {
      if (part === "[Content_Types].xml") return 0;
      if (part === "_rels/.rels") return 1;
      return 2;
    };
    const ra = rank(na);
    const rb = rank(nb);
    if (ra !== rb) return ra - rb;
    return na.localeCompare(nb);
  });
}

export function isTextOoxmlPart(part: string): boolean {
  const normalized = normalizePartPath(part);
  return (
    normalized.endsWith(".xml") ||
    normalized.endsWith(".rels") ||
    normalized === "[Content_Types].xml"
  );
}

export async function listOoxmlParts(repoRoot: string): Promise<string[]> {
  const parts: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      // DocuGit metadata lives at repo root (.docugit.yml, .agents/, …).
      // Do not skip OOXML relationship parts such as _rels/.rels (filename starts with ".").
      if (dir === repoRoot && entry.name.startsWith(".")) continue;
      if (dir === repoRoot && NON_OOXML_ROOT_FILES.has(entry.name)) continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        parts.push(relative(repoRoot, fullPath));
      }
    }
  }

  await walk(repoRoot);
  return parts.sort();
}

export async function packToBuffer(repoRoot: string): Promise<Buffer> {
  const zip = new JSZip();
  const parts = sortOoxmlParts(await listOoxmlParts(repoRoot));

  for (const part of parts) {
    const content = await readFile(join(repoRoot, part));
    zip.file(normalizePartPath(part), content, {
      // Office rejects ZIPs with explicit directory entries (PowerPoint: "cannot read").
      createFolders: false,
      compression: "DEFLATE",
    });
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

export async function writePartBytes(repoRoot: string, part: string, content: Buffer): Promise<void> {
  const fullPath = join(repoRoot, part);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

export async function partExists(repoRoot: string, part: string): Promise<boolean> {
  try {
    const s = await stat(join(repoRoot, part));
    return s.isFile();
  } catch {
    return false;
  }
}
