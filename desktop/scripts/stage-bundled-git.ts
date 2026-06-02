/**
 * Stage dugite-native Git into desktop/resources/bin/git/ for electron-builder extraResources.
 * Usage: bun run scripts/stage-bundled-git.ts --platform darwin|win32 --arch x64|arm64
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { DUGITE_NATIVE_TAG } from "./bundled-git-version.ts";

interface EmbeddedGitEntry {
  url: string;
  checksum: string;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopDir = join(scriptDir, "..");
const destGitDir = join(desktopDir, "resources", "bin", "git");
const noticeSource = join(scriptDir, "git-NOTICE.txt");
const manifest = JSON.parse(
  readFileSync(join(scriptDir, "embedded-git.json"), "utf-8"),
) as Record<string, EmbeddedGitEntry>;

function usage(): never {
  console.error("usage: stage-bundled-git.ts --platform darwin|win32 --arch x64|arm64");
  process.exit(1);
}

function parseArgs(): { platform: "darwin" | "win32"; arch: "x64" | "arm64" } {
  const argv = process.argv.slice(2);
  let platform: string | undefined;
  let arch: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--platform") {
      platform = argv[++i];
    } else if (arg === "--arch") {
      arch = argv[++i];
    }
  }
  if (platform !== "darwin" && platform !== "win32") {
    usage();
  }
  if (arch !== "x64" && arch !== "arm64") {
    usage();
  }
  return { platform, arch };
}

function manifestKey(platform: "darwin" | "win32", arch: "x64" | "arm64"): string {
  return `${platform}-${arch}`;
}

function gitExecutable(platform: "darwin" | "win32"): string {
  return platform === "win32"
    ? join(destGitDir, "cmd", "git.exe")
    : join(destGitDir, "bin", "git");
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { Accept: "application/octet-stream", "User-Agent": "docugit-desktop" },
  });
  if (!res.ok) {
    console.error(`fatal: download failed (${res.status}): ${url}`);
    process.exit(1);
  }
  const body = res.body;
  if (!body) {
    console.error(`fatal: empty response: ${url}`);
    process.exit(1);
  }
  await pipeline(body, createWriteStream(dest));
  const size = statSync(dest).size;
  if (size < 1_000_000) {
    console.error(`fatal: download too small (${size} bytes): ${url}`);
    process.exit(1);
  }
}

/** MSYS tar on Windows treats `C:\...` as a remote host; use POSIX paths + --force-local. */
function tarFriendlyPath(path: string): string {
  if (process.platform !== "win32") {
    return path;
  }
  const driveMatch = /^([A-Za-z]):[\\/]/.exec(path);
  if (driveMatch) {
    const drive = driveMatch[1]!.toLowerCase();
    const rest = path.slice(3).replace(/\\/g, "/");
    return `/${drive}/${rest}`;
  }
  return path.replace(/\\/g, "/");
}

function quotePowerShell(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function extractTarGzWithWindowsTar(archive: string, outputDir: string): boolean {
  const cmd = `tar.exe -xzf ${quotePowerShell(archive)} -C ${quotePowerShell(outputDir)}`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], {
    encoding: "utf-8",
  });
  if (result.status === 0) {
    return true;
  }
  const detail = (result.stderr || result.stdout || "").trim();
  if (detail) {
    console.error(`hint: windows tar failed: ${detail}`);
  }
  return false;
}

function extractTarGz(archive: string, outputDir: string): void {
  const archivePath = tarFriendlyPath(archive);
  const outputPath = tarFriendlyPath(outputDir);
  const args = ["--force-local", "-xzf", archivePath, "-C", outputPath];
  const result = spawnSync("tar", args, {
    encoding: "utf-8",
    env: { ...process.env, MSYS2_ARG_CONV_EXCL: "*" },
  });
  if (result.status === 0) {
    return;
  }

  if (process.platform === "win32" && extractTarGzWithWindowsTar(archive, outputDir)) {
    return;
  }

  const detail = (result.stderr || result.stdout || "").trim();
  console.error(`fatal: tar extract failed${detail ? `: ${detail}` : ""}`);
  process.exit(1);
}

/** If the archive has a single top-level directory, return that path; else outputDir. */
function resolveExtractedRoot(outputDir: string): string {
  const entries = readdirSync(outputDir);
  if (entries.length === 1) {
    const only = join(outputDir, entries[0]!);
    if (statSync(only).isDirectory()) {
      return only;
    }
  }
  return outputDir;
}

function verifyGit(platform: "darwin" | "win32"): void {
  const exe = gitExecutable(platform);
  if (!existsSync(exe)) {
    console.error(`fatal: bundled git executable not found at ${exe}`);
    process.exit(1);
  }
  const result = spawnSync(exe, ["--version"], { encoding: "utf-8" });
  if (result.status !== 0) {
    console.error(`fatal: ${exe} --version failed`);
    process.exit(1);
  }
  console.log(result.stdout.trim());
}

async function main(): Promise<void> {
  const { platform, arch } = parseArgs();
  const key = manifestKey(platform, arch);
  const entry = manifest[key];
  if (!entry) {
    console.error(`fatal: no embedded git manifest for ${key}`);
    process.exit(1);
  }

  console.log(`Staging dugite-native ${DUGITE_NATIVE_TAG} (${key})…`);

  const work = mkdtempSync(join(tmpdir(), "docugit-stage-git-"));
  const archive = join(work, "git.tar.gz");
  const extractDir = join(work, "extract");

  try {
    await download(entry.url, archive);
    const digest = await sha256File(archive);
    if (digest !== entry.checksum) {
      console.error(`fatal: checksum mismatch (expected ${entry.checksum}, got ${digest})`);
      process.exit(1);
    }

    mkdirSync(extractDir, { recursive: true });
    extractTarGz(archive, extractDir);
    const root = resolveExtractedRoot(extractDir);

    rmSync(destGitDir, { recursive: true, force: true });
    cpSync(root, destGitDir, { recursive: true });
    if (existsSync(noticeSource)) {
      cpSync(noticeSource, join(destGitDir, "NOTICE"), { force: true });
    }

    verifyGit(platform);
    console.log(`Bundled Git staged at ${destGitDir}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

void main();
