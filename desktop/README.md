# DocuGit Desktop

Electron GUI for DocuGit document repositories.

UI Liquid Glass follows the CSS + SVG displacement approach from [xiaoheiCat/sol-your-real-pal](https://github.com/xiaoheiCat/sol-your-real-pal) (`LiquidGlass.css`: turbulence filter, backdrop blur, specular hover). macOS and Windows builds run on **Chromium (Electron)**, so the full effect is available on both platforms.

## Development

From the repository root:

```bash
bun run build                 # compile docugit CLI to dist/docugit (optional for dev)
bun run desktop:dev           # start Electron + Vite
```

Dev mode runs the CLI via `bun run -- src/cli/index.ts` when no bundled binary is present under `desktop/resources/bin/` and `dist/docugit` is missing.

If `electron-vite dev` fails with `Error: Electron uninstall`, the Electron binary was not downloaded during install. From `desktop/` run:

```bash
node node_modules/electron/install.js
```

Or reinstall dependencies (`bun install`); `postinstall` runs the same step automatically.

Managed repositories live in `~/.docugit-desktop/workspaces/<uuid>/<repo-name>/`.

Application icons use the shared source at [`../assets/icon.png`](../assets/icon.png). `electron-builder` generates platform `.icns` / `.ico` from that PNG at pack time.

## Build installers

```bash
bun run build
cp dist/docugit desktop/resources/bin/docugit   # macOS/Linux
# docugit.exe on Windows
bun run desktop:pack
```

Release CI copies platform `docugit*` binaries into `desktop/resources/bin/` before running `electron-builder`.
