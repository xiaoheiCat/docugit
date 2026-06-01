import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { unpackFromFile } from "../src/ooxml/pack.ts";
import type { DocumentType } from "../src/config/docugit-yml.ts";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const TEMPLATES_DIR = join(ROOT, "templates");

const SOURCE_FILES: Record<DocumentType, string> = {
  docx: "/Users/xiaoheicat/Downloads/Template.docx",
  xlsx: "/Users/xiaoheicat/Downloads/Template.xlsx",
  pptx: "/Users/xiaoheicat/Downloads/Template.pptx",
};

const TEMPLATE_AUTHOR = "DocuGit";
const TEMPLATE_TIMESTAMP = "2020-01-01T00:00:00Z";

const PERSONAL_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /xiaoheiCat/gi, replacement: TEMPLATE_AUTHOR },
  { pattern: /\/Users\/xiaoheicat(?:\/[^"'\s<]*)?/gi, replacement: "" },
  {
    pattern: /<dcterms:created[^>]*>[^<]*<\/dcterms:created>/g,
    replacement: `<dcterms:created xsi:type="dcterms:W3CDTF">${TEMPLATE_TIMESTAMP}</dcterms:created>`,
  },
  {
    pattern: /<dcterms:modified[^>]*>[^<]*<\/dcterms:modified>/g,
    replacement: `<dcterms:modified xsi:type="dcterms:W3CDTF">${TEMPLATE_TIMESTAMP}</dcterms:modified>`,
  },
  {
    pattern: /<dc:creator>[^<]*<\/dc:creator>/g,
    replacement: `<dc:creator>${TEMPLATE_AUTHOR}</dc:creator>`,
  },
  {
    pattern: /<cp:lastModifiedBy>[^<]*<\/cp:lastModifiedBy>/g,
    replacement: `<cp:lastModifiedBy>${TEMPLATE_AUTHOR}</cp:lastModifiedBy>`,
  },
  {
    pattern: /<mc:AlternateContent[^>]*>[\s\S]*?<\/mc:AlternateContent>/g,
    replacement: "",
  },
  {
    pattern: /<Relationship[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/package\/2006\/relationships\/metadata\/thumbnail"[^>]*\/>/g,
    replacement: "",
  },
  {
    pattern: /<Relationship[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/package\/2006\/relationships\/metadata\/thumbnail"[^>]*><\/Relationship>/g,
    replacement: "",
  },
  {
    pattern: /<Default Extension="jpeg" ContentType="image\/jpeg"\/>/g,
    replacement: "",
  },
];

async function isTextLike(file: string): Promise<boolean> {
  const ext = extname(file).toLowerCase();
  return [".xml", ".rels"].includes(ext) || file.endsWith("[Content_Types].xml");
}

export async function sanitizeContent(content: string): Promise<string> {
  let result = content;
  for (const { pattern, replacement } of PERSONAL_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

async function sanitizeTree(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await sanitizeTree(fullPath);
      continue;
    }
    if (entry.name === "thumbnail.jpeg" || entry.name === "thumbnail.jpg") {
      await rm(fullPath);
      continue;
    }
    if (await isTextLike(fullPath)) {
      const content = await readFile(fullPath, "utf-8");
      await writeFile(fullPath, await sanitizeContent(content), "utf-8");
    }
  }
}

async function syncTemplate(type: DocumentType, sourceFile: string): Promise<void> {
  const targetDir = join(TEMPLATES_DIR, type);
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await unpackFromFile(sourceFile, targetDir);
  await sanitizeTree(targetDir);
}

async function main(): Promise<void> {
  for (const [type, source] of Object.entries(SOURCE_FILES) as Array<[DocumentType, string]>) {
    try {
      await stat(source);
    } catch {
      throw new Error(`Template source file not found: ${source}`);
    }
    await syncTemplate(type, source);
    console.log(`Synced and sanitized template: ${type} <- ${source}`);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
