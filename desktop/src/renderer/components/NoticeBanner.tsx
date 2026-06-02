import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GlassPanel } from "./GlassPanel.tsx";

export interface NoticeState {
  kind: "success" | "info";
  message: string;
}

interface NoticeBannerProps {
  notice: NoticeState | null;
  onDismiss: () => void;
}

export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) {
    return null;
  }

  return (
    <div className={`notice-banner notice-banner--${notice.kind}`} role="status">
      <GlassPanel className="notice-banner__panel" padding="12px 16px">
        <div className="notice-banner__inner">
          <span className="notice-banner__icon" aria-hidden="true">
            {notice.kind === "success" ? "✓" : "ℹ"}
          </span>
          <p className="notice-banner__text">{notice.message}</p>
          <button type="button" className="notice-banner__close no-drag" onClick={onDismiss}>
            {t("notice.dismiss")}
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
