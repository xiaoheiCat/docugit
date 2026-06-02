import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { DocuGitDesktopApi, UpdateStatus } from "../shared/types.ts";

const api: DocuGitDesktopApi = {
  platform: process.platform,
  listWorkspaces: () => ipcRenderer.invoke("workspaces:list"),
  createNew: (params) => ipcRenderer.invoke("workspaces:new", params),
  createInit: (params) => ipcRenderer.invoke("workspaces:init", params),
  cloneRepo: (params) => ipcRenderer.invoke("workspaces:clone", params),
  importRepo: (params) => ipcRenderer.invoke("workspaces:import", params),
  removeWorkspace: (id) => ipcRenderer.invoke("workspaces:remove", id),
  touchWorkspace: (id) => ipcRenderer.invoke("workspaces:touch", id),
  flushActiveWorkspace: (id) => {
    ipcRenderer.sendSync("workspaces:touchSync", id);
  },
  runDocugit: (workspaceId, args) => ipcRenderer.invoke("docugit:run", workspaceId, args),
  runGit: (workspaceId, args) => ipcRenderer.invoke("git:run", workspaceId, args),
  pickFile: (filters) => ipcRenderer.invoke("dialog:pickFile", filters),
  pickSaveFile: (options) => ipcRenderer.invoke("dialog:pickSaveFile", options),
  pickDirectory: () => ipcRenderer.invoke("dialog:pickDirectory"),
  getRuntimeInfo: () => ipcRenderer.invoke("runtime:info"),
  getSetting: (key) => ipcRenderer.invoke("settings:get", key),
  setSetting: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  quitAndInstall: () => ipcRenderer.invoke("update:quitAndInstall"),
  onUpdateStatus: (listener) => {
    const handler = (_event: IpcRendererEvent, status: UpdateStatus) => {
      listener(status);
    };
    ipcRenderer.on("update:status", handler);
    void ipcRenderer.invoke("update:status").then(listener);
    return () => {
      ipcRenderer.removeListener("update:status", handler);
    };
  },
};

contextBridge.exposeInMainWorld("docugitDesktop", api);
