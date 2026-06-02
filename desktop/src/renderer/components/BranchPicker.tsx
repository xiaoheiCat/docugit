import { useTranslation } from "react-i18next";
import { DeleteIconButton } from "./DeleteIconButton.tsx";

interface BranchPickerProps {
  label: string;
  branches: string[];
  currentBranch?: string | null;
  value: string;
  loading?: boolean;
  excludeCurrent?: boolean;
  selectOnly?: boolean;
  deletable?: boolean;
  onChange: (value: string) => void;
  onSwitch?: (name: string) => void;
  onDelete?: (name: string) => void;
}

export function BranchPicker({
  label,
  branches,
  currentBranch,
  value,
  loading = false,
  excludeCurrent = false,
  selectOnly = false,
  deletable = false,
  onChange,
  onSwitch,
  onDelete,
}: BranchPickerProps): React.JSX.Element {
  const { t } = useTranslation();

  const visibleBranches = excludeCurrent
    ? branches.filter((name) => name !== currentBranch)
    : branches;

  return (
    <div className="branch-picker">
      {!selectOnly ? (
        <label>
          {label}
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        </label>
      ) : null}

      {loading ? <p className="branch-picker__hint">{t("dialog.branch.loading")}</p> : null}

      {!loading && visibleBranches.length > 0 ? (
        <div className="branch-picker__list-block">
          <p className="branch-picker__label">{selectOnly ? label : t("dialog.branch.available")}</p>
          <ul className="branch-picker__list">
            {visibleBranches.map((name) => {
              const isCurrent = name === currentBranch;
              const isSelected = name === value;
              return (
                <li key={name} className="branch-picker__row">
                  <button
                    type="button"
                    className={`branch-picker__item${isSelected ? " is-selected" : ""}${isCurrent ? " is-current" : ""}`}
                    onClick={() => {
                      if (isCurrent) {
                        return;
                      }
                      if (onSwitch) {
                        onSwitch(name);
                        return;
                      }
                      onChange(name);
                    }}
                  >
                    <span className="branch-picker__name">{name}</span>
                    {isCurrent ? (
                      <span className="branch-picker__badge">{t("dialog.branch.current")}</span>
                    ) : null}
                  </button>
                  {deletable && !isCurrent ? (
                    <DeleteIconButton
                      className="delete-icon-btn--compact"
                      aria-label={t("dialog.branch.delete", { name })}
                      onClick={() => onDelete?.(name)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {!loading && visibleBranches.length === 0 ? (
        <p className="branch-picker__hint">
          {excludeCurrent ? t("dialog.branch.noMergeTargets") : t("dialog.branch.empty")}
        </p>
      ) : null}
    </div>
  );
}
