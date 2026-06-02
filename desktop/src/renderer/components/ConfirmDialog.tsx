import { useTranslation } from "react-i18next";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  elevated?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  elevated = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div
      className={`dialog-backdrop no-drag${elevated ? " dialog-backdrop--elevated" : ""}`}
      role="alertdialog"
      aria-modal="true"
    >
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{title}</h2>
          <p className="dialog-lead">{message}</p>
        </GlassPanel>
        <div className="dialog-actions">
          <GlassButton onClick={onCancel} disabled={busy}>
            {t("dialog.cancel")}
          </GlassButton>
          <GlassButton primary disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
