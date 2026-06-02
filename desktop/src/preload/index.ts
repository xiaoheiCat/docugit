import { contextBridge, ipcRenderer } from "electron";
import type { DocuGitDesktopApi } from "../shared/types.ts";

const api: DocuGitDesktopApi = {
  listWorkspaces: () => ipcRenderer.invoke("workspaces:list"),
  createNew: (params) => ipcRenderer.invoke("workspaces:new", params),
  createInit: (params) => ipcRenderer.invoke("workspaces:init", params),
  cloneRepo: (params) => ipcRenderer.invoke("workspaces:clone", params),
  importRepo: (params) => ipcRenderer.invoke("workspaces:import", params),
  removeWorkspace: (id) => ipcRenderer.invoke("workspaces:remove", id),
  runDocugit: (workspaceId, args) => ipcRenderer.invoke("docugit:run", workspaceId, args),
  runGit: (workspaceId, args) => ipcRenderer.invoke("git:run", workspaceId, args),
  pickFile: (filters) => ipcRenderer.invoke("dialog:pickFile", filters),
  pickDirectory: () => ipcRenderer.invoke("dialog:pickDirectory"),
  getRuntimeInfo: () => ipcRenderer.invoke("runtime:info"),
  getSetting: (key) => ipcRenderer.invoke("settings:get", key),
  setSetting: (key, value) => ipcRenderer.invoke("settings:set", key, value),
};

contextBridge.exposeInMainWorld("docugitDesktop", api);
