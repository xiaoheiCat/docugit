import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DocumentType, WorkspaceEntry } from "../shared/types.ts";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { ErrorDialog, type ErrorDialogState } from "./components/ErrorDialog.tsx";
import { GlassButton } from "./components/GlassPanel.tsx";
import { OpenTabDialog } from "./components/OpenTabDialog.tsx";
import { NoticeBanner, type NoticeState } from "./components/NoticeBanner.tsx";
import { RepoTabButton, RepoTabContent } from "./components/RepoTab.tsx";
import { SettingsDialog } from "./components/SettingsDialog.tsx";
import { UpdateBanner } from "./components/UpdateBanner.tsx";
import { RepoDialogs, type DialogKind } from "./views/RepoDialogs.tsx";
import { WelcomeView } from "./views/WelcomeView.tsx";
import { formatWorkspaceActionError } from "./utils/format-feedback.ts";

interface AppTab {
  tabId: string;
  workspaceId: string | null;
}

function createTabId(): string {
  return globalThis.crypto.randomUUID();
}

function createWelcomeTab(): AppTab {
  return { tabId: createTabId(), workspaceId: null };
}

let initialTabState: { tabs: AppTab[]; activeTabId: string } | undefined;

function getInitialTabState(): { tabs: AppTab[]; activeTabId: string } {
  if (!initialTabState) {
    const tab = createWelcomeTab();
    initialTabState = { tabs: [tab], activeTabId: tab.tabId };
  }
  return initialTabState;
}

export default function App(): React.JSX.Element {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);
  const [tabs, setTabs] = useState<AppTab[]>(() => getInitialTabState().tabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(
    () => getInitialTabState().activeTabId,
  );
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceEntry | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [openTabDialog, setOpenTabDialog] = useState(false);

  const refreshWorkspaces = useCallback(async () => {
    const list = await window.docugitDesktop.listWorkspaces();
    setWorkspaces(list);
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.workspaceId && !list.some((w) => w.id === tab.workspaceId)) {
          return { ...tab, workspaceId: null };
        }
        return tab;
      }),
    );
  }, []);

  const recordWorkspaceAccess = useCallback(async (id: string) => {
    await window.docugitDesktop.touchWorkspace(id);
    void window.docugitDesktop.setSetting("session.activeWorkspaceId", id);
    setWorkspaces((prev) => {
      const target = prev.find((w) => w.id === id);
      if (!target) {
        return prev;
      }
      const now = new Date().toISOString();
      const updated = { ...target, lastOpenedAt: now };
      const rest = prev.filter((w) => w.id !== id);
      return [updated, ...rest].sort(
        (a, b) =>
          new Date(b.lastOpenedAt ?? b.createdAt).getTime() -
          new Date(a.lastOpenedAt ?? a.createdAt).getTime(),
      );
    });
  }, []);

  const addWelcomeTab = useCallback(() => {
    const tabId = createTabId();
    setTabs((prev) => [...prev, { tabId, workspaceId: null }]);
    setActiveTabId(tabId);
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  useEffect(() => {
    const activeTab = tabs.find((tab) => tab.tabId === activeTabId);
    const flushActiveWorkspace = (): void => {
      if (activeTab?.workspaceId) {
        window.docugitDesktop.flushActiveWorkspace(activeTab.workspaceId);
      }
    };

    window.addEventListener("beforeunload", flushActiveWorkspace);
    return () => window.removeEventListener("beforeunload", flushActiveWorkspace);
  }, [activeTabId, tabs]);

  function attachWorkspace(entry: WorkspaceEntry, targetTabId?: string | null): void {
    void recordWorkspaceAccess(entry.id);
    setTabs((prev) => {
      const resolvedTabId = targetTabId ?? activeTabId;
      const existingTab = prev.find((tab) => tab.workspaceId === entry.id);

      if (existingTab) {
        const targetTab = resolvedTabId
          ? prev.find((tab) => tab.tabId === resolvedTabId)
          : null;
        const closeWelcomeTab =
          targetTab &&
          targetTab.tabId !== existingTab.tabId &&
          targetTab.workspaceId === null;

        queueMicrotask(() => setActiveTabId(existingTab.tabId));

        if (closeWelcomeTab) {
          return prev.filter((tab) => tab.tabId !== targetTab.tabId);
        }
        return prev;
      }

      const welcomeTab = resolvedTabId
        ? prev.find((tab) => tab.tabId === resolvedTabId && tab.workspaceId === null)
        : null;

      if (welcomeTab) {
        queueMicrotask(() => setActiveTabId(welcomeTab.tabId));
        return prev.map((tab) =>
          tab.tabId === welcomeTab.tabId ? { ...tab, workspaceId: entry.id } : tab,
        );
      }

      const newTabId = createTabId();
      queueMicrotask(() => setActiveTabId(newTabId));
      return [...prev, { tabId: newTabId, workspaceId: entry.id }];
    });
  }

  function showActionError(action: "new" | "init" | "clone" | "import", err: unknown): void {
    const raw = err instanceof Error ? err.message : String(err);
    const ipcPrefix = "Error invoking remote method";
    const details = raw.includes(ipcPrefix) ? raw : undefined;
    const payload = raw.includes(": Error: ")
      ? raw.split(": Error: ").slice(1).join(": Error: ")
      : raw;
    setErrorDialog({
      message: formatWorkspaceActionError(action, payload, t),
      details,
    });
  }

  async function handleNew(type: DocumentType, name: string): Promise<void> {
    try {
      const entry = await window.docugitDesktop.createNew({ type, name });
      await refreshWorkspaces();
      attachWorkspace(entry);
      setNotice({ kind: "success", message: t("success.workspaceCreated", { name: entry.name }) });
    } catch (err) {
      showActionError("new", err);
    }
  }

  async function handleInit(sourceFile: string): Promise<void> {
    try {
      const entry = await window.docugitDesktop.createInit({ sourceFile });
      await refreshWorkspaces();
      attachWorkspace(entry);
      setNotice({ kind: "success", message: t("success.workspaceImported", { name: entry.name }) });
    } catch (err) {
      showActionError("init", err);
    }
  }

  async function handleClone(url: string): Promise<void> {
    try {
      const entry = await window.docugitDesktop.cloneRepo({ url });
      await refreshWorkspaces();
      attachWorkspace(entry);
      setNotice({ kind: "success", message: t("success.workspaceCloned", { name: entry.name }) });
    } catch (err) {
      showActionError("clone", err);
    }
  }

  async function handleImport(sourcePath: string): Promise<void> {
    try {
      const entry = await window.docugitDesktop.importRepo({ sourcePath });
      await refreshWorkspaces();
      attachWorkspace(entry);
      setNotice({ kind: "success", message: t("success.workspaceImported", { name: entry.name }) });
    } catch (err) {
      showActionError("import", err);
    }
  }

  async function handleRemoveWorkspace(): Promise<void> {
    if (!removeTarget) {
      return;
    }

    setRemoveBusy(true);
    try {
      await window.docugitDesktop.removeWorkspace(removeTarget.id);
      setTabs((prev) =>
        prev.map((tab) =>
          tab.workspaceId === removeTarget.id ? { ...tab, workspaceId: null } : tab,
        ),
      );
      await refreshWorkspaces();
      setNotice({
        kind: "success",
        message: t("success.workspaceRemoved", { name: removeTarget.name }),
      });
      setRemoveTarget(null);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setErrorDialog({
        message: t("errors.workspace.remove.generic"),
        details: raw,
      });
    } finally {
      setRemoveBusy(false);
    }
  }

  function closeTab(tabId: string): void {
    const closingTab = tabs.find((tab) => tab.tabId === tabId);
    if (closingTab?.workspaceId) {
      void recordWorkspaceAccess(closingTab.workspaceId);
    }
    const remaining = tabs.filter((tab) => tab.tabId !== tabId);
    if (remaining.length === 0) {
      const welcomeTab = createWelcomeTab();
      setTabs([welcomeTab]);
      setActiveTabId(welcomeTab.tabId);
      return;
    }
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1]?.tabId ?? null);
    }
  }

  const activeTab = tabs.find((tab) => tab.tabId === activeTabId) ?? null;
  const activeWorkspace =
    activeTab?.workspaceId != null
      ? (workspaces.find((w) => w.id === activeTab.workspaceId) ?? null)
      : null;

  return (
    <div className="app-background">
      <div className="app-background__glow app-background__glow--one" />
      <div className="app-background__glow app-background__glow--two" />
      <div className="app-background__glow app-background__glow--three" />

      <div className="app-shell">
        <div className="titlebar-drag-region titlebar-drag" aria-hidden="true" />
        <header className="top-nav no-drag">
          <div className="nav-bar-inner">
            <h1>{t("app.title")}</h1>
            <div className="nav-actions">
              <GlassButton onClick={() => setDialog("new")}>{t("nav.new")}</GlassButton>
              <GlassButton onClick={() => setOpenTabDialog(true)}>{t("nav.open")}</GlassButton>
              <GlassButton onClick={() => setDialog("init")}>{t("nav.init")}</GlassButton>
              <GlassButton onClick={() => setDialog("clone")}>{t("nav.clone")}</GlassButton>
              <GlassButton onClick={() => setDialog("import")}>{t("nav.import")}</GlassButton>
              <GlassButton onClick={() => setSettingsOpen(true)}>{t("nav.settings")}</GlassButton>
            </div>
          </div>
        </header>

        <UpdateBanner />
        <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="tab-bar no-drag">
          <div className="tab-bar__tabs">
            {tabs.map((tab) => {
              const workspace =
                tab.workspaceId != null ? workspaces.find((w) => w.id === tab.workspaceId) : null;
              const title = workspace?.name ?? t("tabs.newWelcome");
              return (
                <RepoTabButton
                  key={tab.tabId}
                  title={title}
                  active={activeTabId === tab.tabId}
                  onSelect={() => {
                    if (tab.workspaceId && activeTabId !== tab.tabId) {
                      void recordWorkspaceAccess(tab.workspaceId);
                    }
                    setActiveTabId(tab.tabId);
                  }}
                  onClose={() => closeTab(tab.tabId)}
                />
              );
            })}
          </div>
          <button
            type="button"
            className="tab-bar__new"
            aria-label={t("tabs.new")}
            onClick={addWelcomeTab}
          >
            +
          </button>
        </div>

        <main className="workspace-area">
          {activeWorkspace ? (
            <RepoTabContent workspace={activeWorkspace} active />
          ) : activeTab ? (
            <WelcomeView
              workspaces={workspaces}
              onNew={() => setDialog("new")}
              onOpen={() => setOpenTabDialog(true)}
              onImport={() => setDialog("import")}
              onPickWorkspace={(entry) => attachWorkspace(entry)}
              onRemoveWorkspace={setRemoveTarget}
            />
          ) : null}
        </main>

        <OpenTabDialog
          open={openTabDialog}
          workspaces={workspaces}
          onClose={() => setOpenTabDialog(false)}
          onPick={(entry) => attachWorkspace(entry)}
          onRemoveWorkspace={setRemoveTarget}
        />

        <RepoDialogs
          kind={dialog}
          onClose={() => setDialog(null)}
          onNew={handleNew}
          onInit={handleInit}
          onClone={handleClone}
          onImport={handleImport}
          onMerge={async () => undefined}
          onBranch={async () => undefined}
          onCommit={async () => undefined}
          onRestore={async () => undefined}
        />

        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <ConfirmDialog
          open={removeTarget !== null}
          title={t("dialog.remove.title")}
          message={t("dialog.remove.message", { name: removeTarget?.name ?? "" })}
          confirmLabel={t("dialog.remove.confirm")}
          busy={removeBusy}
          onConfirm={() => void handleRemoveWorkspace()}
          onCancel={() => {
            if (!removeBusy) {
              setRemoveTarget(null);
            }
          }}
        />
        <ErrorDialog state={errorDialog} onClose={() => setErrorDialog(null)} />
      </div>
    </div>
  );
}
