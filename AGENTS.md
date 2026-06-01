# AGENTS.md

Compact guidance for working on **DocuGit** (the CLI/tool repo), not for DocuGit document repositories.

## Collaboration language

When working in this repository with the maintainer, **always reply in 简体中文** (chat, explanations, summaries, PR/commit descriptions unless they ask otherwise). This does not change product-facing text: CLI output and document-repo README stay **English** per conventions below.

## What this repo is

- Bun/TypeScript CLI: Git wrapper for **unpacked OOXML** document repos (one repo = one `.docx` / `.xlsx` / `.pptx`).
- Entrypoint: [`src/cli/index.ts`](src/cli/index.ts)
- Known subcommands are handled in DocuGit; anything else is passed through to `git`.
- End-user agent docs live in [`skills/docugit/SKILL.md`](skills/docugit/SKILL.md). `CLAUDE.md` symlinks here.

## Layout (tool repo)

| Path | Role |
|------|------|
| `src/cli/` | Commander routing, command handlers |
| `src/ooxml/` | ZIP unpack/pack + docx/xlsx/pptx semantic layers |
| `src/diff/`, `src/merge/`, `src/watch/` | Semantic diff/merge, `open` save watcher |
| `src/config/docugit-yml.ts` | `.docugit.yml` + generated document-repo README |
| `src/utils/skill.ts` | `init` Skill install (`npx skills add …`) + `.agents/skills/docugit` fallback |
| `templates/{docx,xlsx,pptx}/` | Unpacked blank templates used by `docugit new` |
| `scripts/sync-templates.ts` | Rebuild templates from local `Template.{docx,xlsx,pptx}` + desanitize |
| `.github/workflows/release.yml` | `main` push → multi-platform Bun compile + Release |

## Dev commands

```bash
bun install
bun run dev -- --help          # run CLI from source
bun run typecheck              # only automated check; no test/lint scripts today
bun run build                  # dist/docugit via bun build --compile
bun run sync-templates         # refresh templates/ from local Template.* files
```

Before finishing code changes: run `bun run typecheck`.

There is no test suite in this repo yet; do not assume `bun test` exists.

## New features: required doc updates

Adding or changing a user-facing command, flag, or workflow is **not done** until docs are updated in both places:

1. **[`skills/docugit/SKILL.md`](skills/docugit/SKILL.md)** — English-oriented agent doc: when to use it, workflow examples, flags, and the command reference table (`## 命令参考` + relevant workflow sections).
2. **[`README.md`](README.md)** — Chinese user doc: **快速开始** examples if the happy path changes, and the **命令一览** table (one row per command/flag users need to discover).

Also register new subcommands/flags in [`src/cli/index.ts`](src/cli/index.ts) (Commander `.command()` / `.option()`). Do not ship CLI-only features with stale SKILL or README.

## Runtime / code conventions

- **Use Bun**, not Node (`bun run`, `bunx`, not `npm`/`npx` unless mirroring DocuGit’s own `npx skills add` behavior).
- ESM imports use **`.ts` extensions** (see existing files).
- User-visible CLI output is **English** (errors, warnings, diff text, generated document-repo README).
- **CLI messages follow Git’s tone and format** — terse, imperative, no product marketing. Match git’s prefixes and casing:
  - Errors: `fatal: …` (non-recoverable / exit) or `error: …`
  - Non-fatal issues: `warning: …` (lowercase prefix, like git)
  - Optional guidance: `hint: …` (indented continuation lines when needed)
  - Success paths are often **silent**; when a line is needed, mirror git init-style facts, e.g. `Initialized DocuGit repository in <path>` not celebratory prose
  - Avoid banners (`IMPORTANT:`), exclamation marks, and “DocuGit is …” narration unless the user explicitly asks
  - When wrapping git failures, keep git’s own stderr; do not replace with friendly rewrites
- Project README is Chinese; extend **快速开始** / **命令一览** when adding commands (see **New features** above). Do not rewrite unrelated README sections.
- Version at runtime: `src/version.ts` (`dev` locally; CI injects via `--define process.env.DOCUGIT_VERSION=…`).

## Behavior agents often get wrong

### CLI routing

- `clone`, `push`, `pull`, `checkout`, etc. → **git passthrough**, not custom handlers.
- `commit` supports `-m` / `--message` via Commander options (do not parse `argv` manually).

### `docugit commit`

- Updates `.docugit.yml` + document README via `prepareCommitMetadata()` **before** `git commit`.
- Must stay **one commit** (metadata + document changes together). Do not add a second `update metadata` commit.

### `docugit open`

- Packs repo → temp file → opens Office/LibreOffice.
- Watches saves and applies back to the **unpacked repo**, not the temp binary only.
- Session ends when the Office file is closed (file-lock polling), not on Ctrl+C messaging.
- Status lines should read like git (short factual lines / `hint:`), not multi-line “keep this terminal open” warnings unless explicitly requested.

### `docugit init`

- Tries `npx skills add <path-to>/skills/docugit -y` (silent on success).
- On failure: warn + copy skill to `.agents/skills/docugit` in the **document repo** (fallback success/failure is silent).

### Document repo vs tool repo

A **document repository** checked out by users looks like:

```
.docugit.yml
README.md
[Content_Types].xml
word/ | xl/ | ppt/
```

Do not move OOXML parts into a subdirectory. Reserved root files: `.docugit.yml`, `README.md`, `.gitignore`.

### Templates

- `docugit new` copies from `templates/{type}/`.
- Regenerating templates: `bun run sync-templates` reads **hardcoded local paths** in `scripts/sync-templates.ts` (`Template.docx` etc.) and strips personal metadata. Update those paths if the maintainer’s Template files move.

## Release / versioning

- Push to **`main`** triggers Release (not tags).
- Version format: `vYYYY.MM.DD_HH.mm.ss_<6-char-sha>` (also baked into binaries).
- Do not hardcode example version strings in docs; use placeholders like `docugit_<version>_<arch>.deb`.

## What not to do

- Do not revert user-chosen layout (`skills/docugit/`, flat OOXML document repos, English CLI strings).
- Do not merge CLI features without updating `skills/docugit/SKILL.md` and `README.md` **命令一览**.
- Do not reimplement `docugit clone`; keep git passthrough.
- Do not add heavy abstractions for one-off CLI helpers.
- Do not edit Cursor plan files unless the user asks.

## Related docs

- Human docs: [`README.md`](README.md) (Chinese)
- Agent usage of the **product**: [`skills/docugit/SKILL.md`](skills/docugit/SKILL.md)
- License: GPL-3.0
