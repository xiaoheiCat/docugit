import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

interface GitIdentityDialogProps {
  open: boolean;
  details?: string;
  busy?: boolean;
  onSave: (name: string, email: string) => Promise<void>;
  onClose: () => void;
}

export function GitIdentityDialog({
  open,
  details,
  busy = false,
  onSave,
  onClose,
}: GitIdentityDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    void window.docugitDesktop.getGitCommitIdentity().then((identity) => {
      setName(identity.name);
      setEmail(identity.email);
    });
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      await onSave(name.trim(), email.trim());
    } finally {
      setSaving(false);
    }
  }

  const disabled = busy || saving;

  return (
    <div className="dialog-backdrop no-drag">
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{t("gitIdentity.title")}</h2>
          <p className="dialog-lead">{t("gitIdentity.message")}</p>
          {details ? <pre className="dialog-details-pre">{details}</pre> : null}
          <label>
            {t("settings.gitUserName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              autoFocus
            />
          </label>
          <label>
            {t("settings.gitUserEmail")}
            <input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
            />
          </label>
        </GlassPanel>
        <div className="dialog-actions">
          <GlassButton onClick={onClose} disabled={disabled}>
            {t("dialog.cancel")}
          </GlassButton>
          <GlassButton primary disabled={disabled} onClick={() => void handleSave()}>
            {saving ? t("gitIdentity.saving") : t("gitIdentity.save")}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
