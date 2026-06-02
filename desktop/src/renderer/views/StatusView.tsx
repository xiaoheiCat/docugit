import { useTranslation } from "react-i18next";
import type { StatusJson } from "../../shared/types.ts";

interface StatusViewProps {
  status: StatusJson | null;
}

export function StatusView({ status }: StatusViewProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!status) {
    return <p style={{ color: "var(--muted)" }}>…</p>;
  }

  return (
    <div>
      <div className="status-grid">
        <div className="stat-card">
          <span>{t("status.branch")}</span>
          <strong>{status.git.branch}</strong>
        </div>
        <div className="stat-card">
          <span>{t("status.upstream")}</span>
          <strong>{status.git.upstream ?? "—"}</strong>
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

      <p>{status.git.clean ? t("status.clean") : t("status.dirty")}</p>
      <p>
        {status.openSession.active ? t("status.openSession") : t("status.noOpenSession")}
        {status.openSession.path ? `: ${status.openSession.path}` : ""}
      </p>

      {status.semantic ? (
        <>
          <h3>{t("status.semantic")}</h3>
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
        </>
      ) : null}

      <h3>{t("status.files")}</h3>
      {status.git.files.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>{t("status.clean")}</p>
      ) : (
        <ul className="file-list">
          {status.git.files.map((file) => (
            <li key={file.path}>
              [{file.indexStatus}
              {file.worktreeStatus}] {file.path}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
