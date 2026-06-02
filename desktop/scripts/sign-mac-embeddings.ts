/**
 * Sign Mach-O under Contents/Resources/bin (docugit + dugite Git), then re-sign the .app.
 * Used by afterSign and CI verification helpers.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface SignMacEmbeddingsOptions {
  projectDir: string;
  /** `-` for ad-hoc; Developer ID name/hash when using CSC secrets. */
  identity: string;
  /** Match electron-builder mac.hardenedRuntime (must be false for ad-hoc). */
  hardenedRuntime?: boolean;
}

function isAdHocIdentity(identity: string): boolean {
  return identity === "-" || identity.trim() === "";
}

export function signingInfoFromApp(appPath: string): { identity: string; adhoc: boolean } | null {
  const result = spawnSync("codesign", ["--display", "--verbose=2", appPath], {
    encoding: "utf8",
  });
  const text = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0) {
    return null;
  }

  if (/Signature=adhoc/i.test(text)) {
    return { identity: "-", adhoc: true };
  }

  for (const line of text.split("\n")) {
    if (!line.startsWith("Authority=")) {
      continue;
    }
    const authority = line.slice("Authority=".length).trim();
    if (authority.startsWith("Apple")) {
      continue;
    }
    return { identity: authority, adhoc: false };
  }

  return null;
}

export function resolveSignIdentity(appPath: string): string {
  const hasCert = Boolean(process.env.CSC_LINK?.trim());
  const hasPassword = Boolean(process.env.CSC_KEY_PASSWORD?.trim());

  if (!hasCert || !hasPassword) {
    return "-";
  }

  const fromEnv = process.env.CSC_NAME?.trim() || process.env.CSC_IDENTITY?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromApp = signingInfoFromApp(appPath);
  if (fromApp) {
    return fromApp.identity;
  }

  return "-";
}

export function appUsesHardenedRuntime(appPath: string): boolean {
  const result = spawnSync("codesign", ["--display", "--verbose", appPath], {
    encoding: "utf8",
  });
  const text = `${result.stdout}\n${result.stderr}`;
  return /flags=.*runtime/i.test(text);
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
    const st = statSync(path);
    if (st.isDirectory()) {
      results.push(...collectMachOFiles(path));
    } else if (st.isFile() && isMachO(path)) {
      results.push(path);
    }
  }
  return results;
}

function signDepth(path: string): number {
  return path.split("/").length;
}

function codesign(args: string[]): void {
  execFileSync("codesign", args, { stdio: "inherit" });
}

export function signMacEmbeddings(appPath: string, options: SignMacEmbeddingsOptions): void {
  const { projectDir, identity } = options;
  const adhoc = isAdHocIdentity(identity);
  const hardenedRuntime =
    options.hardenedRuntime ?? (!adhoc && appUsesHardenedRuntime(appPath));

  const binDir = join(appPath, "Contents/Resources/bin");
  const entitlementsInherit = join(projectDir, "build/entitlements.mac.inherit.plist");
  const entitlementsApp = join(projectDir, "build/entitlements.mac.plist");

  const extras = collectMachOFiles(binDir);
  if (extras.length === 0) {
    console.warn(`sign-mac-embeddings: no Mach-O files under ${binDir}`);
    return;
  }

  const sorted = extras.sort((a, b) => signDepth(b) - signDepth(a));

  for (const file of sorted) {
    const args = ["--force", "--sign", identity, "--timestamp=none"];
    if (hardenedRuntime) {
      args.push("--options", "runtime", "--entitlements", entitlementsInherit);
    }
    args.push(file);
    codesign(args);
  }

  const appArgs = ["--force", "--sign", identity, "--timestamp=none"];
  if (hardenedRuntime) {
    appArgs.push("--options", "runtime", "--entitlements", entitlementsApp);
  }
  appArgs.push(appPath);
  codesign(appArgs);
}
