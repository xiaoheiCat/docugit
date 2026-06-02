export type DocumentType = "docx" | "xlsx" | "pptx";

export interface SemanticChange {
  kind: "paragraph" | "cell" | "slide";
  location: string;
  before: string;
  after: string;
  type: "added" | "removed" | "modified";
}

export interface SemanticDiffResult {
  documentType: DocumentType;
  changes: SemanticChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

export interface GitStatusFile {
  path: string;
  indexStatus: string;
  worktreeStatus: string;
}

export interface GitStatusJson {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  clean: boolean;
  files: GitStatusFile[];
}

export interface OpenSessionJson {
  active: boolean;
  path: string | null;
}

export interface StatusJson {
  git: GitStatusJson;
  semantic: SemanticDiffResult | null;
  openSession: OpenSessionJson;
}

export interface LogEntryJson {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
}

export interface MergeResultJson {
  success: boolean;
  summary?: string;
  conflicts?: SemanticDiffResult;
}

export type WorkspaceSource = "new" | "init" | "clone" | "import";

export interface WorkspaceEntry {
  id: string;
  name: string;
  path: string;
  documentType: DocumentType;
  remoteUrl?: string;
  createdAt: string;
  source: WorkspaceSource;
}

export interface WorkspaceRegistry {
  workspaces: WorkspaceEntry[];
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface RuntimeInfo {
  docugitPath: string;
  gitPath: string;
  gitSource: "system" | "bundled";
  dataRoot: string;
}

export interface NewRepoParams {
  type: DocumentType;
  name: string;
}

export interface InitRepoParams {
  sourceFile: string;
}

export interface CloneRepoParams {
  url: string;
  name?: string;
}

export interface ImportRepoParams {
  sourcePath: string;
  name?: string;
}

export interface DocuGitDesktopApi {
  listWorkspaces(): Promise<WorkspaceEntry[]>;
  createNew(params: NewRepoParams): Promise<WorkspaceEntry>;
  createInit(params: InitRepoParams): Promise<WorkspaceEntry>;
  cloneRepo(params: CloneRepoParams): Promise<WorkspaceEntry>;
  importRepo(params: ImportRepoParams): Promise<WorkspaceEntry>;
  removeWorkspace(id: string): Promise<void>;
  runDocugit(workspaceId: string, args: string[]): Promise<CommandResult>;
  runGit(workspaceId: string, args: string[]): Promise<CommandResult>;
  pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null>;
  pickDirectory(): Promise<string | null>;
  getRuntimeInfo(): Promise<RuntimeInfo>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

declare global {
  interface Window {
    docugitDesktop: DocuGitDesktopApi;
  }
}

export {};
