import type React from "react";

interface GitProgressBarProps {
  percent: number;
  /** Screen-reader only; no visible caption. */
  ariaLabel?: string;
}

export function GitProgressBar({ percent, ariaLabel }: GitProgressBarProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      className="git-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={ariaLabel}
    >
      <div className="git-progress__track">
        <div className="git-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
