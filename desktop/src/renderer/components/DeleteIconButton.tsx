import { TrashIcon } from "./TrashIcon.tsx";

interface DeleteIconButtonProps {
  className?: string;
  "aria-label": string;
  disabled?: boolean;
  onClick: () => void;
}

export function DeleteIconButton({
  className = "",
  "aria-label": ariaLabel,
  disabled = false,
  onClick,
}: DeleteIconButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={`delete-icon-btn ${className}`.trim()}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <TrashIcon className="delete-icon-btn__icon" />
    </button>
  );
}
