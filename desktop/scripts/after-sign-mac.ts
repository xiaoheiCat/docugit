/**
 * Sign Mach-O binaries under Contents/Resources/bin (docugit CLI + dugite Git)
 * that electron-osx-sign does not cover, then re-sign the .app bundle.
 * Required for Squirrel.Mac auto-update signature validation.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

interface AfterSignContext {
  electronPlatformName: string;
  appOutDir: string;
  packager: {
    appInfo: { productFilename: string };
    projectDir: string;
  };
}

function resolveSignIdentity(): string | null {
  if (process.env.CSC_IDENTITY_AUTO_DISCOVERY === "false" && !process.env.CSC_LINK) {
    return "-";
  }
  const fromEnv = process.env.CSC_NAME ?? process.env.CSC_IDENTITY;
  if (fromEnv) {
    return fromEnv;
  }
  return "-";
}

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
    if (magics.has(be) || magics.has(le)) {
      return true;
    }
    const file = spawnSync("file", ["-b", filePath], { encoding: "utf-8" });
    return file.status === 0 && file.stdout.includes("Mach-O");
  } catch {
    return false;
  }
}

function collectMachOFiles(root: string): string[] {
  const results: string[] = [];
  if (!existsSync(root)) {
    return results;
  }
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      results.push(...collectMachOFiles(path));
    } else if (stat.isFile() && isMachO(path)) {
      results.push(path);
    }
  }
  return results;
}

function codesign(args: string[]): void {
  execFileSync("codesign", args, { stdio: "inherit" });
}

export default async function afterSign(context: AfterSignContext): Promise<void> {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const identity = resolveSignIdentity();
  if (!identity) {
    return;
  }

  const appPath = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const binDir = join(appPath, "Contents/Resources/bin");
  const entitlementsInherit = join(context.packager.projectDir, "build/entitlements.mac.inherit.plist");
  const entitlementsApp = join(context.packager.projectDir, "build/entitlements.mac.plist");

  const extras = collectMachOFiles(binDir);
  if (extras.length === 0) {
    return;
  }

  for (const file of extras.sort()) {
    codesign([
      "--force",
      "--sign",
      identity,
      "--options",
      "runtime",
      "--entitlements",
      entitlementsInherit,
      "--timestamp=none",
      file,
    ]);
  }

  codesign([
    "--force",
    "--sign",
    identity,
    "--options",
    "runtime",
    "--entitlements",
    entitlementsApp,
    "--timestamp=none",
    appPath,
  ]);
}
