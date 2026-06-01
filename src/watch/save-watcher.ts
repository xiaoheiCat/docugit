import { watch } from "chokidar";
import open from "open";
import { open as fsOpen } from "node:fs/promises";
import { platform } from "node:os";
import { basename } from "node:path";
import { applyPackedChanges } from "../merge/three-way.ts";
import { packToFile } from "../ooxml/pack.ts";
import { readConfig } from "../config/docugit-yml.ts";
import {
  ensureOfficeWritable,
  getOpenSessionDir,
  prepareOpenSessionFile,
} from "../utils/open-session.ts";

export interface OpenSessionOptions {
  repoRoot: string;
  onApplied?: (summary: string) => void;
}

function getOfficeCommand(type: string): { command: string; args: string[] } | null {
  const os = platform();
  if (os === "darwin") {
    const app =
      type === "docx" ? "Microsoft Word" : type === "xlsx" ? "Microsoft Excel" : "Microsoft PowerPoint";
    return { command: "open", args: ["-a", app] };
  }
  if (os === "win32") {
    return { command: "cmd", args: ["/c", "start", ""] };
  }
  return { command: "libreoffice", args: [] };
}

async function isFileLocked(filePath: string): Promise<boolean> {
  try {
    const handle = await fsOpen(filePath, "r+");
    await handle.close();
    return false;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EBUSY" || code === "EACCES" || code === "EPERM" || code === "ENOENT") {
      return code !== "ENOENT";
    }
    return true;
  }
}

function waitForOfficeClose(filePath: string, onClose: () => void): () => void {
  const pollMs = 1000;
  const graceMs = 5000;
  const requiredUnlockStreak = 3;
  const start = Date.now();
  let unlockedStreak = 0;

  const timer = setInterval(() => {
    void (async () => {
      if (Date.now() - start < graceMs) return;
      const locked = await isFileLocked(filePath);
      if (locked) {
        unlockedStreak = 0;
        return;
      }
      unlockedStreak += 1;
      if (unlockedStreak >= requiredUnlockStreak) {
        clearInterval(timer);
        onClose();
      }
    })();
  }, pollMs);

  return () => clearInterval(timer);
}

export async function openDocumentSession(options: OpenSessionOptions): Promise<void> {
  const config = await readConfig(options.repoRoot);
  const ext = config.document.type;
  const filename = config.document.originalName.endsWith(`.${ext}`)
    ? config.document.originalName
    : `${config.document.originalName}.${ext}`;

  const filePath = await prepareOpenSessionFile(options.repoRoot, filename);
  await packToFile(options.repoRoot, filePath);
  await ensureOfficeWritable(filePath);

  const office = getOfficeCommand(ext);
  if (office) {
    if (platform() === "win32") {
      await open(filePath);
    } else if (platform() === "darwin") {
      const { spawn } = await import("node:child_process");
      spawn(office.command, [...office.args, filePath], { detached: true, stdio: "ignore" }).unref();
    } else {
      const { spawn } = await import("node:child_process");
      spawn("libreoffice", [filePath], { detached: true, stdio: "ignore" }).unref();
    }
  } else {
    await open(filePath);
  }

  console.log(`Opened: ${basename(filename)}`);
  console.log("");
  console.log("DocuGit is watching for save.");
  console.log("Each time you save in Office, changes are applied to the repository.");
  console.log("");
  console.log("IMPORTANT:");
  console.log("- Keep this terminal open while editing.");
  console.log("- Do not close this process.");
  console.log("- Exiting before saving in Office will discard your editing session.");
  console.log("");

  let saving = false;
  const watcher = watch(filePath, { awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 } });

  watcher.on("change", async () => {
    if (saving) return;
    saving = true;
    try {
      const summary = await applyPackedChanges(options.repoRoot, filePath);
      console.log(`Changes applied to repository: ${summary}`);
      options.onApplied?.(summary);
    } catch (err) {
      console.error(`Failed to apply changes: ${err instanceof Error ? err.message : err}`);
    } finally {
      saving = false;
    }
  });

  await new Promise<void>((resolve) => {
    const stopPolling = waitForOfficeClose(filePath, () => {
      void watcher.close().then(() => {
        console.log("Office closed the document. Editing session ended.");
        resolve();
      });
    });

    process.once("SIGINT", () => {
      stopPolling();
      void watcher.close().then(resolve);
    });
  });
}

export function getOpenTempPath(repoRoot: string): string {
  return getOpenSessionDir(repoRoot);
}
