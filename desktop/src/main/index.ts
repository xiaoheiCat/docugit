import { app, BrowserWindow, shell } from "electron";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { resolveAppIcon } from "./app-icon.ts";
import { registerIpcHandlers } from "./ipc.ts";
import { getDataRoot } from "./git-resolver.ts";
import {
  SESSION_ACTIVE_WORKSPACE_KEY,
  touchWorkspaceSync,
} from "./workspace-registry.ts";

const SETTINGS_FILE = "settings.json";

function touchActiveWorkspaceFromSettings(): void {
  try {
    const settingsPath = join(getDataRoot(), SETTINGS_FILE);
    if (!existsSync(settingsPath)) {
      return;
    }
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8")) as Record<string, string>;
    const activeId = settings[SESSION_ACTIVE_WORKSPACE_KEY];
    if (activeId) {
      touchWorkspaceSync(activeId);
    }
  } catch {
    // ignore settings read errors on quit
  }
}

function resolvePreloadPath(): string {
  const dir = join(__dirname, "../preload");
  const mjs = join(dir, "index.mjs");
  if (existsSync(mjs)) {
    return mjs;
  }
  const js = join(dir, "index.js");
  if (existsSync(js)) {
    return js;
  }
  throw new Error(`fatal: preload script not found in ${dir}`);
}

function createWindow(): void {
  const icon = resolveAppIcon();
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    ...(icon ? { icon } : {}),
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hiddenInset" as const,
          trafficLightPosition: { x: 14, y: 14 },
        }
      : {}),
    backgroundColor: "#0b1220",
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  touchActiveWorkspaceFromSettings();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
