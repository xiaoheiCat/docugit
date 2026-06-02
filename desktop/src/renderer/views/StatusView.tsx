import { useTranslation } from "react-i18next";
import type { StatusJson } from "../../shared/types.ts";
import { describeFileStatus } from "../utils/format-feedback.ts";

interface StatusViewProps {
  status: StatusJson | null;
}

export function StatusView({ status }: StatusViewProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!status) {
    return <p className="empty-state">…</p>;
  }

  return (
    <div className="status-view">
      <section className="status-section">
        <h3 className="status-section__title">{t("status.overview")}</h3>
        <div className="status-grid">
          <div className="stat-card">
            <span>{t("status.branch")}</span>
            <strong>{status.git.branch}</strong>
          </div>
          <div className="stat-card">
            <span>{t("status.upstream")}</span>
            <strong>{status.git.upstream ?? t("status.noUpstream")}</strong>
          </div>
          <div className="stat-card">
            <span>{t("status.ahead")}</span>
            <strong>{status.git.ahead}</strong>
          </div>
          <div className="stat-card">
            <span>{t("status.behind")}</span>
            <strong>{status.git.behind}</strong>
          </div>
        </div>
        <p className="status-summary">
          {status.git.clean ? t("status.clean") : t("status.dirty")}
        </p>
      </section>

      <section className="status-section">
        <h3 className="status-section__title">{t("status.editing")}</h3>
        <p className="status-summary">
          {status.openSession.active ? t("status.openSessionHint") : t("status.noOpenSessionHint")}
        </p>
      </section>

      {status.semantic ? (
        <section className="status-section">
          <h3 className="status-section__title">{t("status.semantic")}</h3>
          <div className="status-grid">
            <div className="stat-card added">
              <strong>{status.semantic.summary.added}</strong>
              {t("diff.added")}
            </div>
            <div className="stat-card removed">
              <strong>{status.semantic.summary.removed}</strong>
              {t("diff.removed")}
            </div>
            <div className="stat-card modified">
              <strong>{status.semantic.summary.modified}</strong>
              {t("diff.modified")}
            </div>
          </div>
        </section>
      ) : null}

      <section className="status-section">
        <h3 className="status-section__title">{t("status.files")}</h3>
        {status.git.files.length === 0 ? (
          <p className="empty-state">{t("status.noFileChanges")}</p>
        ) : (
          <ul className="file-list">
            {status.git.files.map((file) => {
              const kind = describeFileStatus(file.indexStatus, file.worktreeStatus);
              return (
                <li key={file.path} className="file-list__item">
                  <span className={`file-badge file-badge--${kind}`}>{t(`fileStatus.${kind}`)}</span>
                  <span className="file-list__path">{file.path}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
