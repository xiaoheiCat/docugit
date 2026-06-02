#!/usr/bin/env bun
/**
 * Fail CI if the packaged .app or embedded Mach-O under Resources/bin are not signed.
 * Usage: bun run scripts/verify-mac-signing.ts path/to/DocuGit\ Desktop.app
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function isMachO(filePath: string): boolean {
  try {
    const buf = readFileSync(filePath, { flag: "r" });
    if (buf.length < 4) {
      return false;
    }
    const be = buf.readUInt32BE(0);
    const le = buf.readUInt32LE(0);
    const magics = new Set([
      0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcffaedff,
    ]);
    return magics.has(be) || magics.has(le);
  } catch {
    return false;
  }
}

function collectMachO(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) {
    return out;
  }
  for (const name of readdirSync(root)) {
    const p = join(root, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      out.push(...collectMachO(p));
    } else if (st.isFile() && isMachO(p)) {
      out.push(p);
    }
  }
  return out;
}

function verify(path: string, deep = false): boolean {
  const args = ["--verify", ...(deep ? ["--deep", "--strict"] : []), path];
  const r = spawnSync("codesign", args, { encoding: "utf8" });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || r.stdout || "");
    return false;
  }
  return true;
}

const appPath = process.argv[2];
if (!appPath || !existsSync(appPath)) {
  console.error("usage: verify-mac-signing.ts <path/to/Product.app>");
  process.exit(1);
}

let failed = false;

if (!verify(appPath, true)) {
  console.error(`fatal: app bundle failed codesign --verify --deep --strict: ${appPath}`);
  failed = true;
}

const binDir = join(appPath, "Contents/Resources/bin");
for (const macho of collectMachO(binDir)) {
  if (!verify(macho)) {
    console.error(`fatal: unsigned or invalid Mach-O: ${macho}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`verified: ${appPath}`);
