import { ipcMain, dialog, BrowserWindow, app } from "electron";
import {
  checkForUpdates,
  getUpdateStatus,
  quitAndInstall,
} from "./auto-updater.ts";
import {
  cloneRepo,
  createInit,
  createNew,
  getWorkspace,
  getWorkspaceOriginUrl,
  importRepo,
  listWorkspaces,
  removeWorkspace,
  setWorkspaceOriginUrl,
  touchWorkspace,
  touchWorkspaceSync,
} from "./workspace-registry.ts";
import { runDocugit, runGit } from "./cli-spawner.ts";
import { getDataRoot, formatDocugitPath, resolveDocugit, resolveGit } from "./git-resolver.ts";
import { getSetting, setSetting } from "./settings-store.ts";
import {
  applyGitCommitIdentity,
  loadGitCommitIdentity,
  type GitCommitIdentityInput,
} from "./git-identity.ts";

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

  ipcMain.handle("workspaces:touch", (_event, id: string) => touchWorkspace(id));

  ipcMain.on("workspaces:touchSync", (event, id: string) => {
    touchWorkspaceSync(id);
    event.returnValue = true;
  });

  ipcMain.handle("workspaces:getOriginUrl", async (_event, workspaceId: string) => {
    return getWorkspaceOriginUrl(workspaceId);
  });

  ipcMain.handle(
    "workspaces:setOriginUrl",
    async (_event, workspaceId: string, url: string) => {
      await setWorkspaceOriginUrl(workspaceId, url);
    },
  );

  ipcMain.handle("docugit:run", async (_event, workspaceId: string, args: string[]) => {
    const workspace = await getWorkspace(workspaceId);
    return runDocugit(workspace.path, args);
  });

  ipcMain.handle("git:run", async (_event, workspaceId: string, args: string[]) => {
    const workspace = await getWorkspace(workspaceId);
    return runGit(workspace.path, args);
  });

  ipcMain.handle("git:getCommitIdentity", async () => {
    const identity = await loadGitCommitIdentity();
    return {
      name: identity.name ?? "",
      email: identity.email ?? "",
    };
  });

  ipcMain.handle("git:setCommitIdentity", async (_event, identity: GitCommitIdentityInput) => {
    await applyGitCommitIdentity(identity.name, identity.email);
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

  ipcMain.handle(
    "dialog:pickSaveFile",
    async (
      _event,
      options?: { defaultPath?: string; extension?: "docx" | "xlsx" | "pptx" },
    ) => {
      const win = focusedWindow();
      const extension = options?.extension ?? "docx";
      const dialogOptions = {
        defaultPath: options?.defaultPath,
        filters: [{ name: "Office", extensions: [extension] }],
      };
      const result = win
        ? await dialog.showSaveDialog(win, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);
      return result.canceled ? null : (result.filePath ?? null);
    },
  );

  ipcMain.handle("runtime:info", () => {
    const git = resolveGit();
    return {
      docugitPath: formatDocugitPath(resolveDocugit()),
      gitPath: git.path,
      gitSource: git.source,
      dataRoot: getDataRoot(),
    };
  });

  ipcMain.handle("settings:get", async (_event, key: string) => {
    return getSetting(key);
  });

  ipcMain.handle("settings:set", async (_event, key: string, value: string) => {
    await setSetting(key, value);
  });

  ipcMain.handle("app:getVersion", () => app.getVersion());

  ipcMain.handle("update:status", () => getUpdateStatus());

  ipcMain.handle("update:check", () => checkForUpdates());

  ipcMain.handle("update:quitAndInstall", () => {
    quitAndInstall();
  });
}
