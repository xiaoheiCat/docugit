import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: false,
});

export function parseXml(xml: string): unknown {
  return parser.parse(xml);
}

export function collectText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    let text = "";
    if ("#text" in obj) text += String(obj["#text"] ?? "");
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("@_") || key === "#text") continue;
      text += collectText(value);
    }
    return text;
  }
  return "";
}

export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
