import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  LogEntryJson,
  MergeResultJson,
  SemanticDiffResult,
  StatusJson,
  WorkspaceEntry,
} from "../../shared/types.ts";
import { ActionDock } from "./ActionDock.tsx";
import { ErrorDialog, type ErrorDialogState } from "./ErrorDialog.tsx";
import { RollbackDialog } from "./RollbackDialog.tsx";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";
import { NoticeBanner, type NoticeState } from "./NoticeBanner.tsx";
import { DiffReport } from "../diff/DiffReport.tsx";
import { LogView } from "../views/LogView.tsx";
import { StatusView } from "../views/StatusView.tsx";
import { RepoDialogs, type DialogKind } from "../views/RepoDialogs.tsx";
import {
  formatCommandError,
  formatDocugitSuccess,
  formatGitSuccess,
} from "../utils/format-feedback.ts";

type Panel = "status" | "diff" | "log";

interface RepoTabProps {
  workspace: WorkspaceEntry;
  active: boolean;
}

function parseJson<T>(stdout: string): T | null {
  try {
    return JSON.parse(stdout) as T;
  } catch {
    return null;
  }
}

function defaultExportFilename(workspace: WorkspaceEntry): string {
  const ext = workspace.documentType;
  if (workspace.name.toLowerCase().endsWith(`.${ext}`)) {
    return workspace.name;
  }
  return `${workspace.name}.${ext}`;
}

export function RepoTab({ workspace, active }: RepoTabProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Panel>("status");
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [diff, setDiff] = useState<SemanticDiffResult | null>(null);
  const [log, setLog] = useState<LogEntryJson[]>([]);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState | null>(null);
  const [revertTarget, setRevertTarget] = useState<LogEntryJson | null>(null);
  const [revertBusy, setRevertBusy] = useState(false);
  const [logHighlightHash, setLogHighlightHash] = useState<string | null>(null);
  const [diffRefHash, setDiffRefHash] = useState<string | null>(null);
  const diffRefHashRef = useRef<string | null>(null);

  useEffect(() => {
    diffRefHashRef.current = diffRefHash;
  }, [diffRefHash]);

  const showError = useCallback(
    (message: string, details?: string, title?: string) => {
      setErrorDialog({ message, details, title });
    },
    [],
  );

  const loadDiff = useCallback(
    async (refHash?: string | null): Promise<boolean> => {
      const targetRef = refHash === undefined ? diffRefHashRef.current : refHash;
      const args = targetRef ? ["diff", "--json", "--ref", targetRef] : ["diff", "--json"];
      const diffResult = await window.docugitDesktop.runDocugit(workspace.id, args);
      if (diffResult.exitCode !== 0) {
        return false;
      }
      if (targetRef !== diffRefHashRef.current) {
        return true;
      }
      setDiff(parseJson<SemanticDiffResult>(diffResult.stdout));
      return true;
    },
    [workspace.id],
  );

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const statusResult = await window.docugitDesktop.runDocugit(workspace.id, ["status", "--json"]);
    if (statusResult.exitCode === 0) {
      setStatus(parseJson<StatusJson>(statusResult.stdout));
    } else if (!silent) {
      showError(
        formatCommandError(statusResult.stderr || statusResult.stdout, t, "refresh"),
        [statusResult.stderr, statusResult.stdout].filter(Boolean).join("\n"),
      );
    }

    await loadDiff();

    const logResult = await window.docugitDesktop.runDocugit(workspace.id, ["log", "--json"]);
    if (logResult.exitCode === 0) {
      setLog(parseJson<LogEntryJson[]>(logResult.stdout) ?? []);
    }
  }, [loadDiff, showError, t, workspace.id]);

  useEffect(() => {
    if (!active) {
      return;
    }

    void refresh({ silent: true });
    const timer = window.setInterval(() => {
      void refresh({ silent: true });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [active, refresh]);

  const navigateToCommit = useCallback((hash: string) => {
    setPanel("log");
    setLogHighlightHash(hash);
  }, []);

  useEffect(() => {
    if (!logHighlightHash) {
      return;
    }
    const timer = window.setTimeout(() => setLogHighlightHash(null), 5000);
    return () => window.clearTimeout(timer);
  }, [logHighlightHash]);

  const loadBranchOptions = useCallback(async () => {
    setBranchesLoading(true);
    try {
      const result = await window.docugitDesktop.runGit(workspace.id, [
        "for-each-ref",
        "--sort=-committerdate",
        "refs/heads/",
        "--format=%(refname:short)",
      ]);
      if (result.exitCode !== 0) {
        setBranchOptions([]);
        return;
      }
      setBranchOptions(
        result.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      );
    } finally {
      setBranchesLoading(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    if (dialog === "merge" || dialog === "branch") {
      void loadBranchOptions();
    }
  }, [dialog, loadBranchOptions]);

  if (!active) return null;

  async function runDocugit(args: string[], contextKey: string): Promise<boolean> {
    setNotice(null);
    const result = await window.docugitDesktop.runDocugit(workspace.id, args);
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n");

    if (result.exitCode !== 0) {
      showError(formatCommandError(result.stderr || result.stdout, t, contextKey), details);
      await refresh();
      return false;
    }

    const message = formatDocugitSuccess(args, result, t);
    if (message) {
      setNotice({ kind: "success", message });
    }
    setPanel("status");
    await refresh();
    return true;
  }

  async function runGit(args: string[], contextKey: string): Promise<boolean> {
    setNotice(null);
    const result = await window.docugitDesktop.runGit(workspace.id, args);
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n");

    if (result.exitCode !== 0) {
      showError(formatCommandError(result.stderr || result.stdout, t, contextKey), details);
      await refresh();
      return false;
    }

    const message = formatGitSuccess(args, result, t);
    if (message) {
      setNotice({ kind: "success", message });
    }
    setPanel("status");
    await refresh();
    return true;
  }

  async function handleMerge(branch: string): Promise<void> {
    setNotice(null);
    const result = await window.docugitDesktop.runDocugit(workspace.id, ["merge", branch, "--json"]);
    const payload = parseJson<MergeResultJson>(result.stdout);
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n");

    if (payload?.success === false && payload.conflicts) {
      setDiffRefHash(null);
      setDiff(payload.conflicts);
      setPanel("diff");
      showError(t("diff.mergeConflicts"), details, t("diff.mergeConflicts"));
      return;
    }

    if (result.exitCode !== 0) {
      showError(formatCommandError(result.stderr || result.stdout, t, "merge"), details);
      await refresh();
      return;
    }

    setNotice({ kind: "success", message: t("success.merge") });
    setPanel("status");
    await refresh();
  }

  async function handleDiffRef(hash: string): Promise<void> {
    setDiffRefHash(hash);
    const args = ["diff", "--json", "--ref", hash];
    const result = await window.docugitDesktop.runDocugit(workspace.id, args);
    if (result.exitCode !== 0) {
      if (diffRefHashRef.current === hash) {
        setDiffRefHash(null);
      }
      showError(
        formatCommandError(result.stderr || result.stdout, t, "diff"),
        [result.stderr, result.stdout].filter(Boolean).join("\n"),
      );
      return;
    }
    if (diffRefHashRef.current !== hash) {
      return;
    }
    setDiff(parseJson<SemanticDiffResult>(result.stdout));
    setPanel("diff");
  }

  function selectPanel(next: Panel): void {
    if (next === panel) {
      return;
    }
    if (next === "diff") {
      resetDiffToWorktree();
    }
    setPanel(next);
  }

  function resetDiffToWorktree(): void {
    setDiffRefHash(null);
    void loadDiff(null);
  }

  async function handleExport(): Promise<void> {
    const picked = await window.docugitDesktop.pickSaveFile({
      defaultPath: defaultExportFilename(workspace),
      extension: workspace.documentType,
    });
    if (!picked) {
      return;
    }

    setNotice(null);
    const result = await window.docugitDesktop.runDocugit(workspace.id, ["export", picked]);
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n");
    if (result.exitCode !== 0) {
      showError(formatCommandError(result.stderr || result.stdout, t, "export"), details);
      return;
    }

    const message = formatDocugitSuccess(["export"], result, t);
    if (message) {
      setNotice({ kind: "success", message });
    }
  }

  function openRevertDialog(entry: LogEntryJson): void {
    if (status?.git.headHash === entry.hash) {
      return;
    }
    setRevertTarget(entry);
  }

  async function handleRevert(message: string): Promise<void> {
    if (!revertTarget) {
      return;
    }

    setRevertBusy(true);
    setNotice(null);
    try {
      if (status?.openSession.active) {
        const restore = await window.docugitDesktop.runDocugit(workspace.id, ["restore", "-y"]);
        if (restore.exitCode !== 0) {
          showError(
            formatCommandError(restore.stderr || restore.stdout, t, "revert"),
            [restore.stderr, restore.stdout].filter(Boolean).join("\n"),
          );
          return;
        }
      }

      const readTree = await window.docugitDesktop.runGit(workspace.id, [
        "read-tree",
        "-u",
        "--reset",
        revertTarget.hash,
      ]);
      if (readTree.exitCode !== 0) {
        showError(
          formatCommandError(readTree.stderr || readTree.stdout, t, "revert"),
          [readTree.stderr, readTree.stdout].filter(Boolean).join("\n"),
        );
        await refresh();
        return;
      }

      const defaultMessage = `docugit: revert to ${revertTarget.shortHash}${
        revertTarget.subject ? ` (${revertTarget.subject})` : ""
      }`;
      const commitMessage = message || defaultMessage;
      const commit = await window.docugitDesktop.runDocugit(workspace.id, [
        "commit",
        "-m",
        commitMessage,
      ]);
      const details = [commit.stderr, commit.stdout].filter(Boolean).join("\n");
      if (commit.exitCode !== 0) {
        showError(formatCommandError(commit.stderr || commit.stdout, t, "revert"), details);
        await refresh();
        return;
      }

      setNotice({ kind: "success", message: t("success.revert") });
      setRevertTarget(null);
      setPanel("status");
      await refresh();
    } finally {
      setRevertBusy(false);
    }
  }

  return (
    <div className="repo-tab-host">
      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="repo-body">
        <div className="panel-tabs">
          {(["status", "diff", "log"] as Panel[]).map((item) => (
            <GlassButton key={item} primary={panel === item} onClick={() => selectPanel(item)}>
              {t(`panel.${item}`)}
            </GlassButton>
          ))}
        </div>

        <GlassPanel variant="fill" className="panel-body-host">
          {panel === "status" ? <StatusView status={status} /> : null}
          {panel === "diff" ? (
            diff ? (
              <DiffReport
                result={diff}
                onSelectCommit={navigateToCommit}
                onResetCompare={resetDiffToWorktree}
              />
            ) : (
              <p className="empty-state">{t("diff.noChanges")}</p>
            )
          ) : null}
          {panel === "log" ? (
            <LogView
              entries={log}
              headHash={status?.git.headHash}
              currentBranch={status?.git.branch}
              highlightHash={logHighlightHash}
              onSelectCommit={(hash) => void handleDiffRef(hash)}
              onRevert={openRevertDialog}
            />
          ) : null}
        </GlassPanel>
      </div>

      <ActionDock
        actions={[
          {
            id: "open",
            label: t("toolbar.open"),
            description: t("dock.hint.open"),
            onClick: () => void runDocugit(["open"], "open"),
          },
          {
            id: "commit",
            label: t("toolbar.commit"),
            description: t("dock.hint.commit"),
            onClick: () => setDialog("commit"),
          },
          {
            id: "restore",
            label: t("toolbar.restore"),
            description: t("dock.hint.restore"),
            onClick: () => setDialog("restore"),
          },
          {
            id: "pull",
            label: t("toolbar.pull"),
            description: t("dock.hint.pull"),
            onClick: () => void runGit(["pull"], "pull"),
          },
          {
            id: "fetch",
            label: t("toolbar.fetch"),
            description: t("dock.hint.fetch"),
            onClick: () => void runGit(["fetch"], "fetch"),
          },
          {
            id: "merge",
            label: t("toolbar.merge"),
            description: t("dock.hint.merge"),
            onClick: () => setDialog("merge"),
          },
          {
            id: "branch",
            label: t("toolbar.branch"),
            description: t("dock.hint.branch"),
            onClick: () => setDialog("branch"),
          },
          {
            id: "export",
            label: t("toolbar.export"),
            description: t("dock.hint.export"),
            onClick: () => void handleExport(),
          },
        ]}
      />

      <RepoDialogs
        kind={dialog}
        onClose={() => setDialog(null)}
        onNew={async () => undefined}
        onInit={async () => undefined}
        onClone={async () => undefined}
        onImport={async () => undefined}
        onMerge={handleMerge}
        onBranch={async (name) => {
          const checkout = await window.docugitDesktop.runGit(workspace.id, ["checkout", name]);
          if (checkout.exitCode !== 0) {
            await runGit(["checkout", "-b", name], "branch");
            return;
          }
          const message = formatGitSuccess(["checkout", name], checkout, t);
          if (message) {
            setNotice({ kind: "success", message });
          }
          setPanel("status");
          await refresh();
        }}
        onDeleteBranch={async (name) => {
          const result = await window.docugitDesktop.runGit(workspace.id, ["branch", "-d", name]);
          const details = [result.stderr, result.stdout].filter(Boolean).join("\n");
          if (result.exitCode !== 0) {
            showError(formatCommandError(result.stderr || result.stdout, t, "branchDelete"), details);
            throw new Error("branch delete failed");
          }
          setNotice({ kind: "success", message: t("success.branchDeleted", { branch: name }) });
          await loadBranchOptions();
          await refresh();
        }}
        onCommit={async (message) => {
          await runDocugit(message ? ["commit", "-m", message] : ["commit"], "commit");
        }}
        onRestore={async () => {
          await runDocugit(["restore", "-y"], "restore");
        }}
        branchOptions={branchOptions}
        currentBranch={status?.git.branch ?? null}
        branchesLoading={branchesLoading}
      />

      <ErrorDialog state={errorDialog} onClose={() => setErrorDialog(null)} />

      <RollbackDialog
        open={revertTarget !== null}
        shortHash={revertTarget?.shortHash ?? ""}
        subject={revertTarget?.subject ?? ""}
        suggestedMessage={
          revertTarget
            ? `docugit: revert to ${revertTarget.shortHash}${
                revertTarget.subject ? ` (${revertTarget.subject})` : ""
              }`
            : ""
        }
        busy={revertBusy}
        onConfirm={(message) => void handleRevert(message)}
        onClose={() => {
          if (!revertBusy) {
            setRevertTarget(null);
          }
        }}
      />
    </div>
  );
}

export function RepoTabButton({
  title,
  active,
  onSelect,
  onClose,
}: {
  title: string;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`repo-tab ${active ? "is-active" : ""}`}>
      <GlassButton primary={active} onClick={onSelect}>
        {title}
      </GlassButton>
      <button type="button" className="repo-tab-close" aria-label={t("tabs.close")} onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export { RepoTab as RepoTabContent };
