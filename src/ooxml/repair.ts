import { readFile, stat } from "node:fs/promises";
import { basename, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { posix } from "node:path/posix";
import type { DocumentType } from "../config/docugit-yml.ts";
import { listOoxmlParts, writePart, writePartBytes } from "./pack.ts";

const EXTERNAL_URI = /^(?:file:|https?:)/i;

const DEFAULT_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  wdp: "image/vnd.ms-photo",
  emf: "image/x-emf",
  wmf: "image/x-wmf",
  mp4: "video/mp4",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export interface PackPart {
  path: string;
  content: Buffer;
}

export interface RepairContext {
  repoRoot: string;
  documentType: DocumentType;
  sourceFileDir?: string;
  warn?: (message: string) => void;
}

export interface OoxmlRepairResult {
  embedded: number;
  skipped: number;
  contentTypes: number;
  linkAttributesRemoved: number;
  warnings: string[];
}

interface ParsedRelationship {
  full: string;
  attrs: string;
  id: string;
  type: string;
  target: string;
  targetMode: string | null;
}

function normalizePartPath(part: string): string {
  return part.replace(/\\/g, "/");
}

function relsPartDir(relsPart: string): string {
  const normalized = normalizePartPath(relsPart);
  const parent = posix.dirname(normalized);
  if (posix.basename(parent) !== "_rels") {
    throw new Error(`Not a relationship part: ${relsPart}`);
  }
  const sourceDir = posix.dirname(parent);
  return sourceDir === "." ? "" : sourceDir;
}

function resolveOpcTarget(relsPart: string, target: string): string {
  const normalizedTarget = target.replace(/\\/g, "/");
  if (normalizedTarget.startsWith("/")) {
    return normalizedTarget.slice(1);
  }
  const sourceDir = relsPartDir(relsPart);
  const base = sourceDir ? `${sourceDir}/` : "";
  return posix.normalize(`${base}${normalizedTarget}`);
}

function relativeOpcTarget(fromDir: string, toPart: string): string {
  const from = fromDir ? `${fromDir}/` : "";
  return posix.relative(from, toPart).replace(/\\/g, "/");
}

function fileUriToPath(uri: string): string | null {
  if (!/^file:/i.test(uri)) return null;
  try {
    return fileURLToPath(uri);
  } catch {
    const raw = uri.replace(/^file:(\/\/\/|\/\/|\/)/i, "");
    if (/^[a-zA-Z]:[\\/]/.test(raw)) {
      return raw.replace(/\//g, "\\");
    }
    if (raw.startsWith("/")) return raw;
    return `/${raw}`;
  }
}

function parseRelationship(full: string, attrs: string): ParsedRelationship {
  return {
    full,
    attrs,
    id: attrs.match(/\bId="([^"]*)"/)?.[1] ?? "",
    type: attrs.match(/\bType="([^"]*)"/)?.[1] ?? "",
    target: attrs.match(/\bTarget="([^"]*)"/)?.[1] ?? "",
    targetMode: attrs.match(/\bTargetMode="([^"]*)"/)?.[1] ?? null,
  };
}

function isExternalRelationship(rel: ParsedRelationship): boolean {
  return rel.targetMode === "External" || EXTERNAL_URI.test(rel.target);
}

function defaultMediaDir(relsPart: string, documentType: DocumentType): string {
  const relsDir = relsPartDir(relsPart);
  if (documentType === "pptx") {
    if (relsDir.startsWith("ppt/")) return "ppt/media";
  }
  if (documentType === "docx") {
    if (relsDir.startsWith("word/")) return "word/media";
  }
  if (documentType === "xlsx") {
    if (relsDir.startsWith("xl/")) return "xl/media";
  }
  return relsDir ? `${relsDir}/media` : "media";
}

async function pathIsFile(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
}

/** Resolve external targets: absolute path first, then OPC-relative, repo-root, source dir. */
export async function resolveExternalFile(
  target: string,
  relsPart: string,
  ctx: RepairContext,
): Promise<string | null> {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (path: string | null | undefined) => {
    if (!path) return;
    const resolved = resolvePath(path);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    candidates.push(resolved);
  };

  if (/^file:/i.test(target)) {
    push(fileUriToPath(target));
  } else if (/^[a-zA-Z]:[\\/]/.test(target) || target.startsWith("/")) {
    push(target);
  }

  const opcRelative = resolveOpcTarget(relsPart, target.replace(/^file:\/\/?/i, ""));
  push(join(ctx.repoRoot, ...opcRelative.split("/")));

  if (!/^file:/i.test(target) && !/^[a-zA-Z]:[\\/]/.test(target) && !target.startsWith("/")) {
    push(join(ctx.repoRoot, target.replace(/\\/g, "/")));
  }

  const fileName = basename(fileUriToPath(target) ?? target);
  if (fileName) {
    push(join(ctx.repoRoot, fileName));
    if (ctx.sourceFileDir) {
      push(join(ctx.sourceFileDir, fileName));
      push(join(ctx.sourceFileDir, target.replace(/\\/g, "/")));
    }
  }

  for (const candidate of candidates) {
    if (await pathIsFile(candidate)) return candidate;
  }
  return null;
}

function chooseMediaPart(existingParts: Set<string>, mediaDir: string, sourcePath: string): string {
  const fileName = basename(sourcePath);
  let candidate = normalizePartPath(`${mediaDir}/${fileName}`);
  if (!existingParts.has(candidate)) return candidate;

  const dot = fileName.lastIndexOf(".");
  const stem = dot >= 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot >= 0 ? fileName.slice(dot) : "";
  let index = 2;
  while (existingParts.has(candidate)) {
    candidate = normalizePartPath(`${mediaDir}/${stem}_${index}${ext}`);
    index += 1;
  }
  return candidate;
}

function renderInternalRelationship(rel: ParsedRelationship, relsPart: string, embeddedPart: string): string {
  const relsDir = relsPartDir(relsPart);
  const target = relativeOpcTarget(relsDir, embeddedPart);
  let nextAttrs = rel.attrs
    .replace(/\s*TargetMode="External"/g, "")
    .replace(/\bTarget="[^"]*"/, `Target="${target}"`);
  if (!/\bTarget="/.test(nextAttrs)) {
    nextAttrs += ` Target="${target}"`;
  }
  return `<Relationship${nextAttrs}/>`;
}

function ensureDefaultContentType(content: string, extension: string): { xml: string; fixed: number } {
  const ext = extension.toLowerCase();
  const contentType = DEFAULT_CONTENT_TYPES[ext];
  if (!contentType) return { xml: content, fixed: 0 };
  if (content.includes(`Extension="${ext}"`) || content.includes(`Extension="${ext.toUpperCase()}"`)) {
    return { xml: content, fixed: 0 };
  }
  const insert = `<Default Extension="${ext}" ContentType="${contentType}"/>`;
  const patched = content.replace(/<Types\b[^>]*>/, (head) => `${head}${insert}`);
  return { xml: patched, fixed: 1 };
}

function patchContentTypesXml(content: string): { xml: string; fixed: number } {
  let fixed = 0;
  let xml = content
    .replace(/ContentType="image\/\.jpg"/g, () => {
      fixed += 1;
      return 'ContentType="image/jpeg"';
    })
    .replace(/ContentType="image\/jpg"/g, () => {
      fixed += 1;
      return 'ContentType="image/jpeg"';
    });
  return { xml, fixed };
}

function parseRelationships(xml: string): Array<{ full: string; attrs: string }> {
  return [...xml.matchAll(/<Relationship\b([^>]*)\/>/g)].map((match) => ({
    full: match[0],
    attrs: match[1] ?? "",
  }));
}

function relsPartForSourcePart(sourcePart: string): string | null {
  const normalized = normalizePartPath(sourcePart);
  if (normalized.endsWith(".rels") || normalized === "[Content_Types].xml") return null;
  const dir = posix.dirname(normalized);
  const base = posix.basename(normalized);
  return normalizePartPath(`${dir}/_rels/${base}.rels`);
}

function internalImageLinkIds(relsXml: string): Set<string> {
  const ids = new Set<string>();
  for (const item of parseRelationships(relsXml)) {
    const rel = parseRelationship(item.full, item.attrs);
    if (!rel.id || isExternalRelationship(rel)) continue;
    if (!rel.type.includes("image")) continue;
    ids.add(rel.id);
  }
  return ids;
}

function stripRLinkAttributes(xml: string, relIds: Iterable<string>): { xml: string; removed: number } {
  let removed = 0;
  let nextXml = xml;
  for (const relId of relIds) {
    const escaped = relId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\sr:link="${escaped}"`, "g");
    nextXml = nextXml.replace(pattern, () => {
      removed += 1;
      return "";
    });
  }
  return { xml: nextXml, removed };
}

function repairStaleImageLinks(parts: Map<string, Buffer>): number {
  let removed = 0;

  for (const [part, content] of parts) {
    if (!part.endsWith(".xml") || part.endsWith(".rels")) continue;
    const relsPart = relsPartForSourcePart(part);
    if (!relsPart) continue;
    const relsContent = parts.get(relsPart);
    if (!relsContent) continue;

    const linkIds = internalImageLinkIds(relsContent.toString("utf-8"));
    if (linkIds.size === 0) continue;

    const original = content.toString("utf-8");
    const stripped = stripRLinkAttributes(original, linkIds);
    if (stripped.removed > 0) {
      parts.set(part, Buffer.from(stripped.xml, "utf-8"));
      removed += stripped.removed;
    }
  }

  return removed;
}

async function embedExternalRelationshipsInXml(
  xml: string,
  relsPart: string,
  ctx: RepairContext,
  existingParts: Map<string, Buffer>,
): Promise<{ xml: string; embedded: number; skipped: number; warnings: string[]; contentTypes: number }> {
  let embedded = 0;
  let skipped = 0;
  const warnings: string[] = [];
  let contentTypes = 0;
  let nextXml = xml;
  const partPaths = new Set(existingParts.keys());

  for (const item of parseRelationships(xml)) {
    const rel = parseRelationship(item.full, item.attrs);
    if (!isExternalRelationship(rel)) continue;

    if (/^https?:/i.test(rel.target)) {
      const message = `${relsPart}: skipped external URL (Id=${rel.id}): ${rel.target}`;
      warnings.push(message);
      ctx.warn?.(message);
      skipped += 1;
      continue;
    }

    const sourcePath = await resolveExternalFile(rel.target, relsPart, ctx);
    if (!sourcePath) {
      const message = `${relsPart}: external file not found (Id=${rel.id}): ${rel.target}`;
      warnings.push(message);
      ctx.warn?.(message);
      skipped += 1;
      continue;
    }

    const mediaDir = defaultMediaDir(relsPart, ctx.documentType);
    const mediaPart = chooseMediaPart(partPaths, mediaDir, sourcePath);
    const bytes = await readFile(sourcePath);
    existingParts.set(mediaPart, bytes);
    partPaths.add(mediaPart);

    const ctPart = existingParts.get("[Content_Types].xml");
    if (ctPart) {
      const ext = basename(sourcePath).split(".").pop() ?? "";
      const patched = ensureDefaultContentType(ctPart.toString("utf-8"), ext);
      if (patched.fixed > 0) {
        existingParts.set("[Content_Types].xml", Buffer.from(patched.xml, "utf-8"));
        contentTypes += patched.fixed;
      }
    }

    const replacement = renderInternalRelationship(rel, relsPart, mediaPart);
    nextXml = nextXml.replace(item.full, replacement);
    embedded += 1;
  }

  return { xml: nextXml, embedded, skipped, warnings, contentTypes };
}

async function walkRelParts(repoRoot: string): Promise<string[]> {
  const parts = await listOoxmlParts(repoRoot);
  return parts.filter((part) => normalizePartPath(part).endsWith(".rels"));
}

export async function repairContentTypes(repoRoot: string): Promise<number> {
  const part = "[Content_Types].xml";
  try {
    const original = await readFile(join(repoRoot, part), "utf-8");
    const { xml, fixed } = patchContentTypesXml(original);
    if (fixed > 0) {
      await writePart(repoRoot, part, xml);
    }
    return fixed;
  } catch {
    return 0;
  }
}

export async function repairExternalRelationships(
  repoRoot: string,
  ctx: Omit<RepairContext, "repoRoot">,
): Promise<Pick<OoxmlRepairResult, "embedded" | "skipped" | "warnings" | "linkAttributesRemoved">> {
  const fullCtx: RepairContext = { repoRoot, ...ctx };
  const parts = new Map<string, Buffer>();

  for (const part of await listOoxmlParts(repoRoot)) {
    parts.set(normalizePartPath(part), await readFile(join(repoRoot, part)));
  }

  let embedded = 0;
  let skipped = 0;
  const warnings: string[] = [];

  for (const relsPart of await walkRelParts(repoRoot)) {
    const normalized = normalizePartPath(relsPart);
    const original = parts.get(normalized)?.toString("utf-8") ?? "";
    const result = await embedExternalRelationshipsInXml(original, normalized, fullCtx, parts);
    if (result.xml !== original) {
      parts.set(normalized, Buffer.from(result.xml, "utf-8"));
    }
    embedded += result.embedded;
    skipped += result.skipped;
    warnings.push(...result.warnings);
  }

  const linkAttributesRemoved = repairStaleImageLinks(parts);

  for (const [part, content] of parts) {
    const repoPath = join(repoRoot, part);
    const original = await readFile(repoPath).catch(() => null);
    if (original && Buffer.compare(original, content) === 0) continue;
    if (part.endsWith(".rels") || part.endsWith(".xml")) {
      await writePart(repoRoot, part, content.toString("utf-8"));
    } else {
      await writePartBytes(repoRoot, part, content);
    }
  }

  return { embedded, skipped, warnings, linkAttributesRemoved };
}

export async function repairOoxmlPackage(
  repoRoot: string,
  options: { sourceFileDir?: string; documentType?: DocumentType; warn?: (message: string) => void } = {},
): Promise<OoxmlRepairResult> {
  const { readConfig } = await import("../config/docugit-yml.ts");
  const config = await readConfig(repoRoot);
  const external = await repairExternalRelationships(repoRoot, {
    documentType: options.documentType ?? config.document.type,
    sourceFileDir: options.sourceFileDir,
    warn: options.warn ?? ((message) => console.warn(message)),
  });
  const contentTypes = await repairContentTypes(repoRoot);
  return {
    embedded: external.embedded,
    skipped: external.skipped,
    contentTypes,
    linkAttributesRemoved: external.linkAttributesRemoved,
    warnings: external.warnings,
  };
}

/** Embed resolvable external links in memory before writing a ZIP (does not mutate the repo). */
export async function repairPartsForPack(repoRoot: string, parts: PackPart[]): Promise<PackPart[]> {
  const { readConfig } = await import("../config/docugit-yml.ts");
  const config = await readConfig(repoRoot);
  const byPath = new Map(parts.map((part) => [normalizePartPath(part.path), part.content]));
  const ctx: RepairContext = {
    repoRoot,
    documentType: config.document.type,
    warn: (message) => console.warn(message),
  };

  let contentTypes = 0;

  for (const [path, content] of [...byPath.entries()]) {
    if (!path.endsWith(".rels")) continue;
    const result = await embedExternalRelationshipsInXml(content.toString("utf-8"), path, ctx, byPath);
    if (result.xml !== content.toString("utf-8")) {
      byPath.set(path, Buffer.from(result.xml, "utf-8"));
    }
    contentTypes += result.contentTypes;
  }

  repairStaleImageLinks(byPath);

  const contentTypesPart = byPath.get("[Content_Types].xml");
  if (contentTypesPart) {
    const { xml, fixed } = patchContentTypesXml(contentTypesPart.toString("utf-8"));
    if (fixed > 0) {
      byPath.set("[Content_Types].xml", Buffer.from(xml, "utf-8"));
      contentTypes += fixed;
    }
  }

  return [...byPath.entries()].map(([path, content]) => ({ path, content }));
}

export function summarizeRepair(result: OoxmlRepairResult): string {
  const bits: string[] = [];
  if (result.embedded > 0) bits.push(`${result.embedded} external file(s) embedded`);
  if (result.skipped > 0) bits.push(`${result.skipped} external link(s) skipped`);
  if (result.linkAttributesRemoved > 0) {
    bits.push(`${result.linkAttributesRemoved} stale r:link attribute(s) removed`);
  }
  if (result.contentTypes > 0) bits.push(`${result.contentTypes} content-type fix(es)`);
  return bits.length > 0 ? bits.join(", ") : "no repairs needed";
}
