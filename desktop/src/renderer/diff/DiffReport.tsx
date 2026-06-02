import { useTranslation } from "react-i18next";
import type { SemanticDiffResult } from "../../shared/types.ts";

interface DiffReportProps {
  result: SemanticDiffResult;
  title?: string;
}

export function DiffReport({ result, title }: DiffReportProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{title ?? t("diff.title")}</h2>
      <p style={{ color: "var(--muted)" }}>{result.documentType}</p>
      <div className="diff-summary">
        <div className="stat-card added">
          <strong>{result.summary.added}</strong>
          {t("diff.added")}
        </div>
        <div className="stat-card removed">
          <strong>{result.summary.removed}</strong>
          {t("diff.removed")}
        </div>
        <div className="stat-card modified">
          <strong>{result.summary.modified}</strong>
          {t("diff.modified")}
        </div>
      </div>
      {result.changes.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>{t("diff.noChanges")}</p>
      ) : (
        result.changes.map((change, index) => (
          <section key={`${change.location}-${index}`} className="change-card">
            <header>
              <span className={`badge ${change.type}`}>{change.type}</span>
              <strong>{change.location}</strong>
              <span style={{ color: "var(--muted)", marginLeft: "auto", fontSize: "0.85rem" }}>
                {change.kind}
              </span>
            </header>
            <div className="change-content">
              {change.before
                ? change.before.split("\n").map((line, lineIndex) => (
                    <div key={`b-${lineIndex}`} className="line removed">
                      - {line}
                    </div>
                  ))
                : null}
              {change.after
                ? change.after.split("\n").map((line, lineIndex) => (
                    <div key={`a-${lineIndex}`} className="line added">
                      + {line}
                    </div>
                  ))
                : null}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
