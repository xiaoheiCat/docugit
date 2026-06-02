# DocuGit

English | [简体中文](README.zh.md)

Git-based version control CLI for Office OpenXML documents.

DocuGit unpacks `.docx`, `.xlsx`, and `.pptx` files into a Git repository and adds **human-readable semantic diff, three-way merge, and Office edit round-tripping** on top of Git.

This project relies heavily on Git. Install [Git](https://git-scm.com) before use.

## Install

### CLI

#### Standalone binary (quickest try)

Download the binary for your platform from [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases) and add it to `PATH`:

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `docugit-darwin-arm64` |
| macOS (Intel) | `docugit-darwin-amd64` |
| Linux amd64 | `docugit-linux-amd64` |
| Linux arm64 | `docugit-linux-arm64` |
| Windows amd64 | `docugit-windows-amd64.exe` |
| Windows arm64 | `docugit-windows-arm64.exe` |

```bash
chmod +x docugit-darwin-arm64
sudo mv docugit-darwin-arm64 /usr/local/bin/docugit
docugit --version
```

#### Homebrew

```bash
brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit
brew install docugit
```

Upgrade after a new release:

```bash
brew update
brew upgrade docugit
```

#### APT deb (Linux)

Download the `.deb` for your architecture from the `install/` directory on [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases/latest) (filename like `docugit_<version>_<arch>.deb`), then:

```bash
sudo apt install ./docugit_<version>_<arch>.deb
```

#### Windows MSI

Run `docugit-{version}-{arch}.msi`.

#### From source

> We use Bun as the runtime.

```bash
git clone https://github.com/xiaoheiCat/docugit.git
cd docugit
bun install
bun run dev -- --help
bun run build   # compile local binary to dist/docugit
```

### DocuGit Desktop

DocuGit GUI client for Windows and macOS.

Download from [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases):

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `docugit-desktop-<version>-arm64.dmg` |
| macOS (Intel) | `docugit-desktop-<version>-x64.dmg` |
| Windows amd64 | `docugit-desktop-<version>-x64.exe` |

## Quick start

```bash
# Initialize from an existing Office file
docugit init ./contract.docx -d ./contract-repo

# Create from a blank template
docugit new docx "My Document" -d ./my-doc

# Clone a remote document repository
docugit clone https://github.com/org/doc-repo.git

# Open in Office for editing
docugit open

# Save in Office, then commit to apply open session + record changes
docugit commit

# Semantic diff
docugit diff
docugit diff --html
docugit export

# Three-way merge
docugit merge feature-branch
docugit merge feature-branch --html   # open HTML report on conflicts

# Other git commands pass through
docugit push
docugit pull
docugit branch
```

## Repository layout

One DocuGit repository = one collaborative document:

```
my-doc/
├── .docugit.yml       # DocuGit config
├── README.md          # auto-generated metadata and notes
├── AGENTS.md          # agent instructions (DocuGit-first)
├── CLAUDE.md          # symlink to AGENTS.md
├── .agents/skills/docugit/
├── [Content_Types].xml
├── _rels/
├── word/              # docx
│   └── document.xml
└── ...
```

## Workflow tips

- `main` branch = finalized document
- Feature branches = drafts
- Use GitHub PR review for approval
- Use `docugit diff --html` to review document changes in PRs

## Commands

| Command | Description |
|---------|-------------|
| `docugit init <file> [-d dir]` | Initialize a repo from an Office file (empty `dir` → repo root; else `<document-base>/`) |
| `docugit new <type> <name>` | Create a blank docx/xlsx/pptx repo |
| `docugit clone <url>` | Clone a remote repository |
| `docugit open` | Open in Office for editing |
| `docugit restore [-y]` | Discard the open session |
| `docugit import <file> [-y] [-m msg]` | Import an external Office file and commit as a new version |
| `docugit export [path]` | Export an Office file (default: `../<document>`) |
| `docugit name` | Show document filename |
| `docugit rename <name>` | Rename document filename |
| `docugit diff [--html\|--json]` | Semantic diff |
| `docugit status [--json]` | Status + semantic summary |
| `docugit log [--json]` | Commit history |
| `docugit commit [-m msg]` | Apply open session, then commit with semantic summary |
| `docugit merge <branch> [--html\|--json]` | Three-way merge |
| `docugit <any-git-cmd>` | Any other Git command (requires Git installed) |

## For AI agents

See [`skills/docugit/SKILL.md`](skills/docugit/SKILL.md) for DocuGit agent usage.

For long-term use, install the skill into your agent environment:

```bash
npx skills add xiaoheiCat/docugit -g -y
```

## License

GPL-3.0
