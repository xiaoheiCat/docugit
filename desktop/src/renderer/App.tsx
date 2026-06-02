import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DocumentType, WorkspaceEntry } from "../shared/types.ts";
import { GlassPanel } from "./components/GlassPanel.tsx";
import { RepoTabButton, RepoTabContent } from "./components/RepoTab.tsx";
import { SettingsDialog } from "./components/SettingsDialog.tsx";
import { RepoDialogs, type DialogKind } from "./views/RepoDialogs.tsx";

export default function App(): React.JSX.Element {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    const list = await window.docugitDesktop.listWorkspaces();
    setWorkspaces(list);
    setOpenTabs((prev) => prev.filter((id) => list.some((w) => w.id === id)));
    setActiveTab((prev) => (prev && list.some((w) => w.id === prev) ? prev : null));
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  function openWorkspace(entry: WorkspaceEntry): void {
    setOpenTabs((prev) => (prev.includes(entry.id) ? prev : [...prev, entry.id]));
    setActiveTab(entry.id);
  }

  async function handleNew(type: DocumentType, name: string): Promise<void> {
    setError(null);
    try {
      const entry = await window.docugitDesktop.createNew({ type, name });
      await refreshWorkspaces();
      openWorkspace(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleInit(sourceFile: string): Promise<void> {
    setError(null);
    try {
      const entry = await window.docugitDesktop.createInit({ sourceFile });
      await refreshWorkspaces();
      openWorkspace(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleClone(url: string): Promise<void> {
    setError(null);
    try {
      const entry = await window.docugitDesktop.cloneRepo({ url });
      await refreshWorkspaces();
      openWorkspace(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleImport(sourcePath: string): Promise<void> {
    setError(null);
    try {
      const entry = await window.docugitDesktop.importRepo({ sourcePath });
      await refreshWorkspaces();
      openWorkspace(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const activeWorkspace = workspaces.find((w) => w.id === activeTab) ?? null;

  return (
    <div className="app-shell">
      <div className="top-nav titlebar-drag">
        <h1>{t("app.title")}</h1>
        <div className="nav-actions no-drag">
          <button onClick={() => setDialog("new")}>{t("nav.new")}</button>
          <button onClick={() => setDialog("init")}>{t("nav.init")}</button>
          <button onClick={() => setDialog("clone")}>{t("nav.clone")}</button>
          <button onClick={() => setDialog("import")}>{t("nav.import")}</button>
          <button onClick={() => setSettingsOpen(true)}>{t("nav.settings")}</button>
        </div>
      </div>

      {error ? <div className="error-banner no-drag">{error}</div> : null}

      <div className="tab-bar no-drag">
        {openTabs.map((id) => {
          const workspace = workspaces.find((w) => w.id === id);
          if (!workspace) return null;
          return (
            <RepoTabButton
              key={id}
              workspace={workspace}
              active={activeTab === id}
              onSelect={() => setActiveTab(id)}
              onClose={() => {
                setOpenTabs((prev) => prev.filter((tabId) => tabId !== id));
                if (activeTab === id) {
                  const remaining = openTabs.filter((tabId) => tabId !== id);
                  setActiveTab(remaining[remaining.length - 1] ?? null);
                }
              }}
            />
          );
        })}
      </div>

      {activeWorkspace ? (
        <RepoTabContent
          workspace={activeWorkspace}
          active
          onClose={() => undefined}
        />
      ) : (
        <GlassPanel className="welcome">
          <div>
            <h1>{t("welcome.title")}</h1>
            <p>{t("welcome.subtitle")}</p>
          </div>
        </GlassPanel>
      )}

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
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
