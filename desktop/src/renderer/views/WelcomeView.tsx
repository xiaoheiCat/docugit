import { useTranslation } from "react-i18next";
import type { WorkspaceEntry } from "../../shared/types.ts";
import { GlassButton, GlassPanel } from "../components/GlassPanel.tsx";
import { DeleteIconButton } from "../components/DeleteIconButton.tsx";
import { formatDocumentTypeLabel } from "../utils/document-type.ts";

interface WelcomeViewProps {
  workspaces: WorkspaceEntry[];
  onNew: () => void;
  onOpen: () => void;
  onImport: () => void;
  onPickWorkspace: (entry: WorkspaceEntry) => void;
  onRemoveWorkspace: (entry: WorkspaceEntry) => void;
}

export function WelcomeView({
  workspaces,
  onNew,
  onOpen,
  onImport,
  onPickWorkspace,
  onRemoveWorkspace,
}: WelcomeViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <GlassPanel variant="fill" className="welcome-panel">
      <div className="welcome">
        <h2>{t("welcome.title")}</h2>
        <p>{t("welcome.subtitle")}</p>
        {workspaces.length > 0 ? (
          <section className="welcome-repos">
            <h3>{t("welcome.reposTitle")}</h3>
            <ul className="welcome-repo-list">
              {workspaces.map((workspace) => (
                <li key={workspace.id} className="welcome-repo-item">
                  <button
                    type="button"
                    className="welcome-repo-card no-drag"
                    onClick={() => onPickWorkspace(workspace)}
                  >
                    <span className="welcome-repo-card__name">{workspace.name}</span>
                    <span className="welcome-repo-card__type">
                      {formatDocumentTypeLabel(workspace.documentType, t)}
                    </span>
                  </button>
                  <DeleteIconButton
                    className="no-drag"
                    aria-label={t("welcome.removeRepo", { name: workspace.name })}
                    onClick={() => onRemoveWorkspace(workspace)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <div className="welcome-actions">
          <GlassButton primary onClick={onNew}>
            {t("welcome.actionNew")}
          </GlassButton>
          <GlassButton onClick={onOpen}>
            {t("welcome.actionOpen")}
          </GlassButton>
          <GlassButton onClick={onImport}>
            {t("welcome.actionImport")}
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  );
}
