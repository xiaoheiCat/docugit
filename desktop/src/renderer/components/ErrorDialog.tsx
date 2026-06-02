import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

export interface ErrorDialogState {
  title?: string;
  message: string;
  details?: string;
}

interface ErrorDialogProps {
  state: ErrorDialogState | null;
  onClose: () => void;
}

export function ErrorDialog({ state, onClose }: ErrorDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setShowDetails(false);
  }, [state?.message]);

  if (!state) {
    return null;
  }

  const hasDetails = Boolean(state.details?.trim());

  return (
    <div className="dialog-backdrop no-drag" role="alertdialog" aria-modal="true">
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{state.title ?? t("error.title")}</h2>
          <p className="dialog-lead">{state.message}</p>
          {hasDetails ? (
            <div className="dialog-details-block">
              <button
                type="button"
                className="dialog-details-toggle"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? t("error.hideDetails") : t("error.showDetails")}
              </button>
              {showDetails ? <pre className="dialog-details-pre">{state.details}</pre> : null}
            </div>
          ) : null}
        </GlassPanel>
        <div className="dialog-actions">
          <GlassButton primary onClick={onClose}>
            {t("error.dismiss")}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
