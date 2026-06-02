import { useTranslation } from "react-i18next";
import type { WorkspaceEntry } from "../../shared/types.ts";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";
import { formatDocumentTypeLabel } from "../utils/document-type.ts";

interface OpenTabDialogProps {
  open: boolean;
  workspaces: WorkspaceEntry[];
  onClose: () => void;
  onPick: (entry: WorkspaceEntry) => void;
}

export function OpenTabDialog({
  open,
  workspaces,
  onClose,
  onPick,
}: OpenTabDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop no-drag">
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{t("nav.open")}</h2>
          {workspaces.length > 0 ? (
            <ul className="open-tab-list">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    type="button"
                    className="open-tab-item"
                    onClick={() => {
                      onPick(workspace);
                      onClose();
                    }}
                  >
                    <span className="open-tab-item__name">{workspace.name}</span>
                    <span className="open-tab-item__type">
                      {formatDocumentTypeLabel(workspace.documentType, t)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dialog-lead">{t("tabs.openEmpty")}</p>
          )}
        </GlassPanel>
        <div className="dialog-actions">
          <GlassButton onClick={onClose}>{t("dialog.cancel")}</GlassButton>
        </div>
      </div>
    </div>
  );
}
