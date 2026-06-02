import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import i18n from "../i18n/index.ts";
import type { RuntimeInfo, UpdateStatus } from "../../shared/types.ts";
import { useUiTheme } from "../theme/UiThemeContext.tsx";
import type { UiTheme } from "../theme/ui-theme.ts";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

function formatUpdateStatus(status: UpdateStatus, t: TFunction): string | null {
  switch (status.state) {
    case "not-available":
      return t("update.upToDate");
    case "dev-skipped":
      return t("update.devSkipped");
    case "error":
      return t("update.error", { message: status.message });
    case "available":
      return t("update.available", { version: status.version });
    case "downloading":
      return t("update.downloading", { percent: Math.round(status.percent) });
    case "downloaded":
      return t("update.ready", { version: status.version });
    default:
      return null;
  }
}

function isUpdateBusy(status: UpdateStatus): boolean {
  return (
    status.state === "checking" ||
    status.state === "available" ||
    status.state === "downloading"
  );
}

function isManualCheckBlocked(status: UpdateStatus): boolean {
  return isUpdateBusy(status) || status.state === "downloaded";
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { theme, setTheme } = useUiTheme();
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [language, setLanguage] = useState(i18n.language);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [manualCheckBlocked, setManualCheckBlocked] = useState(false);

  useEffect(() => {
    if (open) {
      void window.docugitDesktop.getRuntimeInfo().then(setRuntime);
      void window.docugitDesktop.getAppVersion().then(setAppVersion);
      void window.docugitDesktop.getSetting("language").then((value) => {
        if (value) setLanguage(value);
      });
      void window.docugitDesktop.checkForUpdates().then((started) => {
        if (started) {
          setUpdateMessage(null);
          setUpdateBusy(true);
          setManualCheckBlocked(true);
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    return window.docugitDesktop.onUpdateStatus((status: UpdateStatus) => {
      setUpdateMessage(formatUpdateStatus(status, t));
      setUpdateBusy(isUpdateBusy(status));
      setManualCheckBlocked(isManualCheckBlocked(status));
    });
  }, [open, t]);

  if (!open) return null;

  async function changeLanguage(next: string): Promise<void> {
    setLanguage(next);
    await i18n.changeLanguage(next);
    localStorage.setItem("docugit-desktop.lang", next);
    await window.docugitDesktop.setSetting("language", next);
  }

  async function changeTheme(next: UiTheme): Promise<void> {
    await setTheme(next);
  }

  async function handleCheckForUpdates(): Promise<void> {
    const started = await window.docugitDesktop.checkForUpdates();
    if (!started) {
      return;
    }
    setUpdateMessage(null);
    setUpdateBusy(true);
    setManualCheckBlocked(true);
  }

  const updateStatusText = updateBusy
    ? t("update.inProgress")
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
            <label className="settings-field">
              <span>{t("settings.theme")}</span>
              <select value={theme} onChange={(e) => void changeTheme(e.target.value as UiTheme)}>
                <option value="liquid">{t("settings.themeLiquid")}</option>
                <option value="frosted">{t("settings.themeFrosted")}</option>
              </select>
            </label>
            <div className="settings-field">
              <span>{t("settings.appVersion")}</span>
              <p className="settings-value settings-value--mono">{appVersion ?? "…"}</p>
            </div>
            <div className="settings-update-row">
              <span className="settings-update-row__label">{t("settings.updates")}</span>
              <span className="settings-update-row__status">{updateStatusText}</span>
              <GlassButton
                className="settings-update-row__action"
                disabled={manualCheckBlocked}
                onClick={() => void handleCheckForUpdates()}
              >
                {updateBusy ? t("update.inProgress") : t("update.check")}
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
