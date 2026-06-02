import type { SemanticDiffResult } from "./engine.ts";
import { formatDiffCompareLabel } from "../utils/diff-refs.ts";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatHtmlDiff(result: SemanticDiffResult, title = "DocuGit Diff Report"): string {
  const changeRows = result.changes
    .map((change) => {
      const badgeClass =
        change.type === "added" ? "added" : change.type === "removed" ? "removed" : "modified";
      const beforeHtml =
        change.before &&
        change.before
          .split("\n")
          .map((l) => `<div class="line removed">- ${escapeHtml(l)}</div>`)
          .join("");
      const afterHtml =
        change.after &&
        change.after
          .split("\n")
          .map((l) => `<div class="line added">+ ${escapeHtml(l)}</div>`)
          .join("");

      return `
        <section class="change ${badgeClass}">
          <header>
            <span class="badge ${badgeClass}">${change.type}</span>
            <strong>${escapeHtml(change.location)}</strong>
            <span class="kind">${change.kind}</span>
          </header>
          <div class="content">${beforeHtml}${afterHtml}</div>
        </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #0f172a;
      --panel: #111827;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --added: #22c55e;
      --removed: #ef4444;
      --modified: #eab308;
      --border: #334155;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      background: linear-gradient(180deg, #0b1220, var(--bg));
      color: var(--text);
      line-height: 1.5;
    }
    .container { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }
    h1 { margin: 0 0 8px; font-size: 1.75rem; }
    .summary {
      display: flex; gap: 12px; flex-wrap: wrap; margin: 20px 0 28px;
    }
    .stat {
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 12px; padding: 12px 16px; min-width: 120px;
    }
    .stat strong { display: block; font-size: 1.4rem; }
    .added strong { color: var(--added); }
    .removed strong { color: var(--removed); }
    .modified strong { color: var(--modified); }
    .change {
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid var(--border);
      border-radius: 14px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .change header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-bottom: 1px solid var(--border);
    }
    .badge {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 2px 8px; border-radius: 999px; border: 1px solid currentColor;
    }
    .badge.added { color: var(--added); }
    .badge.removed { color: var(--removed); }
    .badge.modified { color: var(--modified); }
    .kind { color: var(--muted); margin-left: auto; font-size: 0.85rem; }
    .content { padding: 12px 16px 16px; font-family: ui-monospace, SFMono-Regular, monospace; }
    .line { padding: 2px 0; white-space: pre-wrap; word-break: break-word; }
    .line.added { color: var(--added); }
    .line.removed { color: var(--removed); }
    .empty { color: var(--muted); padding: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <p style="color: var(--muted); margin: 0;">${escapeHtml(formatDiffCompareLabel(result))}</p>
    <div class="summary">
      <div class="stat added"><strong>${result.summary.added}</strong> added</div>
      <div class="stat removed"><strong>${result.summary.removed}</strong> removed</div>
      <div class="stat modified"><strong>${result.summary.modified}</strong> modified</div>
    </div>
    ${result.changes.length ? changeRows : '<div class="empty">No semantic changes</div>'}
  </div>
</body>
</html>`;
}
