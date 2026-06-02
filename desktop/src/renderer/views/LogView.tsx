import { useTranslation } from "react-i18next";
import type { LogEntryJson } from "../../shared/types.ts";

interface LogViewProps {
  entries: LogEntryJson[];
  onSelectCommit?: (hash: string) => void;
}

export function LogView({ entries, onSelectCommit }: LogViewProps): React.JSX.Element {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <p style={{ color: "var(--muted)" }}>{t("log.empty")}</p>;
  }

  return (
    <table className="log-table">
      <thead>
        <tr>
          <th>{t("log.hash")}</th>
          <th>{t("log.author")}</th>
          <th>{t("log.date")}</th>
          <th>{t("log.subject")}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.hash} onClick={() => onSelectCommit?.(entry.hash)}>
            <td>{entry.shortHash}</td>
            <td>{entry.author}</td>
            <td>{new Date(entry.date).toLocaleString()}</td>
            <td>{entry.subject}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
