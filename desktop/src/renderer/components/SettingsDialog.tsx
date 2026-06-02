import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.ts";
import type { RuntimeInfo } from "../../shared/types.ts";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [language, setLanguage] = useState(i18n.language);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      <div className="dialog-stack dialog-stack--narrow">
        <GlassPanel className="dialog">
          <h2>{t("settings.title")}</h2>
          <div className="settings-list">
            <label className="settings-field">
              <span>{t("settings.language")}</span>
              <select value={language} onChange={(e) => void changeLanguage(e.target.value)}>
                <option value="en">{t("lang.en")}</option>
                <option value="zh">{t("lang.zh")}</option>
              </select>
            </label>
            {runtime ? (
              <>
                <div className="settings-field">
                  <span>{t("settings.storageLocation")}</span>
                  <p className="settings-value">{runtime.dataRoot}</p>
                </div>
                <div className="settings-field">
                  <span>{t("settings.gitSource")}</span>
                  <p className="settings-value">
                    {runtime.gitSource === "system" ? t("settings.gitSystem") : t("settings.gitBundled")}
                  </p>
                </div>
                <button
                  type="button"
                  className="dialog-details-toggle settings-advanced-toggle"
                  onClick={() => setShowAdvanced((v) => !v)}
                >
                  {showAdvanced ? t("settings.hideAdvanced") : t("settings.showAdvanced")}
                </button>
                {showAdvanced ? (
                  <div className="settings-advanced">
                    <div className="settings-field">
                      <span>{t("settings.docugitPath")}</span>
                      <p className="settings-value settings-value--mono">{runtime.docugitPath}</p>
                    </div>
                    <div className="settings-field">
                      <span>{t("settings.gitPath")}</span>
                      <p className="settings-value settings-value--mono">{runtime.gitPath}</p>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </GlassPanel>
        <div className="dialog-actions">
          <GlassButton onClick={onClose}>{t("settings.close")}</GlassButton>
        </div>
      </div>
    </div>
  );
}
