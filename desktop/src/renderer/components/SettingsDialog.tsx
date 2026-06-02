import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.ts";
import type { RuntimeInfo, UpdateStatus } from "../../shared/types.ts";
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
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (open) {
      void window.docugitDesktop.getRuntimeInfo().then(setRuntime);
      void window.docugitDesktop.getAppVersion().then(setAppVersion);
      void window.docugitDesktop.getSetting("language").then((value) => {
        if (value) setLanguage(value);
      });
      setUpdateMessage(null);
      setCheckingUpdate(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !checkingUpdate) {
      return;
    }
    return window.docugitDesktop.onUpdateStatus((status: UpdateStatus) => {
      if (status.state === "checking") {
        return;
      }
      setCheckingUpdate(false);
      if (status.state === "not-available") {
        setUpdateMessage(t("update.upToDate"));
      } else if (status.state === "dev-skipped") {
        setUpdateMessage(t("update.devSkipped"));
      } else if (status.state === "error") {
        setUpdateMessage(t("update.error", { message: status.message }));
      } else if (status.state === "available") {
        setUpdateMessage(t("update.available", { version: status.version }));
      } else if (status.state === "downloaded") {
        setUpdateMessage(t("update.ready", { version: status.version }));
      }
    });
  }, [open, checkingUpdate, t]);

  if (!open) return null;

  async function changeLanguage(next: string): Promise<void> {
    setLanguage(next);
    await i18n.changeLanguage(next);
    localStorage.setItem("docugit-desktop.lang", next);
    await window.docugitDesktop.setSetting("language", next);
  }

  async function handleCheckForUpdates(): Promise<void> {
    setUpdateMessage(null);
    setCheckingUpdate(true);
    await window.docugitDesktop.checkForUpdates();
  }

  const updateStatusText = checkingUpdate
    ? t("update.checking")
    : updateMessage ??
      (appVersion === "0.0.0-dev" ? t("update.devSkipped") : t("update.idle"));

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
            <div className="settings-field">
              <span>{t("settings.appVersion")}</span>
              <p className="settings-value settings-value--mono">{appVersion ?? "…"}</p>
            </div>
            <div className="settings-update-row">
              <span className="settings-update-row__label">{t("settings.updates")}</span>
              <p className="settings-update-row__status">{updateStatusText}</p>
              <GlassButton
                className="settings-update-row__action"
                disabled={checkingUpdate}
                onClick={() => void handleCheckForUpdates()}
              >
                {t("update.check")}
              </GlassButton>
            </div>
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
