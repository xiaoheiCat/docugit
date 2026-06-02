import LiquidGlass from "liquid-glass-react";
import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className = "", style }: GlassPanelProps): React.JSX.Element {
  return (
    <LiquidGlass
      className={`glass-panel ${className}`.trim()}
      style={style}
      displacementScale={70}
      blurAmount={0.08}
      saturation={140}
      aberrationIntensity={2}
      elasticity={0.12}
      cornerRadius={16}
    >
      {children}
    </LiquidGlass>
  );
}
