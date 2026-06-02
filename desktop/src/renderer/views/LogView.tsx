import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { LogEntryJson } from "../../shared/types.ts";
import { GlassButton } from "../components/GlassPanel.tsx";
import { isActiveRef, refDisplayName } from "../utils/log-refs.ts";

interface LogViewProps {
  entries: LogEntryJson[];
  headHash?: string;
  currentBranch?: string;
  highlightHash?: string | null;
  onSelectCommit?: (hash: string) => void;
  onRevert?: (entry: LogEntryJson) => void;
}

export function LogView({
  entries,
  headHash = "",
  currentBranch = "",
  highlightHash = null,
  onSelectCommit,
  onRevert,
}: LogViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!highlightHash) {
      return;
    }
    highlightRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightHash, entries]);

  if (entries.length === 0) {
    return <p className="empty-state">{t("log.empty")}</p>;
  }

  return (
    <div className="log-view">
      <table className="log-table">
        <thead>
          <tr>
            <th>{t("log.hash")}</th>
            <th>{t("log.author")}</th>
            <th>{t("log.date")}</th>
            <th>{t("log.subject")}</th>
            <th>{t("log.branches")}</th>
            <th className="log-table__actions-head">{t("log.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrent = Boolean(headHash && entry.hash === headHash);
            const isHighlighted = Boolean(highlightHash && entry.hash === highlightHash);
            return (
              <tr
                key={entry.hash}
                ref={isHighlighted ? highlightRowRef : undefined}
                data-commit-hash={entry.hash}
                className={[
                  "log-table__row",
                  isCurrent ? "is-current" : "",
                  isHighlighted ? "is-highlighted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectCommit?.(entry.hash)}
              >
                <td className="log-table__hash">{entry.shortHash}</td>
                <td>{entry.author}</td>
                <td className="log-table__date">{new Date(entry.date).toLocaleString()}</td>
                <td className="log-table__subject">{entry.subject}</td>
                <td className="log-table__refs">
                  {entry.refs?.length ? (
                    <div className="log-ref-list">
                      {entry.refs.map((ref) => {
                        const active = isActiveRef(ref, currentBranch, entry.hash, headHash);
                        return (
                          <span
                            key={`${entry.hash}-${ref}`}
                            className={`log-ref-badge${active ? " is-active" : ""}`}
                          >
                            {refDisplayName(ref)}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="log-ref-empty">—</span>
                  )}
                </td>
                <td className="log-table__actions">
                  {isCurrent ? (
                    <span className="log-current-label">{t("log.current")}</span>
                  ) : (
                    <div
                      className="log-table__actions-inner"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <GlassButton
                        className="log-revert-btn"
                        onClick={() => onRevert?.(entry)}
                      >
                        {t("log.revert")}
                      </GlassButton>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
