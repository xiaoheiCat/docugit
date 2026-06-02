interface DockIconProps {
  name: string;
  className?: string;
}

/** Minimal 24×24 line icons — stroke only, no fills. */
export function DockIcon({ name, className }: DockIconProps): React.JSX.Element {
  const p = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "open":
      return (
        <svg {...p}>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      );
    case "commit":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <line x1="12" x2="12" y1="3" y2="9" />
          <line x1="12" x2="12" y1="15" y2="21" />
        </svg>
      );
    case "restore":
      return (
        <svg {...p}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "pull":
      return (
        <svg {...p}>
          <path d="M12 17V3" />
          <path d="m6 11 6 6 6-6" />
          <path d="M19 21H5" />
        </svg>
      );
    case "fetch":
      return (
        <svg {...p}>
          <g transform="translate(0 1.5)">
            <path d="M12 13v8" />
            <path d="m8 17 4 4 4-4" />
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 14.25" />
          </g>
        </svg>
      );
    case "merge":
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="2.25" />
          <circle cx="17" cy="7" r="2.25" />
          <circle cx="12" cy="17" r="2.25" />
          <path d="M9.2 8.7 12 14.5" />
          <path d="M14.8 8.7 12 14.5" />
        </svg>
      );
    case "branch":
      return (
        <svg {...p}>
          <line x1="6" x2="6" y1="3" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "export":
      return (
        <svg {...p}>
          <path d="m7 9 5-5 5 5" />
          <path d="M12 9v7" />
          <path d="M5 21h14" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
