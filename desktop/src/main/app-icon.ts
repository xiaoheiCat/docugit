import { existsSync } from "node:fs";
import { join } from "node:path";
import { app, nativeImage } from "electron";
import type { NativeImage } from "electron";

export function resolveAppIconPath(): string | undefined {
  if (app.isPackaged) {
    const bundled = join(process.resourcesPath, "icon.png");
    if (existsSync(bundled)) {
      return bundled;
    }
  }

  const repoIcon = join(__dirname, "..", "..", "..", "assets", "icon.png");
  if (existsSync(repoIcon)) {
    return repoIcon;
  }

  return undefined;
}

export function resolveAppIcon(): NativeImage | undefined {
  const iconPath = resolveAppIconPath();
  if (!iconPath) {
    return undefined;
  }
  const image = nativeImage.createFromPath(iconPath);
  return image.isEmpty() ? undefined : image;
}
