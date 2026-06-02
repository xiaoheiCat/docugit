import { useTranslation } from "react-i18next";
import type { SemanticDiffResult } from "../../shared/types.ts";
import { DockIcon } from "../components/DockIcons.tsx";

interface DiffCompareLineProps {
  result: SemanticDiffResult;
  onSelectCommit?: (hash: string) => void;
  onResetCompare?: () => void;
}

export function DiffCompareLine({
  result,
  onSelectCommit,
  onResetCompare,
}: DiffCompareLineProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!result.base) {
    return <p className="diff-compare-line">{result.documentType}</p>;
  }

  const showReset = Boolean(result.head && !result.compareWorktree && onResetCompare);

  const baseLink = onSelectCommit ? (
    <button
      type="button"
      className="diff-ref-link"
      onClick={() => onSelectCommit(result.base!.hash)}
    >
      {result.base.shortHash}
    </button>
  ) : (
    <span className="diff-ref-label">{result.base.shortHash}</span>
  );

  const headNode =
    result.head != null ? (
      onSelectCommit ? (
        <button
          type="button"
          className="diff-ref-link"
          onClick={() => onSelectCommit(result.head!.hash)}
        >
          {result.head.shortHash}
        </button>
      ) : (
        <span className="diff-ref-label">{result.head.shortHash}</span>
      )
    ) : (
      <span className="diff-ref-label diff-ref-label--muted">{t("diff.worktree")}</span>
    );

  return (
    <div className="diff-compare-row">
      <p className="diff-compare-line">
        {baseLink}
        <span className="diff-ref-separator">{t("diff.compareSeparator")}</span>
        {headNode}
      </p>
      {showReset ? (
        <button
          type="button"
          className="diff-reset-compare-btn"
          title={t("diff.resetCompare")}
          aria-label={t("diff.resetCompare")}
          onClick={onResetCompare}
        >
          <DockIcon name="restore" />
        </button>
      ) : null}
    </div>
  );
}
