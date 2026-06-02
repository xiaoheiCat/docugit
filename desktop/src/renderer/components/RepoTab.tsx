import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  DocumentType,
  LogEntryJson,
  MergeResultJson,
  SemanticDiffResult,
  StatusJson,
  WorkspaceEntry,
} from "../../shared/types.ts";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { DiffReport } from "../diff/DiffReport.tsx";
import { LogView } from "../views/LogView.tsx";
import { StatusView } from "../views/StatusView.tsx";
import { RepoDialogs, type DialogKind } from "../views/RepoDialogs.tsx";

type Panel = "status" | "diff" | "log" | "output";

interface RepoTabProps {
  workspace: WorkspaceEntry;
  active: boolean;
  onClose: () => void;
}

function parseJson<T>(stdout: string): T | null {
  try {
    return JSON.parse(stdout) as T;
  } catch {
    return null;
  }
}

export function RepoTab({ workspace, active, onClose }: RepoTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Panel>("status");
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [diff, setDiff] = useState<SemanticDiffResult | null>(null);
  const [log, setLog] = useState<LogEntryJson[]>([]);
  const [output, setOutput] = useState("");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const statusResult = await window.docugitDesktop.runDocugit(workspace.id, ["status", "--json"]);
    if (statusResult.exitCode === 0) {
      setStatus(parseJson<StatusJson>(statusResult.stdout));
    } else {
      setError(statusResult.stderr || statusResult.stdout);
    }

    const diffResult = await window.docugitDesktop.runDocugit(workspace.id, ["diff", "--json"]);
    if (diffResult.exitCode === 0) {
      setDiff(parseJson<SemanticDiffResult>(diffResult.stdout));
    }

    const logResult = await window.docugitDesktop.runDocugit(workspace.id, ["log", "--json"]);
    if (logResult.exitCode === 0) {
      setLog(parseJson<LogEntryJson[]>(logResult.stdout) ?? []);
    }
  }, [workspace.id]);

  useEffect(() => {
    if (active) {
      void refresh();
    }
  }, [active, refresh]);

  async function runDocugit(args: string[]): Promise<void> {
    setError(null);
    const result = await window.docugitDesktop.runDocugit(workspace.id, args);
    setOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
    if (result.exitCode !== 0) {
      setError(result.stderr || result.stdout || `exit ${result.exitCode}`);
    }
    setPanel("output");
    await refresh();
  }

  async function runGit(args: string[]): Promise<void> {
    setError(null);
    const result = await window.docugitDesktop.runGit(workspace.id, args);
    setOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
    if (result.exitCode !== 0) {
      setError(result.stderr || result.stdout || `exit ${result.exitCode}`);
    }
    setPanel("output");
    await refresh();
  }

  async function handleMerge(branch: string): Promise<void> {
    setError(null);
    const result = await window.docugitDesktop.runDocugit(workspace.id, ["merge", branch, "--json"]);
    const payload = parseJson<MergeResultJson>(result.stdout);
    if (payload?.success === false && payload.conflicts) {
      setDiff(payload.conflicts);
      setPanel("diff");
      setError(t("diff.mergeConflicts"));
      return;
    }
    setOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
    if (result.exitCode !== 0) {
      setError(result.stderr || result.stdout || `exit ${result.exitCode}`);
    }
    setPanel("output");
    await refresh();
  }

  async function handleDiffRef(hash: string): Promise<void> {
    const result = await window.docugitDesktop.runDocugit(workspace.id, ["diff", "--json", "--ref", hash]);
    if (result.exitCode === 0) {
      setDiff(parseJson<SemanticDiffResult>(result.stdout));
      setPanel("diff");
    }
  }

  if (!active) {
    return (
      <button className="tab no-drag" onClick={() => undefined}>
        {workspace.name}
      </button>
    );
  }

  return (
    <>
      <div className="toolbar no-drag glass-panel">
        <button onClick={() => void runDocugit(["open"])}>{t("toolbar.open")}</button>
        <button className="primary" onClick={() => setDialog("commit")}>
          {t("toolbar.commit")}
        </button>
        <button onClick={() => void runDocugit(["restore", "-y"])}>{t("toolbar.restore")}</button>
        <button onClick={() => void runGit(["push"])}>{t("toolbar.push")}</button>
        <button onClick={() => void runGit(["pull"])}>{t("toolbar.pull")}</button>
        <button onClick={() => void runGit(["fetch"])}>{t("toolbar.fetch")}</button>
        <button onClick={() => setDialog("merge")}>{t("toolbar.merge")}</button>
        <button onClick={() => setDialog("branch")}>{t("toolbar.branch")}</button>
        <button onClick={() => void refresh()}>{t("toolbar.refresh")}</button>
      </div>

      <div className="main-content">
        <div className="panel-tabs no-drag">
          {(["status", "diff", "log", "output"] as Panel[]).map((item) => (
            <button
              key={item}
              className={panel === item ? "active" : ""}
              onClick={() => setPanel(item)}
            >
              {t(`panel.${item}`)}
            </button>
          ))}
        </div>
        <GlassPanel className="panel-body">
          {panel === "status" ? <StatusView status={status} /> : null}
          {panel === "diff" && diff ? (
            <DiffReport result={diff} title={error === t("diff.mergeConflicts") ? t("diff.mergeConflicts") : undefined} />
          ) : null}
          {panel === "log" ? <LogView entries={log} onSelectCommit={(hash) => void handleDiffRef(hash)} /> : null}
          {panel === "output" ? <pre className="output-box">{output || "—"}</pre> : null}
        </GlassPanel>
      </div>

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
            await runGit(["checkout", "-b", name]);
            return;
          }
          setOutput([checkout.stdout, checkout.stderr].filter(Boolean).join("\n"));
          setPanel("output");
          await refresh();
        }}
        onCommit={async (message) =>
          runDocugit(message ? ["commit", "-m", message] : ["commit"])
        }
      />
    </>
  );
}

export function RepoTabButton({
  workspace,
  active,
  onSelect,
  onClose,
}: {
  workspace: WorkspaceEntry;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={`tab no-drag ${active ? "active" : ""}`}>
      <button type="button" onClick={onSelect} style={{ background: "none", border: "none", color: "inherit" }}>
        {workspace.name}
      </button>
      <button
        type="button"
        aria-label={t("tabs.close")}
        onClick={onClose}
        style={{ background: "none", border: "none", color: "var(--muted)" }}
      >
        ×
      </button>
    </div>
  );
}

export { RepoTab as RepoTabContent };
