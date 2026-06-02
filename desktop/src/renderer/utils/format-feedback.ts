import type { CommandResult } from "../../shared/types.ts";

type Translate = (key: string, options?: Record<string, string | number>) => string;

function firstLine(text: string): string {
  return text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
}

function normalizeRaw(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function isDocuGitRepoError(text: string, line: string): boolean {
  if (line.includes("not a docugit repository") || line.includes("missing .docugit.yml")) {
    return true;
  }
  if (!text.includes(".docugit.yml")) {
    return false;
  }
  return (
    text.includes("ENOENT") ||
    line.includes("no such file or directory") ||
    line.includes("does not exist")
  );
}

/** Turn CLI stderr/stdout into a short user-facing message. */
export function formatCommandError(
  raw: string,
  t: Translate,
  contextKey?: string,
): string {
  const text = normalizeRaw(raw);
  const line = firstLine(text).toLowerCase();

  if (!text) {
    return contextKey ? t(`errors.${contextKey}.generic`) : t("errors.generic");
  }

  if (isDocuGitRepoError(text, line)) {
    return t("errors.notDocuGitRepo");
  }
  if (text.includes("ENOENT") || line.includes("no such file or directory")) {
    return t("errors.fileNotFound");
  }
  if (line.includes("docugit binary not found") || line.includes("dev runtime not found")) {
    return t("errors.docugitMissing");
  }
  if (line.includes("not a git repository")) {
    return t("errors.notGitRepo");
  }
  if (line.includes("authentication failed") || line.includes("could not read username")) {
    return t("errors.authFailed");
  }
  if (line.includes("permission denied")) {
    return t("errors.permissionDenied");
  }
  if (line.includes("failed to connect") || line.includes("could not resolve host")) {
    return t("errors.network");
  }
  if (line.includes("merge conflict") || line.includes("conflict")) {
    return t("errors.mergeConflict");
  }
  if (line.includes("nothing to commit")) {
    return t("errors.nothingToCommit");
  }
  if (line.includes("already exists")) {
    return t("errors.alreadyExists");
  }
  if (line.includes("not fully merged")) {
    return t("errors.branchDelete.notMerged");
  }
  if (line.startsWith("fatal:")) {
    const stripped = firstLine(text).replace(/^fatal:\s*/i, "").trim();
    if (stripped.length > 0 && stripped.length < 200) {
      return stripped;
    }
  }
  if (line.startsWith("error:")) {
    const stripped = firstLine(text).replace(/^error:\s*/i, "").trim();
    if (stripped.length > 0 && stripped.length < 200) {
      return stripped;
    }
  }

  if (contextKey && t(`errors.${contextKey}.generic`) !== `errors.${contextKey}.generic`) {
    return t(`errors.${contextKey}.generic`);
  }

  const short = firstLine(text);
  if (short.length > 0 && short.length < 160) {
    return short;
  }

  return t("errors.generic");
}

function checkoutBranchName(args: string[]): string {
  const createIndex = args.indexOf("-b");
  if (createIndex !== -1) {
    return args[createIndex + 1] ?? "";
  }
  return args[1] ?? "";
}

export function formatGitSuccess(args: string[], result: CommandResult, t: Translate): string | null {
  const cmd = args[0];
  const out = normalizeRaw(`${result.stdout}\n${result.stderr}`).toLowerCase();

  if (cmd === "push") {
    if (out.includes("everything up-to-date")) {
      return t("success.pushUpToDate");
    }
    return t("success.push");
  }
  if (cmd === "pull") {
    if (out.includes("already up to date")) {
      return t("success.pullUpToDate");
    }
    return t("success.pull");
  }
  if (cmd === "fetch") {
    return t("success.fetch");
  }
  if (cmd === "checkout") {
    const branch = checkoutBranchName(args);
    return args.includes("-b") ? t("success.branchCreated", { branch }) : t("success.branchCheckout", { branch });
  }

  return null;
}

export function formatDocugitSuccess(args: string[], _result: CommandResult, t: Translate): string | null {
  const cmd = args[0];

  if (cmd === "open") {
    return t("success.open");
  }
  if (cmd === "commit") {
    return t("success.commit");
  }
  if (cmd === "restore") {
    return t("success.restore");
  }
  if (cmd === "export") {
    return t("success.export");
  }
  if (cmd === "merge") {
    return t("success.merge");
  }

  return null;
}

export function formatWorkspaceActionError(
  action: "new" | "init" | "clone" | "import",
  raw: string,
  t: Translate,
): string {
  const key = `errors.workspace.${action}`;
  const specific = formatCommandError(raw, t, `workspace.${action}`);
  const generic = t(`${key}.generic`);
  if (specific !== t("errors.generic") && specific !== t(`errors.workspace.${action}.generic`)) {
    return specific;
  }
  return generic;
}

/** Git index/worktree status letter → label key suffix. */
export function describeFileStatus(indexStatus: string, worktreeStatus: string): string {
  const combined = `${indexStatus}${worktreeStatus}`;
  if (combined.includes("?")) return "untracked";
  if (combined.includes("U")) return "unmerged";
  if (combined.includes("D")) return "deleted";
  if (combined.includes("A")) return "added";
  if (combined.includes("R")) return "renamed";
  if (combined.includes("M")) return "modified";
  return "changed";
}
