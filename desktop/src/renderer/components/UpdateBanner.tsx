import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UpdateStatus } from "../../shared/types.ts";
import { GlassButton, GlassPanel } from "./GlassPanel.tsx";

export function UpdateBanner(): React.JSX.Element | null {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });

  useEffect(() => {
    return window.docugitDesktop.onUpdateStatus(setStatus);
  }, []);

  if (
    status.state === "idle" ||
    status.state === "checking" ||
    status.state === "not-available" ||
    status.state === "dev-skipped" ||
    status.state === "error"
  ) {
    return null;
  }

  if (status.state === "available") {
    return (
      <div className="notice-banner notice-banner--info" role="status">
        <GlassPanel className="notice-banner__panel" padding="12px 16px">
          <div className="notice-banner__inner">
            <span className="notice-banner__icon" aria-hidden="true">
              ↓
            </span>
            <p className="notice-banner__text">
              {t("update.available", { version: status.version })}
            </p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (status.state === "downloading") {
    return (
      <div className="notice-banner notice-banner--info" role="status">
        <GlassPanel className="notice-banner__panel" padding="12px 16px">
          <div className="notice-banner__inner">
            <span className="notice-banner__icon" aria-hidden="true">
              ↓
            </span>
            <p className="notice-banner__text">
              {t("update.downloading", { percent: Math.round(status.percent) })}
            </p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="notice-banner notice-banner--success" role="status">
      <GlassPanel className="notice-banner__panel" padding="12px 16px">
        <div className="notice-banner__inner">
          <span className="notice-banner__icon" aria-hidden="true">
            ✓
          </span>
          <p className="notice-banner__text">
            {t("update.ready", { version: status.version })}
          </p>
          <GlassButton className="notice-banner__action no-drag" onClick={() => void window.docugitDesktop.quitAndInstall()}>
            {t("update.restart")}
          </GlassButton>
        </div>
      </GlassPanel>
    </div>
  );
}
