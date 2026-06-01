import { parseXml, collectText, ensureArray } from "../xml-utils.ts";

export interface ParagraphChange {
  index: number;
  before: string;
  after: string;
  type: "added" | "removed" | "modified" | "unchanged";
}

export function extractParagraphs(xml: string): string[] {
  const parsed = parseXml(xml) as Record<string, unknown>;
  const root = (parsed["document"] ?? parsed) as Record<string, unknown>;
  const body = root["body"] as Record<string, unknown> | undefined;
  if (!body) return [];

  const paragraphs = ensureArray(body.p);
  return paragraphs.map((p) => collectText(p).trim());
}

export function diffParagraphs(before: string[], after: string[]): ParagraphChange[] {
  const changes: ParagraphChange[] = [];
  const maxLen = Math.max(before.length, after.length);

  for (let i = 0; i < maxLen; i++) {
    const b = before[i] ?? "";
    const a = after[i] ?? "";

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

export function getMainDocumentPart(): string {
  return "word/document.xml";
}
