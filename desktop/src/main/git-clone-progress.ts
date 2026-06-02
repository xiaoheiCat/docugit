import { BrowserWindow } from "electron";
import type { GitCloneProgress } from "../shared/types.ts";

const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, "");
}

/** Parse a single git clone --progress stderr line into UI progress. */
export function parseGitCloneProgress(line: string): GitCloneProgress | null {
  const message = stripAnsi(line).trim();
  if (!message) {
    return null;
  }

  const receiving = message.match(/Receiving objects:\s*(\d+)%/i);
  if (receiving) {
    return { percent: Number(receiving[1]), phase: "receiving" };
  }

  const resolving = message.match(/Resolving deltas:\s*(\d+)%/i);
  if (resolving) {
    const inner = Number(resolving[1]);
    return { percent: 90 + Math.round(inner * 0.1), phase: "resolving" };
  }

  const remotePercent = message.match(/(Counting|Compressing|Indexing) objects:\s*(\d+)%/i);
  if (remotePercent) {
    const inner = Number(remotePercent[2]);
    return { percent: Math.min(20, Math.round(inner * 0.2)), phase: "remote" };
  }

  if (/Cloning into/i.test(message)) {
    return { percent: 0, phase: "starting" };
  }
  if (/Checking connectivity/i.test(message)) {
    return { percent: 1, phase: "connecting" };
  }
  if (/Enumerating objects/i.test(message)) {
    return { percent: 3, phase: "enumerating" };
  }
  if (/Receiving objects:/i.test(message)) {
    return { percent: 5, phase: "receiving" };
  }

  return null;
}

export function broadcastCloneProgress(progress: GitCloneProgress): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("clone:progress", progress);
  }
}

export function feedGitCloneProgress(
  chunk: string,
  buffer: { tail: string },
  onProgress: (progress: GitCloneProgress) => void,
): void {
  buffer.tail += chunk;
  const parts = buffer.tail.split(/[\r\n]/);
  buffer.tail = parts.pop() ?? "";
  for (const part of parts) {
    const parsed = parseGitCloneProgress(part);
    if (parsed) {
      onProgress(parsed);
    }
  }
}
