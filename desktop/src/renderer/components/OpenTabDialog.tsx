import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorkspaceEntry } from "../../shared/types.ts";
import { DeleteIconButton } from "./DeleteIconButton.tsx";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";
import { formatDocumentTypeLabel } from "../utils/document-type.ts";

interface OpenTabDialogProps {
  open: boolean;
  workspaces: WorkspaceEntry[];
  onClose: () => void;
  onPick: (entry: WorkspaceEntry) => void;
  onRemoveWorkspace: (entry: WorkspaceEntry) => void;
}

function matchesQuery(workspace: WorkspaceEntry, query: string, typeLabel: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    workspace.name.toLowerCase().includes(needle) ||
    typeLabel.toLowerCase().includes(needle) ||
    (workspace.remoteUrl?.toLowerCase().includes(needle) ?? false)
  );
}

export function OpenTabDialog({
  open,
  workspaces,
  onClose,
  onPick,
  onRemoveWorkspace,
}: OpenTabDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    return workspaces.filter((workspace) =>
      matchesQuery(workspace, query, formatDocumentTypeLabel(workspace.documentType, t)),
    );
  }, [workspaces, query, t]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop no-drag">
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{t("nav.open")}</h2>
          {workspaces.length > 0 ? (
            <section className="open-tab-section">
              <h3>{t("welcome.reposTitle")}</h3>
              <label className="open-tab-search">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("openTab.searchPlaceholder")}
                  aria-label={t("openTab.searchPlaceholder")}
                  autoFocus
                />
              </label>
              {filtered.length > 0 ? (
                <ul className="open-tab-list">
                  {filtered.map((workspace) => (
                    <li key={workspace.id} className="open-tab-item-row">
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
                      <DeleteIconButton
                        aria-label={t("welcome.removeRepo", { name: workspace.name })}
                        onClick={() => onRemoveWorkspace(workspace)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dialog-lead">{t("openTab.searchEmpty")}</p>
              )}
            </section>
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
