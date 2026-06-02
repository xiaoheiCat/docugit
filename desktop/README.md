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

**Settings → Appearance** switches between **Liquid glass** (default, SVG displacement) and **Frosted glass** (backdrop blur only, lower GPU use on laptops). Stored in `settings.json` as `ui.theme`.

Application icons use the shared source at [`../assets/icon.png`](../assets/icon.png). `electron-builder` generates platform `.icns` / `.ico` from that PNG at pack time.

## Bundled Git

Release installers include a pinned [dugite-native](https://github.com/desktop/dugite-native) Git tree under `resources/bin/git/` (via `extraResources`, manifest in [`scripts/embedded-git.json`](scripts/embedded-git.json)). At runtime, **system Git on `PATH` is preferred**; bundled Git is used only when no system Git is found. Settings → Git source shows which one is active.

Bundled Git is GPLv2; see `resources/bin/git/NOTICE` after staging. Version pin: [`scripts/bundled-git-version.ts`](scripts/bundled-git-version.ts).

## Build installers

From the repository root:

```bash
bun run build
cp dist/docugit desktop/resources/bin/docugit   # macOS/Linux dev pack
# docugit.exe on Windows
cd desktop
bun run stage-git -- --platform darwin --arch arm64   # or win32 / x64 / arm64
bun run pack
```

CI runs `stage-bundled-git.ts` per matrix row before `electron-builder`.

### macOS code signing (auto-update)

Squirrel.Mac requires the running app and the update zip to share a valid code signature. `scripts/after-sign-mac.ts` signs bundled `docugit` and dugite Git under `Contents/Resources/bin`. Without **both** repo secrets `CSC_LINK` (base64 `.p12` or HTTPS URL, not a folder path) and `CSC_KEY_PASSWORD`, CI uses ad-hoc signing (`-`) so auto-update works between releases. Setting only `CSC_LINK` causes electron-builder to mis-read the value as a file path and fail. Add both secrets for notarized distribution.