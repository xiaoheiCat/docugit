import { app, BrowserWindow } from "electron";
import electronUpdater from "electron-updater";
import type { UpdateStatus } from "../shared/types.ts";

const { autoUpdater } = electronUpdater;

let status: UpdateStatus = { state: "idle" };

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
  void autoUpdater.checkForUpdates();
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}
