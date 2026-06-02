import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  cloneRepo,
  createInit,
  createNew,
  getWorkspace,
  importRepo,
  listWorkspaces,
  removeWorkspace,
} from "./workspace-registry.ts";
import { runDocugit, runGit } from "./cli-spawner.ts";
import { getDataRoot, resolveDocugit, resolveGit } from "./git-resolver.ts";

const SETTINGS_FILE = "settings.json";

async function settingsPath(): Promise<string> {
  const root = getDataRoot();
  await mkdir(root, { recursive: true });
  return join(root, SETTINGS_FILE);
}

async function readSettings(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(await settingsPath(), "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeSettings(settings: Record<string, string>): Promise<void> {
  await writeFile(await settingsPath(), JSON.stringify(settings, null, 2), "utf-8");
}

function focusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

export function registerIpcHandlers(): void {
  ipcMain.handle("workspaces:list", () => listWorkspaces());

  ipcMain.handle("workspaces:new", (_event, params) => createNew(params));

  ipcMain.handle("workspaces:init", (_event, params) => createInit(params));

  ipcMain.handle("workspaces:clone", (_event, params) => cloneRepo(params));

  ipcMain.handle("workspaces:import", (_event, params) => importRepo(params));

  ipcMain.handle("workspaces:remove", (_event, id: string) => removeWorkspace(id));

  ipcMain.handle("docugit:run", async (_event, workspaceId: string, args: string[]) => {
    const workspace = await getWorkspace(workspaceId);
    return runDocugit(workspace.path, args);
  });

  ipcMain.handle("git:run", async (_event, workspaceId: string, args: string[]) => {
    const workspace = await getWorkspace(workspaceId);
    return runGit(workspace.path, args);
  });

  ipcMain.handle("dialog:pickFile", async (_event, filters?: { name: string; extensions: string[] }[]) => {
    const win = focusedWindow();
    const result = win
      ? await dialog.showOpenDialog(win, {
          properties: ["openFile"],
          filters: filters ?? [
            { name: "Office", extensions: ["docx", "xlsx", "pptx"] },
            { name: "All", extensions: ["*"] },
          ],
        })
      : await dialog.showOpenDialog({
          properties: ["openFile"],
          filters: filters ?? [
            { name: "Office", extensions: ["docx", "xlsx", "pptx"] },
            { name: "All", extensions: ["*"] },
          ],
        });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle("dialog:pickDirectory", async () => {
    const win = focusedWindow();
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ["openDirectory"] })
      : await dialog.showOpenDialog({ properties: ["openDirectory"] });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle("runtime:info", () => {
    const git = resolveGit();
    return {
      docugitPath: resolveDocugit(),
      gitPath: git.path,
      gitSource: git.source,
      dataRoot: getDataRoot(),
    };
  });

  ipcMain.handle("settings:get", async (_event, key: string) => {
    const settings = await readSettings();
    return settings[key] ?? null;
  });

  ipcMain.handle("settings:set", async (_event, key: string, value: string) => {
    const settings = await readSettings();
    settings[key] = value;
    await writeSettings(settings);
  });
}
