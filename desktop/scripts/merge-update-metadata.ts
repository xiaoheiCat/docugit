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

/** Installer arch from electron-builder artifact names (…-x64.exe / …-arm64.dmg). */
function installerArchFromUrl(url: string): "x64" | "arm64" | null {
  if (/-arm64\.(exe|dmg)$/i.test(url)) {
    return "arm64";
  }
  if (/-x64\.(exe|dmg)$/i.test(url)) {
    return "x64";
  }
  return null;
}

function sortFileEntries(files: UpdateFileEntry[]): UpdateFileEntry[] {
  return [...files].sort((a, b) => {
    const order = { x64: 0, arm64: 1 };
    const archA = installerArchFromUrl(a.url ?? "") ?? "arm64";
    const archB = installerArchFromUrl(b.url ?? "") ?? "arm64";
    return order[archA] - order[archB];
  });
}

function mergeUpdateMetadata(
  dir: string,
  outputName: string,
  sourceMatcher: (name: string) => boolean,
): void {
  const output = join(dir, outputName);
  const sources = findFiles(dir, sourceMatcher);
  if (sources.length === 0) {
    return;
  }

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

  merged.files = sortFileEntries(merged.files!);
  // Multi-arch feed: do not set top-level path (CI sort used to pick arm64 first).

  writeFileSync(output, dump(merged));
  for (const source of sources) {
    if (source !== output) {
      unlinkSync(source);
    }
  }
}

function mergeMacMetadata(dir: string): void {
  mergeUpdateMetadata(
    dir,
    "latest-mac.yml",
    (name) => name === "latest-mac.yml" || /^latest-mac-\d+\.yml$/.test(name),
  );
}

function mergeWinMetadata(dir: string): void {
  mergeUpdateMetadata(
    dir,
    "latest.yml",
    (name) => name === "latest.yml" || /^latest-win-\d+\.yml$/.test(name),
  );
}

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("usage: merge-update-metadata.ts <release-desktop-dir>");
  process.exit(1);
}

mergeMacMetadata(targetDir);
mergeWinMetadata(targetDir);
