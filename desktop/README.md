# DocuGit Desktop

Electron GUI for DocuGit document repositories.

UI uses [`liquid-glass-react`](https://github.com/rdev/liquid-glass-react). macOS and Windows builds both run on **Chromium (Electron)**, so the full Liquid Glass effect is available on both platforms. Partial support only applies to **Safari and Firefox** (displacement not visible) — not relevant to Desktop.

## Development

From the repository root:

```bash
bun run build                 # compile docugit CLI to dist/docugit (optional for dev)
bun run desktop:dev           # start Electron + Vite
```

Dev mode runs the CLI via `bun run src/cli/index.ts` when no bundled binary is present under `desktop/resources/bin/`.

Managed repositories live in `~/.docugit-desktop/workspaces/<uuid>/<repo-name>/`.

## Build installers

```bash
bun run build
cp dist/docugit desktop/resources/bin/docugit   # macOS/Linux
# docugit.exe on Windows
bun run desktop:pack
```

Release CI copies platform `docugit*` binaries into `desktop/resources/bin/` before running `electron-builder`.
