import { createRequire } from "node:module";
import { app, BrowserWindow } from "electron";
import type electronUpdater from "electron-updater";
import type { UpdateStatus } from "../shared/types.ts";

const require = createRequire(import.meta.url);

type AutoUpdater = typeof electronUpdater.autoUpdater;

let status: UpdateStatus = { state: "idle" };
let autoUpdaterInstance: AutoUpdater | null | undefined;
let autoUpdaterUnavailable = false;

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
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = null;

  autoUpdater.on("checking-for-update", () => {
    setStatus({ state: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    setStatus({ state: "available", version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    setStatus({ state: "not-available" });
  });

  autoUpdater.on("download-progress", (progress) => {
    setStatus({ state: "downloading", percent: progress.percent });
  });

  autoUpdater.on("update-downloaded", (info) => {
    setStatus({ state: "downloaded", version: info.version });
  });

  autoUpdater.on("error", (error) => {
    setStatus({ state: "error", message: error.message });
  });

  setTimeout(() => {
    void autoUpdater.checkForUpdates();
  }, 5000);
}

export function checkForUpdates(): void {
  if (!app.isPackaged) {
    setStatus({ state: "dev-skipped" });
    return;
  }
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return;
  }
  void autoUpdater.checkForUpdates();
}

export function quitAndInstall(): void {
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return;
  }
  autoUpdater.quitAndInstall();
}
