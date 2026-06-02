import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DocumentType } from "../../shared/types.ts";
import { GlassPanel } from "../components/GlassPanel.tsx";

type DialogKind = "new" | "init" | "clone" | "import" | "merge" | "branch" | "commit" | null;

interface RepoDialogsProps {
  kind: DialogKind;
  onClose: () => void;
  onNew: (type: DocumentType, name: string) => Promise<void>;
  onInit: (sourceFile: string) => Promise<void>;
  onClone: (url: string) => Promise<void>;
  onImport: (sourcePath: string) => Promise<void>;
  onMerge: (branch: string) => Promise<void>;
  onBranch: (name: string) => Promise<void>;
  onCommit: (message: string) => Promise<void>;
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
  onCommit,
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

  if (!kind) return null;

  async function submit(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    try {
      await action();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop no-drag">
      <GlassPanel className="dialog">
        {kind === "new" ? (
          <>
            <h2>{t("dialog.new.title")}</h2>
            <label>
              {t("dialog.new.type")}
              <select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                <option value="docx">docx</option>
                <option value="xlsx">xlsx</option>
                <option value="pptx">pptx</option>
              </select>
            </label>
            <label>
              {t("dialog.new.name")}
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="dialog-actions">
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={!name.trim() || busy}
                onClick={() => submit(() => onNew(type, name.trim()))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}

        {kind === "init" ? (
          <>
            <h2>{t("dialog.init.title")}</h2>
            <label>
              {t("dialog.init.pick")}
              <input value={sourceFile} readOnly placeholder={t("dialog.init.pick")} />
            </label>
            <div className="dialog-actions">
              <button
                onClick={async () => {
                  const picked = await window.docugitDesktop.pickFile();
                  if (picked) setSourceFile(picked);
                }}
              >
                {t("dialog.init.pick")}
              </button>
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={!sourceFile || busy}
                onClick={() => submit(() => onInit(sourceFile))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}

        {kind === "clone" ? (
          <>
            <h2>{t("dialog.clone.title")}</h2>
            <label>
              {t("dialog.clone.url")}
              <input value={url} onChange={(e) => setUrl(e.target.value)} />
            </label>
            <div className="dialog-actions">
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={!url.trim() || busy}
                onClick={() => submit(() => onClone(url.trim()))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}

        {kind === "import" ? (
          <>
            <h2>{t("dialog.import.title")}</h2>
            <label>
              {t("dialog.import.pick")}
              <input value={sourcePath} readOnly />
            </label>
            <div className="dialog-actions">
              <button
                onClick={async () => {
                  const picked = await window.docugitDesktop.pickDirectory();
                  if (picked) setSourcePath(picked);
                }}
              >
                {t("dialog.import.pick")}
              </button>
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={!sourcePath || busy}
                onClick={() => submit(() => onImport(sourcePath))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}

        {kind === "merge" ? (
          <>
            <h2>{t("toolbar.merge")}</h2>
            <label>
              {t("dialog.merge.branch")}
              <input value={branch} onChange={(e) => setBranch(e.target.value)} />
            </label>
            <div className="dialog-actions">
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={!branch.trim() || busy}
                onClick={() => submit(() => onMerge(branch.trim()))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}

        {kind === "branch" ? (
          <>
            <h2>{t("toolbar.branch")}</h2>
            <label>
              {t("dialog.branch.name")}
              <input value={branch} onChange={(e) => setBranch(e.target.value)} />
            </label>
            <div className="dialog-actions">
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={!branch.trim() || busy}
                onClick={() => submit(() => onBranch(branch.trim()))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}

        {kind === "commit" ? (
          <>
            <h2>{t("toolbar.commit")}</h2>
            <label>
              {t("dialog.commit.message")}
              <input value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <div className="dialog-actions">
              <button onClick={onClose}>{t("dialog.cancel")}</button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => submit(() => onCommit(message.trim()))}
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </>
        ) : null}
      </GlassPanel>
    </div>
  );
}

export type { DialogKind };
