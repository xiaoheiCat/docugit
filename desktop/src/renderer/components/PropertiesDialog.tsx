import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";
import { ErrorDialog, type ErrorDialogState } from "./ErrorDialog.tsx";

interface PropertiesDialogProps {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
}

export function PropertiesDialog({
  open,
  workspaceId,
  onClose,
}: PropertiesDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [remoteUrl, setRemoteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    void window.docugitDesktop.getWorkspaceOriginUrl(workspaceId).then((url) => {
      setRemoteUrl(url ?? "");
    });
  }, [open, workspaceId]);

  if (!open) {
    return null;
  }

  async function handleSave(): Promise<void> {
    setBusy(true);
    try {
      await window.docugitDesktop.setWorkspaceOriginUrl(workspaceId, remoteUrl);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorDialog({ message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="dialog-backdrop no-drag">
        <div className="dialog-stack dialog-stack--narrow">
          <GlassPanel className="dialog">
            <h2>{t("dialog.properties.title")}</h2>
            <label>
              {t("dialog.properties.remoteUrl")}
              <input
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                disabled={busy}
                placeholder="https://github.com/org/repo.git"
              />
            </label>
          </GlassPanel>
          <div className="dialog-actions">
            <GlassButton onClick={onClose} disabled={busy}>
              {t("dialog.cancel")}
            </GlassButton>
            <GlassButton primary disabled={busy} onClick={() => void handleSave()}>
              {t("dialog.confirm")}
            </GlassButton>
          </div>
        </div>
      </div>
      <ErrorDialog state={errorDialog} onClose={() => setErrorDialog(null)} />
    </>
  );
}
