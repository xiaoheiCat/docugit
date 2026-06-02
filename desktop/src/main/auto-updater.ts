import { createRequire } from "node:module";
import { app, BrowserWindow } from "electron";
import type electronUpdater from "electron-updater";
import type { UpdateStatus } from "../shared/types.ts";

const require = createRequire(import.meta.url);

type AutoUpdater = typeof electronUpdater.autoUpdater;

let status: UpdateStatus = { state: "idle" };
let autoUpdaterInstance: AutoUpdater | null | undefined;
let autoUpdaterUnavailable = false;
let checkInProgress = false;
let downloadInProgress = false;

function getAutoUpdater(): AutoUpdater | null {
  if (autoUpdaterUnavailable) {
    return null;
  }
  if (autoUpdaterInstance) {
    return autoUpdaterInstance;
  }
  try {
    // Access is lazy: electron-updater validates app.getVersion() on first read.
    const { autoUpdater } = require("electron-updater") as typeof import("electron-updater");
    autoUpdaterInstance = autoUpdater;
    return autoUpdater;
  } catch (error) {
    autoUpdaterUnavailable = true;
    const message = error instanceof Error ? error.message : String(error);
    setStatus({ state: "error", message });
    return null;
  }
}

function broadcastStatus(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("update:status", status);
  }
}

function setStatus(next: UpdateStatus): void {
  status = next;
  broadcastStatus();
}

function canStartUpdateCheck(): boolean {
  if (checkInProgress || downloadInProgress) {
    return false;
  }
  return status.state !== "checking" && status.state !== "downloading" && status.state !== "downloaded";
}

function resetUpdateActivity(): void {
  checkInProgress = false;
  downloadInProgress = false;
}

function startDownload(autoUpdater: AutoUpdater, version: string): void {
  if (downloadInProgress || status.state === "downloaded" || status.state === "downloading") {
    return;
  }
  downloadInProgress = true;
  setStatus({ state: "available", version });
  void autoUpdater.downloadUpdate().catch((error: Error) => {
    downloadInProgress = false;
    setStatus({ state: "error", message: error.message });
  });
}

export function getUpdateStatus(): UpdateStatus {
  return status;
}

export function initAutoUpdater(): void {
  if (!app.isPackaged) {
    return;
  }

  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return;
  }

  // DocuGit release tags are calver (v2026.06.02_…), not semver prerelease channels.
  autoUpdater.allowPrerelease = false;
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = null;

  if (process.platform === "win32" || process.platform === "darwin") {
    const archTag = process.arch === "arm64" ? "arm64" : "x64";
    autoUpdater.channel = `latest-${archTag}`;
  }

  autoUpdater.on("checking-for-update", () => {
    checkInProgress = true;
    setStatus({ state: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    checkInProgress = false;
    startDownload(autoUpdater, info.version);
  });

  autoUpdater.on("update-not-available", () => {
    checkInProgress = false;
    setStatus({ state: "not-available" });
  });

  autoUpdater.on("download-progress", (progress) => {
    setStatus({ state: "downloading", percent: progress.percent });
  });

  autoUpdater.on("update-downloaded", (info) => {
    downloadInProgress = false;
    setStatus({ state: "downloaded", version: info.version });
  });

  autoUpdater.on("error", (error) => {
    resetUpdateActivity();
    setStatus({ state: "error", message: error.message });
  });

  setTimeout(() => {
    checkForUpdates();
  }, 5000);
}

export function checkForUpdates(): boolean {
  if (!app.isPackaged) {
    setStatus({ state: "dev-skipped" });
    return false;
  }
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return false;
  }
  if (!canStartUpdateCheck()) {
    return false;
  }

  checkInProgress = true;
  setStatus({ state: "checking" });
  void autoUpdater.checkForUpdates().catch((error: Error) => {
    checkInProgress = false;
    setStatus({ state: "error", message: error.message });
  });
  return true;
}

export function quitAndInstall(): void {
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return;
  }
  // Silent NSIS install + relaunch; default non-silent updates are flaky on Windows.
  autoUpdater.quitAndInstall(true, true);
}
