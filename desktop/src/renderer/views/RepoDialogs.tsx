import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DocumentType, GitCloneProgress } from "../../shared/types.ts";
import { BranchPicker } from "../components/BranchPicker.tsx";
import { GitProgressBar } from "../components/GitProgressBar.tsx";
import { formatDocumentTypeLabel } from "../utils/document-type.ts";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import { GlassButton, GlassPanel } from "../components/GlassPanel.tsx";

type DialogKind = "new" | "init" | "clone" | "import" | "merge" | "branch" | "commit" | "restore" | null;

interface RepoDialogsProps {
  kind: DialogKind;
  onClose: () => void;
  onNew: (type: DocumentType, name: string) => Promise<void>;
  onInit: (sourceFile: string) => Promise<void>;
  onClone: (url: string) => Promise<void>;
  onImport: (sourcePath: string) => Promise<void>;
  onMerge: (branch: string) => Promise<void>;
  onBranch: (name: string) => Promise<void>;
  onDeleteBranch?: (name: string) => Promise<void>;
  onCommit: (message: string) => Promise<void>;
  onRestore: () => Promise<void>;
  branchOptions?: string[];
  currentBranch?: string | null;
  branchesLoading?: boolean;
}

export function RepoDialogs({
  kind,
  onClose,
  onNew,
  onInit,
  onClone,
  onImport,
  onMerge,
  onBranch,
  onDeleteBranch,
  onCommit,
  onRestore,
  branchOptions = [],
  currentBranch = null,
  branchesLoading = false,
}: RepoDialogsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [type, setType] = useState<DocumentType>("docx");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [message, setMessage] = useState("");
  const [sourceFile, setSourceFile] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [busy, setBusy] = useState(false);
  const [cloneProgress, setCloneProgress] = useState<GitCloneProgress | null>(null);
  const [branchDeleteTarget, setBranchDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!kind) {
      return;
    }
    setBranch("");
    setMessage("");
    setName("");
    setUrl("");
    setSourceFile("");
    setSourcePath("");
    setBranchDeleteTarget(null);
    setCloneProgress(null);
  }, [kind]);

  useEffect(() => {
    if (kind !== "clone" || !busy) {
      return;
    }
    return window.docugitDesktop.onCloneProgress(setCloneProgress);
  }, [kind, busy]);

  if (!kind) return null;

  function cloneProgressAriaLabel(progress: GitCloneProgress | null): string {
    if (!progress) {
      return t("dialog.clone.progress");
    }
    const key = `dialog.clone.phase.${progress.phase}`;
    const translated = t(key, { percent: progress.percent });
    return translated === key ? t("dialog.clone.progress") : translated;
  }

  async function submit(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    if (kind === "clone") {
      setCloneProgress({ percent: 0, phase: "starting" });
    }
    try {
      await action();
      onClose();
    } finally {
      setBusy(false);
      setCloneProgress(null);
    }
  }

  async function confirmDeleteBranch(): Promise<void> {
    if (!branchDeleteTarget || !onDeleteBranch) {
      return;
    }

    setBusy(true);
    try {
      await onDeleteBranch(branchDeleteTarget);
      if (branch === branchDeleteTarget) {
        setBranch("");
      }
      setBranchDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  function renderActions(): React.JSX.Element | null {
    switch (kind) {
      case "new":
        return (
          <>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={!name.trim() || busy}
              onClick={() => submit(() => onNew(type, name.trim()))}
            >
              {t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "init":
        return (
          <>
            <GlassButton
              onClick={async () => {
                const picked = await window.docugitDesktop.pickFile();
                if (picked) setSourceFile(picked);
              }}
            >
              {t("dialog.init.pick")}
            </GlassButton>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={!sourceFile || busy}
              onClick={() => submit(() => onInit(sourceFile))}
            >
              {t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "clone":
        return (
          <>
            <GlassButton onClick={onClose} disabled={busy}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={!url.trim() || busy}
              onClick={() => submit(() => onClone(url.trim()))}
            >
              {busy ? t("dialog.clone.inProgress") : t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "import":
        return (
          <>
            <GlassButton
              onClick={async () => {
                const picked = await window.docugitDesktop.pickDirectory();
                if (picked) setSourcePath(picked);
              }}
            >
              {t("dialog.import.pick")}
            </GlassButton>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={!sourcePath || busy}
              onClick={() => submit(() => onImport(sourcePath))}
            >
              {t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "merge":
        return (
          <>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={!branch.trim() || busy}
              onClick={() => submit(() => onMerge(branch.trim()))}
            >
              {t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "branch":
        return (
          <>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={!branch.trim() || busy}
              onClick={() => submit(() => onBranch(branch.trim()))}
            >
              {t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "commit":
        return (
          <>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton
              primary
              disabled={busy}
              onClick={() => submit(() => onCommit(message.trim()))}
            >
              {t("dialog.confirm")}
            </GlassButton>
          </>
        );
      case "restore":
        return (
          <>
            <GlassButton onClick={onClose}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton primary disabled={busy} onClick={() => submit(() => onRestore())}>
              {t("dialog.restore.confirm")}
            </GlassButton>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div className="dialog-backdrop no-drag">
        <div className="dialog-stack">
          <GlassPanel className="dialog">
          {kind === "new" ? (
            <>
              <h2>{t("dialog.new.title")}</h2>
              <label>
                {t("dialog.new.type")}
                <select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                  <option value="docx">{formatDocumentTypeLabel("docx", t)}</option>
                  <option value="xlsx">{formatDocumentTypeLabel("xlsx", t)}</option>
                  <option value="pptx">{formatDocumentTypeLabel("pptx", t)}</option>
                </select>
              </label>
              <label>
                {t("dialog.new.name")}
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            </>
          ) : null}

          {kind === "init" ? (
            <>
              <h2>{t("dialog.init.title")}</h2>
              <label>
                {t("dialog.init.pick")}
                <input value={sourceFile} readOnly placeholder={t("dialog.init.pick")} />
              </label>
            </>
          ) : null}

          {kind === "clone" ? (
            <>
              <h2>{t("dialog.clone.title")}</h2>
              <label>
                {t("dialog.clone.url")}
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={busy}
                />
              </label>
              {busy ? (
                <GitProgressBar
                  percent={cloneProgress?.percent ?? 0}
                  ariaLabel={cloneProgressAriaLabel(cloneProgress)}
                />
              ) : null}
            </>
          ) : null}

          {kind === "import" ? (
            <>
              <h2>{t("dialog.import.title")}</h2>
              <label>
                {t("dialog.import.pick")}
                <input value={sourcePath} readOnly />
              </label>
            </>
          ) : null}

          {kind === "merge" ? (
            <>
              <h2>{t("toolbar.merge")}</h2>
              <BranchPicker
                label={t("dialog.merge.branch")}
                branches={branchOptions}
                currentBranch={currentBranch}
                value={branch}
                loading={branchesLoading}
                excludeCurrent
                selectOnly
                onChange={setBranch}
              />
            </>
          ) : null}

          {kind === "branch" ? (
            <>
              <h2>{t("toolbar.branch")}</h2>
              <BranchPicker
                label={t("dialog.branch.name")}
                branches={branchOptions}
                currentBranch={currentBranch}
                value={branch}
                loading={branchesLoading}
                deletable={Boolean(onDeleteBranch)}
                onChange={setBranch}
                onSwitch={(name) => void submit(() => onBranch(name))}
                onDelete={setBranchDeleteTarget}
              />
            </>
          ) : null}

          {kind === "commit" ? (
            <>
              <h2>{t("toolbar.commit")}</h2>
              <label>
                {t("dialog.commit.message")}
                <input value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
            </>
          ) : null}

          {kind === "restore" ? (
            <>
              <h2>{t("dialog.restore.title")}</h2>
              <p className="dialog-lead">{t("dialog.restore.message")}</p>
            </>
          ) : null}
        </GlassPanel>
        <div className="dialog-actions">{renderActions()}</div>
        </div>
      </div>

      <ConfirmDialog
        open={kind === "branch" && branchDeleteTarget !== null}
        elevated
        title={t("dialog.branchDelete.title")}
        message={t("dialog.branchDelete.message", { name: branchDeleteTarget ?? "" })}
        confirmLabel={t("dialog.branchDelete.confirm")}
        busy={busy}
        onConfirm={() => void confirmDeleteBranch()}
        onCancel={() => {
          if (!busy) {
            setBranchDeleteTarget(null);
          }
        }}
      />
    </>
  );
}

export type { DialogKind };
