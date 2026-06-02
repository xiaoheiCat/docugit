import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

interface RollbackDialogProps {
  open: boolean;
  shortHash: string;
  subject: string;
  suggestedMessage: string;
  busy?: boolean;
  onConfirm: (message: string) => void;
  onClose: () => void;
}

export function RollbackDialog({
  open,
  shortHash,
  subject,
  suggestedMessage,
  busy = false,
  onConfirm,
  onClose,
}: RollbackDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [message, setMessage] = useState(suggestedMessage);

  useEffect(() => {
    if (open) {
      setMessage(suggestedMessage);
    }
  }, [open, suggestedMessage]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop no-drag dialog-backdrop--elevated">
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{t("dialog.revert.title")}</h2>
          <p className="dialog-lead">
            {t("dialog.revert.message", {
              hash: shortHash,
              subject: subject || t("dialog.revert.noSubject"),
            })}
          </p>
          <label>
            {t("dialog.revert.commitMessage")}
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !busy) {
                  onConfirm(message.trim());
                }
              }}
              autoFocus
            />
          </label>
        </GlassPanel>
        <div className="dialog-actions">
          <GlassButton onClick={onClose} disabled={busy}>
            {t("dialog.cancel")}
          </GlassButton>
          <GlassButton primary disabled={busy} onClick={() => onConfirm(message.trim())}>
            {t("dialog.revert.confirm")}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
