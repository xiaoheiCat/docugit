import { useState } from "react";
import { GlassPanel } from "./GlassPanel.tsx";
import { DockIcon } from "./DockIcons.tsx";

export interface DockAction {
  id: string;
  label: string;
  description: string;
  onClick: () => void;
}

interface ActionDockProps {
  actions: DockAction[];
}

export function ActionDock({ actions }: ActionDockProps): React.JSX.Element {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredAction = actions.find((action) => action.id === hoveredId) ?? null;

  return (
    <nav className="action-dock no-drag" aria-label="Repository actions">
      <GlassPanel className="action-dock__panel" padding="10px 14px">
        <div className="action-dock__items">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="action-dock__item"
              title={action.description}
              aria-label={action.label}
              aria-describedby={hoveredId === action.id ? "action-dock-hint" : undefined}
              onClick={action.onClick}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId((current) => (current === action.id ? null : current))}
              onFocus={() => setHoveredId(action.id)}
              onBlur={() => setHoveredId((current) => (current === action.id ? null : current))}
            >
              <span className="action-dock__icon" aria-hidden="true">
                <DockIcon name={action.id} />
              </span>
              <span className="action-dock__label">{action.label}</span>
            </button>
          ))}
        </div>
      </GlassPanel>
      <p
        id="action-dock-hint"
        className={`action-dock__hint${hoveredAction ? " is-visible" : ""}`}
        aria-live="polite"
      >
        {hoveredAction?.description ?? "\u00a0"}
      </p>
    </nav>
  );
}
