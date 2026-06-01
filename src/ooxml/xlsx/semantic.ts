import { parseXml, collectText, ensureArray } from "../xml-utils.ts";

export interface CellChange {
  sheet: string;
  cell: string;
  before: string;
  after: string;
  type: "added" | "removed" | "modified" | "unchanged";
}

function parseSharedStrings(xml: string): string[] {
  const doc = parseXml(xml) as Record<string, unknown>;
  const sst = doc.sst as Record<string, unknown> | undefined;
  if (!sst) return [];
  return ensureArray(sst.si).map((si) => collectText(si));
}

function colToLetter(col: number): string {
  let result = "";
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function parseCellRef(ref: string): { col: number; row: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { col: 0, row: 0 };
  const letters = match[1]!.toUpperCase();
  let col = 0;
  for (const ch of letters) {
    col = col * 26 + (ch.charCodeAt(0) - 64);
  }
  return { col, row: parseInt(match[2]!, 10) };
}

function getCellValue(
  cell: Record<string, unknown>,
  sharedStrings: string[],
): string {
  const t = cell["@_t"];
  const v = cell.v;
  if (t === "s" && typeof v === "string") {
    return sharedStrings[parseInt(v, 10)] ?? "";
  }
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (v && typeof v === "object") return collectText(v);
  return collectText(cell);
}

export function extractCells(sheetXml: string, sharedStringsXml?: string): Map<string, string> {
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml) : [];
  const doc = parseXml(sheetXml) as Record<string, unknown>;
  const worksheet = doc.worksheet as Record<string, unknown> | undefined;
  const sheetData = worksheet?.sheetData as Record<string, unknown> | undefined;
  const rows = ensureArray(sheetData?.row);
  const cells = new Map<string, string>();

  for (const row of rows) {
    const rowObj = row as Record<string, unknown>;
    const rowNum = rowObj["@_r"] ?? "";
    for (const c of ensureArray(rowObj.c)) {
      const cell = c as Record<string, unknown>;
      const ref = String(cell["@_r"] ?? `${colToLetter(parseCellRef(String(rowNum)).col)}${rowNum}`);
      cells.set(ref, getCellValue(cell, sharedStrings));
    }
  }

  return cells;
}

export function diffCells(
  sheet: string,
  before: Map<string, string>,
  after: Map<string, string>,
): CellChange[] {
  const changes: CellChange[] = [];
  const allKeys = new Set([...before.keys(), ...after.keys()]);

  for (const cell of [...allKeys].sort()) {
    const b = before.get(cell) ?? "";
    const a = after.get(cell) ?? "";
    let type: CellChange["type"] = "unchanged";
    if (!before.has(cell)) type = "added";
    else if (!after.has(cell)) type = "removed";
    else if (b !== a) type = "modified";
    changes.push({ sheet, cell, before: b, after: a, type });
  }

  return changes;
}

export function getWorkbookPart(): string {
  return "xl/workbook.xml";
}

export function getSharedStringsPart(): string {
  return "xl/sharedStrings.xml";
}

export function getSheetPart(index: number): string {
  return `xl/worksheets/sheet${index}.xml`;
}
