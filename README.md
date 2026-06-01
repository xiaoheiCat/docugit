# DocuGit

English | [简体中文](README.zh.md)

Git-based version control CLI for Office OpenXML documents.

DocuGit unpacks `.docx`, `.xlsx`, and `.pptx` files into a Git repository and adds **human-readable semantic diff, three-way merge, and Office edit round-tripping** on top of Git.

This project relies heavily on Git. Install [Git](https://git-scm.com) before use.

## Install

### Standalone binary (quickest try)

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

### Homebrew

```bash
brew install ./release/linuxbrew/docugit.rb
```

### APT deb (Linux)

Download the `.deb` for your architecture from the `install/` directory on [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases/latest) (filename like `docugit_<version>_<arch>.deb`), then:

```bash
sudo apt install ./docugit_<version>_<arch>.deb
```

### Windows MSI

Run `docugit-{version}-{arch}.msi`.

### From source

> We use Bun as the runtime.

```bash
git clone https://github.com/xiaoheiCat/docugit.git
cd docugit
bun install
bun run dev -- --help
bun run build   # compile local binary to dist/docugit
```

## Quick start

```bash
# Initialize from an existing Office file
docugit init ./contract.docx -d ./contract-repo

# Create from a blank template
docugit new docx "My Document" -d ./my-doc

# Clone a remote document repository
docugit clone https://github.com/org/doc-repo.git

# Open and edit in Office
docugit open

# Semantic diff
docugit diff
docugit diff --html    # browser report (temp dir + auto open)
docugit diff --json    # structured JSON output

# Export to an Office file
docugit export ./output.docx

# Commit (auto semantic summary)
docugit commit

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
| `docugit init <file>` | Initialize a repo from an Office file |
| `docugit new <type> <name>` | Create a blank docx/xlsx/pptx repo |
| `docugit clone <url>` | Clone a remote repository |
| `docugit open` | Open in Office and watch for saves |
| `docugit export [path]` | Export an Office file |
| `docugit diff [--html\|--json]` | Semantic diff |
| `docugit status` | Status + semantic summary |
| `docugit log` | Commit history |
| `docugit commit [-m msg]` | Commit + semantic summary |
| `docugit merge <branch> [--html]` | Three-way merge |
| `docugit <any-git-cmd>` | Any other Git command (requires Git installed) |

## For AI agents

See [`skills/docugit/SKILL.md`](skills/docugit/SKILL.md) for DocuGit agent usage.

For long-term use, install the skill into your agent environment:

```bash
npx skills add xiaoheiCat/docugit -g -y
```

## License

GPL-3.0
