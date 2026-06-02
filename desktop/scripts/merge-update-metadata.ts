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

/** Installer arch from electron-builder artifact names (…-x64.exe / …-arm64.dmg / …-x64.zip). */
function installerArchFromUrl(url: string): "x64" | "arm64" | null {
  if (/-arm64\.(exe|dmg|zip)$/i.test(url)) {
    return "arm64";
  }
  if (/-x64\.(exe|dmg|zip)$/i.test(url)) {
    return "x64";
  }
  return null;
}

function sortKey(url: string): string {
  const arch = installerArchFromUrl(url) ?? "z";
  const kind = /\.zip$/i.test(url) ? "0" : /\.(exe|dmg)$/i.test(url) ? "1" : "2";
  return `${arch === "x64" ? "0" : "1"}-${kind}-${url}`;
}

function sortFileEntries(files: UpdateFileEntry[]): UpdateFileEntry[] {
  return [...files].sort((a, b) => sortKey(a.url ?? "").localeCompare(sortKey(b.url ?? "")));
}

/** electron-updater on Windows uses `files[]`; top-level `path` forces one arch for all. */
function normalizeMetadata(doc: UpdateMetadata): UpdateMetadata {
  return {
    version: doc.version,
    releaseDate: doc.releaseDate,
    files: sortFileEntries(fileEntries(doc)),
  };
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
    const doc = load(readFileSync(sources[0]!, "utf-8")) as UpdateMetadata;
    writeFileSync(output, dump(normalizeMetadata(doc)));
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

  writeFileSync(output, dump(normalizeMetadata(merged)));
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
  writeMacArchChannelFiles(dir);
}

/** Squirrel.Mac reads latest-{arch}-mac.yml and requires a .zip entry (not dmg). */
function writeMacArchChannelFiles(dir: string): void {
  const mergedPath = join(dir, "latest-mac.yml");
  const doc = load(readFileSync(mergedPath, "utf-8")) as UpdateMetadata;
  const normalized = normalizeMetadata(doc);
  for (const arch of ["x64", "arm64"] as const) {
    const zipEntry = normalized.files.find(
      (f) => installerArchFromUrl(f.url ?? "") === arch && /\.zip$/i.test(f.url ?? ""),
    );
    if (!zipEntry) {
      throw new Error(`missing macOS ${arch} zip in merged latest-mac.yml`);
    }
    writeFileSync(
      join(dir, `latest-${arch}-mac.yml`),
      dump({
        version: normalized.version,
        releaseDate: normalized.releaseDate,
        files: [zipEntry],
      }),
    );
  }
}

function mergeWinMetadata(dir: string): void {
  mergeUpdateMetadata(
    dir,
    "latest.yml",
    (name) => name === "latest.yml" || /^latest-win-\d+\.yml$/.test(name),
  );
  writeWinArchChannelFiles(dir);
}

/** Per-arch feeds so Windows clients never read a shared latest.yml with the wrong path. */
function writeWinArchChannelFiles(dir: string): void {
  const mergedPath = join(dir, "latest.yml");
  const doc = load(readFileSync(mergedPath, "utf-8")) as UpdateMetadata;
  const normalized = normalizeMetadata(doc);
  for (const arch of ["x64", "arm64"] as const) {
    const entry = normalized.files.find((f) => installerArchFromUrl(f.url ?? "") === arch);
    if (!entry) {
      throw new Error(`missing Windows ${arch} installer in merged latest.yml`);
    }
    writeFileSync(
      join(dir, `latest-${arch}.yml`),
      dump({
        version: normalized.version,
        releaseDate: normalized.releaseDate,
        files: [entry],
      }),
    );
  }
}

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("usage: merge-update-metadata.ts <release-desktop-dir>");
  process.exit(1);
}

mergeMacMetadata(targetDir);
mergeWinMetadata(targetDir);
