import type { MouseEvent as ReactMouseEvent } from "react";

const DEFAULT_DISPLACEMENT_SCALE = "77";

export function onGlassMouseMove(
  event: ReactMouseEvent<HTMLElement>,
  specularStrength = 0.15,
): void {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const filter = element.querySelector("filter feDisplacementMap");
  if (filter) {
    const scaleX = (x / rect.width) * 100;
    const scaleY = (y / rect.height) * 100;
    filter.setAttribute("scale", Math.min(scaleX, scaleY).toString());
  }

  const specular = element.querySelector(".glass-specular") as HTMLElement | null;
  if (specular) {
    specular.style.background = `radial-gradient(
      circle at ${x}px ${y}px,
      rgba(255, 255, 255, ${specularStrength}) 0%,
      rgba(255, 255, 255, ${specularStrength * 0.33}) 30%,
      rgba(255, 255, 255, 0) 60%
    )`;
  }
}

export function onGlassMouseLeave(event: ReactMouseEvent<HTMLElement>): void {
  const element = event.currentTarget;

  const filter = element.querySelector("filter feDisplacementMap");
  if (filter) {
    filter.setAttribute("scale", DEFAULT_DISPLACEMENT_SCALE);
  }

  const specular = element.querySelector(".glass-specular") as HTMLElement | null;
  if (specular) {
    specular.style.background = "none";
  }
}
