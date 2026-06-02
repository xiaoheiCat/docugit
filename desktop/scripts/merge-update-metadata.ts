import { readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dump, load } from "js-yaml";

interface UpdateFileEntry {
  url?: string;
  sha512?: string;
  size?: number;
}

interface UpdateMetadata {
  version?: string;
  path?: string;
  sha512?: string;
  size?: number;
  releaseDate?: string;
  files?: UpdateFileEntry[];
}

function findFiles(root: string, matcher: (name: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      results.push(...findFiles(path, matcher));
    } else if (matcher(entry)) {
      results.push(path);
    }
  }
  return results;
}

function fileEntries(doc: UpdateMetadata): UpdateFileEntry[] {
  if (Array.isArray(doc.files) && doc.files.length > 0) {
    return doc.files;
  }
  if (doc.path) {
    return [{ url: doc.path, sha512: doc.sha512, size: doc.size }];
  }
  return [];
}

function mergeUpdateMetadata(
  dir: string,
  outputName: string,
  sourceMatcher: (name: string) => boolean,
): void {
  const sources = findFiles(dir, sourceMatcher);
  if (sources.length === 0) {
    return;
  }

  const output = join(dir, outputName);

  if (sources.length === 1) {
    const doc = readFileSync(sources[0]!, "utf-8");
    writeFileSync(output, doc);
    if (sources[0] !== output) {
      unlinkSync(sources[0]!);
    }
    return;
  }

  const merged: UpdateMetadata = { files: [] };
  const seen = new Set<string>();

  for (const source of sources.sort()) {
    const doc = load(readFileSync(source, "utf-8")) as UpdateMetadata;
    if (!merged.version) {
      merged.version = doc.version;
      merged.path = doc.path;
      merged.sha512 = doc.sha512;
      merged.size = doc.size;
      merged.releaseDate = doc.releaseDate;
    }
    for (const entry of fileEntries(doc)) {
      const key = entry.url ?? "";
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.files!.push(entry);
    }
  }

  writeFileSync(output, dump(merged));
  for (const source of sources) {
    if (source !== output) {
      unlinkSync(source);
    }
  }
}

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("usage: merge-update-metadata.ts <release-desktop-dir>");
  process.exit(1);
}

mergeUpdateMetadata(
  targetDir,
  "latest-mac.yml",
  (name) => name === "latest-mac.yml" || /^latest-mac-\d+\.yml$/.test(name),
);
mergeUpdateMetadata(
  targetDir,
  "latest.yml",
  (name) => name === "latest.yml" || /^latest-win-\d+\.yml$/.test(name),
);
