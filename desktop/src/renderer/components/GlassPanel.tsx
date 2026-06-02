import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { useUiTheme } from "../theme/UiThemeContext.tsx";
import { onGlassMouseLeave, onGlassMouseMove } from "./glass-interaction.ts";
import "../styles/LiquidGlass.css";

function useGlassFilterId(prefix: string): string {
  return `${prefix}-${useId().replace(/:/g, "")}`;
}

interface GlassLayersProps {
  filterId: string;
}

function LiquidGlassLayers({ filterId }: GlassLayersProps): React.JSX.Element {
  const filterUrl = `url(#${filterId}) saturate(120%) brightness(1.15)`;

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }} aria-hidden="true">
        <filter id={filterId}>
          <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="77" />
        </filter>
      </svg>
      <div className="glass-filter" style={{ filter: filterUrl }} />
      <div className="glass-distortion-overlay" />
      <div className="glass-overlay" />
      <div className="glass-specular" />
    </>
  );
}

function FrostedGlassLayers(): React.JSX.Element {
  return (
    <>
      <div className="glass-filter glass-filter--frosted" />
      <div className="glass-overlay" />
    </>
  );
}

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padding?: string;
  variant?: "inline" | "fill";
  onClick?: () => void;
}

export function GlassPanel({
  children,
  className = "",
  style,
  padding,
  variant = "inline",
  onClick,
}: GlassPanelProps): React.JSX.Element {
  const { theme } = useUiTheme();
  const filterId = useGlassFilterId("glass-panel");
  const variantClass = variant === "fill" ? "glass-panel--fill" : "glass-panel--inline";
  const contentStyle = padding ? ({ padding } satisfies CSSProperties) : undefined;
  const isLiquid = theme === "liquid";

  return (
    <div
      className={`glass-card ${variantClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      onMouseMove={isLiquid ? (event) => onGlassMouseMove(event, 0.15) : undefined}
      onMouseLeave={isLiquid ? onGlassMouseLeave : undefined}
    >
      {isLiquid ? <LiquidGlassLayers filterId={filterId} /> : <FrostedGlassLayers />}
      <div className="glass-content" style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GlassButton({
  children,
  onClick,
  primary = false,
  disabled = false,
  className = "",
}: GlassButtonProps): React.JSX.Element {
  const { theme } = useUiTheme();
  const filterId = useGlassFilterId("glass-button");
  const [pressed, setPressed] = useState(false);
  const isLiquid = theme === "liquid";

  return (
    <button
      type="button"
      className={`glass-button ${pressed ? "pressed" : ""} ${primary ? "glass-button--primary" : ""} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseMove={isLiquid ? (event) => onGlassMouseMove(event, 0.6) : undefined}
      onMouseLeave={
        isLiquid
          ? (event) => {
              setPressed(false);
              onGlassMouseLeave(event);
            }
          : () => setPressed(false)
      }
    >
      {isLiquid ? <LiquidGlassLayers filterId={filterId} /> : <FrostedGlassLayers />}
      <div className="glass-button-content">{children}</div>
    </button>
  );
}
