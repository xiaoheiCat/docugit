import { parseXml, collectText, ensureArray } from "../xml-utils.ts";

export interface SlideChange {
  index: number;
  before: string;
  after: string;
  type: "added" | "removed" | "modified" | "unchanged";
}

export function extractSlideTexts(xml: string): string[] {
  const doc = parseXml(xml) as Record<string, unknown>;
  const sld = (doc.sld ?? doc) as Record<string, unknown>;
  const cSld = sld.cSld as Record<string, unknown> | undefined;
  const spTree = cSld?.spTree as Record<string, unknown> | undefined;
  if (!spTree) return [];

  const texts: string[] = [];
  for (const sp of ensureArray(spTree.sp)) {
    const text = collectText(sp).trim();
    if (text) texts.push(text);
  }
  for (const graphicFrame of ensureArray(spTree.graphicFrame)) {
    const text = collectText(graphicFrame).trim();
    if (text) texts.push(text);
  }
  return texts;
}

export function diffSlides(before: string[][], after: string[][]): SlideChange[] {
  const changes: SlideChange[] = [];
  const maxLen = Math.max(before.length, after.length);

  for (let i = 0; i < maxLen; i++) {
    const b = (before[i] ?? []).join("\n");
    const a = (after[i] ?? []).join("\n");

    if (i >= before.length) {
      changes.push({ index: i + 1, before: "", after: a, type: "added" });
    } else if (i >= after.length) {
      changes.push({ index: i + 1, before: b, after: "", type: "removed" });
    } else if (b !== a) {
      changes.push({ index: i + 1, before: b, after: a, type: "modified" });
    } else {
      changes.push({ index: i + 1, before: b, after: a, type: "unchanged" });
    }
  }

  return changes;
}

export function getSlidePart(index: number): string {
  return `ppt/slides/slide${index}.xml`;
}

export function listSlideParts(parts: string[]): string[] {
  return parts
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0", 10);
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0", 10);
      return na - nb;
    });
}
