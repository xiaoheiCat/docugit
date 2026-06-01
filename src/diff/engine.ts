import type { DocumentType } from "../config/docugit-yml.ts";
import { readPart, listOoxmlParts } from "../ooxml/pack.ts";
import { extractParagraphs, diffParagraphs, getMainDocumentPart } from "../ooxml/docx/semantic.ts";
import {
  extractCells,
  diffCells,
  getSharedStringsPart,
  getSheetPart,
} from "../ooxml/xlsx/semantic.ts";
import {
  extractSlideTexts,
  diffSlides,
  listSlideParts,
} from "../ooxml/pptx/semantic.ts";

export interface SemanticChange {
  kind: "paragraph" | "cell" | "slide";
  location: string;
  before: string;
  after: string;
  type: "added" | "removed" | "modified";
}

export interface SemanticDiffResult {
  documentType: DocumentType;
  changes: SemanticChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

async function diffDocx(repoA: string, repoB: string): Promise<SemanticChange[]> {
  const part = getMainDocumentPart();
  const xmlA = await readPart(repoA, part);
  const xmlB = await readPart(repoB, part);
  const changes = diffParagraphs(extractParagraphs(xmlA), extractParagraphs(xmlB));

  return changes
    .filter((c) => c.type !== "unchanged")
    .map((c) => ({
      kind: "paragraph" as const,
      location: `Paragraph ${c.index}`,
      before: c.before,
      after: c.after,
      type: c.type as "added" | "removed" | "modified",
    }));
}

async function diffXlsx(repoA: string, repoB: string): Promise<SemanticChange[]> {
  const changes: SemanticChange[] = [];
  let sharedA: string | undefined;
  let sharedB: string | undefined;

  try {
    sharedA = await readPart(repoA, getSharedStringsPart());
  } catch {
    /* optional */
  }
  try {
    sharedB = await readPart(repoB, getSharedStringsPart());
  } catch {
    /* optional */
  }

  for (let i = 1; i <= 10; i++) {
    const part = getSheetPart(i);
    try {
      const xmlA = await readPart(repoA, part);
      const xmlB = await readPart(repoB, part);
      const cellsA = extractCells(xmlA, sharedA);
      const cellsB = extractCells(xmlB, sharedB);
      const sheetChanges = diffCells(`Sheet${i}`, cellsA, cellsB).filter(
        (c) => c.type !== "unchanged",
      );
      for (const c of sheetChanges) {
        changes.push({
          kind: "cell",
          location: `${c.sheet}!${c.cell}`,
          before: c.before,
          after: c.after,
          type: c.type as "added" | "removed" | "modified",
        });
      }
    } catch {
      break;
    }
  }

  return changes;
}

async function diffPptx(repoA: string, repoB: string): Promise<SemanticChange[]> {
  const partsA = await listOoxmlParts(repoA);
  const partsB = await listOoxmlParts(repoB);
  const slidesA = listSlideParts(partsA);
  const slidesB = listSlideParts(partsB);
  const maxLen = Math.max(slidesA.length, slidesB.length);

  const textsA: string[][] = [];
  const textsB: string[][] = [];

  for (let i = 0; i < maxLen; i++) {
    textsA.push(slidesA[i] ? extractSlideTexts(await readPart(repoA, slidesA[i]!)) : []);
    textsB.push(slidesB[i] ? extractSlideTexts(await readPart(repoB, slidesB[i]!)) : []);
  }

  return diffSlides(textsA, textsB)
    .filter((c) => c.type !== "unchanged")
    .map((c) => ({
      kind: "slide" as const,
      location: `Slide ${c.index}`,
      before: c.before,
      after: c.after,
      type: c.type as "added" | "removed" | "modified",
    }));
}

export async function computeSemanticDiff(
  repoA: string,
  repoB: string,
  documentType: DocumentType,
): Promise<SemanticDiffResult> {
  let changes: SemanticChange[] = [];

  switch (documentType) {
    case "docx":
      changes = await diffDocx(repoA, repoB);
      break;
    case "xlsx":
      changes = await diffXlsx(repoA, repoB);
      break;
    case "pptx":
      changes = await diffPptx(repoA, repoB);
      break;
  }

  return {
    documentType,
    changes,
    summary: {
      added: changes.filter((c) => c.type === "added").length,
      removed: changes.filter((c) => c.type === "removed").length,
      modified: changes.filter((c) => c.type === "modified").length,
    },
  };
}

export function summarizeChanges(result: SemanticDiffResult): string {
  const { added, removed, modified } = result.summary;
  const parts: string[] = [];
  if (added) parts.push(`+${added} added`);
  if (removed) parts.push(`-${removed} removed`);
  if (modified) parts.push(`~${modified} modified`);
  return parts.length ? parts.join(", ") : "no changes";
}
