import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDataRoot } from "./git-resolver.ts";

const SETTINGS_FILE = "settings.json";

function settingsPath(): string {
  return join(getDataRoot(), SETTINGS_FILE);
}

export async function readSettings(): Promise<Record<string, string>> {
  try {
    await mkdir(getDataRoot(), { recursive: true });
    const raw = await readFile(settingsPath(), "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function readSettingsSync(): Record<string, string> {
  try {
    const raw = readFileSync(settingsPath(), "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function writeSettings(settings: Record<string, string>): Promise<void> {
  await mkdir(getDataRoot(), { recursive: true });
  await writeFile(settingsPath(), JSON.stringify(settings, null, 2), "utf-8");
}

export async function getSetting(key: string): Promise<string | null> {
  const settings = await readSettings();
  return settings[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const settings = await readSettings();
  if (!value.trim()) {
    delete settings[key];
  } else {
    settings[key] = value;
  }
  await writeSettings(settings);
}
