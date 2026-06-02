import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.ts";
import type { RuntimeInfo } from "../../shared/types.ts";
import { GlassPanel } from "./GlassPanel.tsx";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    if (open) {
      void window.docugitDesktop.getRuntimeInfo().then(setRuntime);
      void window.docugitDesktop.getSetting("language").then((value) => {
        if (value) setLanguage(value);
      });
    }
  }, [open]);

  if (!open) return null;

  async function changeLanguage(next: string): Promise<void> {
    setLanguage(next);
    await i18n.changeLanguage(next);
    localStorage.setItem("docugit-desktop.lang", next);
    await window.docugitDesktop.setSetting("language", next);
  }

  return (
    <div className="dialog-backdrop no-drag">
      <GlassPanel className="dialog">
        <h2>{t("settings.title")}</h2>
        <div className="settings-list">
          <div>
            <span>{t("settings.language")}</span>
            <select value={language} onChange={(e) => void changeLanguage(e.target.value)}>
              <option value="en">{t("lang.en")}</option>
              <option value="zh">{t("lang.zh")}</option>
            </select>
          </div>
          {runtime ? (
            <>
              <div>
                <span>{t("settings.docugitPath")}</span>
                <code>{runtime.docugitPath}</code>
              </div>
              <div>
                <span>{t("settings.gitPath")}</span>
                <code>
                  {runtime.gitPath} ({runtime.gitSource})
                </code>
              </div>
              <div>
                <span>{t("settings.dataRoot")}</span>
                <code>{runtime.dataRoot}</code>
              </div>
            </>
          ) : null}
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>{t("settings.close")}</button>
        </div>
      </GlassPanel>
    </div>
  );
}
