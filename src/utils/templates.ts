import { cp, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DocumentType } from "../config/docugit-yml.ts";
import { EMBEDDED_TEMPLATE_ZIPS } from "../generated/embedded-templates.ts";
import { unpackFromBuffer } from "../ooxml/pack.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_TYPES: DocumentType[] = ["docx", "xlsx", "pptx"];

function isCompiledBinary(): boolean {
  if (import.meta.url.includes("/$bunfs/")) {
    return true;
  }
  const execName = basename(process.execPath);
  return execName === "docugit" || execName === "docugit.exe";
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function hasFullTemplateSet(dir: string): Promise<boolean> {
  for (const type of TEMPLATE_TYPES) {
    if (!(await pathExists(join(dir, type)))) {
      return false;
    }
  }
  return true;
}

async function resolveTemplatesDir(): Promise<string | null> {
  const candidates = [
    join(__dirname, "../../templates"),
    join(dirname(process.execPath), "../templates"),
    join(dirname(process.execPath), "templates"),
  ];

  for (const candidate of candidates) {
    if (await hasFullTemplateSet(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function copyTemplate(type: DocumentType, targetDir: string): Promise<void> {
  if (!isCompiledBinary()) {
    const templatesDir = await resolveTemplatesDir();
    if (templatesDir) {
      await cp(join(templatesDir, type), targetDir, { recursive: true });
      return;
    }
  }

  await unpackFromBuffer(Buffer.from(EMBEDDED_TEMPLATE_ZIPS[type]), targetDir);
}
