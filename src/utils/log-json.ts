import type { LogEntryJson } from "../diff/json-schemas.ts";
import { gitOutput } from "./git.ts";

const FIELD_SEP = "\x1f";

export function formatLogJson(repoRoot: string, limit = 50): LogEntryJson[] {
  const format = ["%H", "%h", "%an", "%ae", "%aI", "%s", "%D"].join(FIELD_SEP);
  let raw = "";
  try {
    raw = gitOutput(["log", `--format=${format}`, `-n`, String(limit)], repoRoot);
  } catch {
    return [];
  }

  if (!raw.trim()) return [];

  return raw.split("\n").filter(Boolean).map((line) => {
    const [hash = "", shortHash = "", author = "", email = "", date = "", subject = "", decoration = ""] =
      line.split(FIELD_SEP);
    const refs = decoration
      .split(",")
      .map((ref) => ref.trim())
      .filter(Boolean);
    return { hash, shortHash, author, email, date, subject, refs };
  });
}
