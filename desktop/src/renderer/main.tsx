import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/global.css";
import "./i18n/index.ts";

const platform =
  window.docugitDesktop?.platform ??
  (navigator.platform.toLowerCase().includes("mac") ? "darwin" : "");
if (platform) {
  document.documentElement.dataset.platform = platform;
}

const root = document.getElementById("root");
if (!window.docugitDesktop) {
  root!.innerHTML =
    '<p style="margin:16px;color:#fecaca;font:14px/1.5 system-ui">fatal: desktop API unavailable (preload not loaded). Start with <code>bun run dev</code> in <code>desktop/</code>.</p>';
} else {
  createRoot(root!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
