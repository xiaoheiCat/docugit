# DocuGit

[English](README.md) | 简体中文

![Docugit](assets/banner.png)

基于 Office OpenXML 的 Git 文档版本控制 CLI。

DocuGit 将 `.docx` / `.xlsx` / `.pptx` 解包为 Git 仓库内容，在 Git 之上提供**人类可读的语义 diff、三路 merge、Office 编辑回写**等能力。

本项目依赖 Git 的大量能力，使用前请先安装 [Git](https://git-scm.com)。

## 安装

### CLI

#### 裸二进制（推荐快速试用）

从 [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases) 下载对应平台二进制，加入 `PATH`：

| 平台 | 文件 |
|------|------|
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

新版本发布后升级：

```bash
brew update
brew upgrade docugit
```

#### APT deb（Linux）

从 [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases/latest) 下载 `install/` 目录下对应架构的 `.deb`（文件名形如 `docugit_<version>_<arch>.deb`），然后：

```bash
sudo apt install ./docugit_<version>_<arch>.deb
```

#### Windows MSI

双击 `docugit-{version}-{arch}.msi` 安装。

#### 从源码

> 我们使用 Bun 作为运行时。

```bash
git clone https://github.com/xiaoheiCat/docugit.git
cd docugit
bun install
bun run dev -- --help
bun run build   # 编译本地二进制到 dist/docugit
```
### DocuGit Desktop

为 Windows 与 macOS 开发的 DocuGit 的图形客户端。

从 [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases) 下载：

| 平台 | 文件 |
|------|------|
| macOS (Apple Silicon) | `docugit-desktop-<version>-arm64.dmg` |
| macOS (Intel) | `docugit-desktop-<version>-x64.dmg` |
| Windows amd64 | `docugit-desktop-<version>-x64.exe` |

## 快速开始

```bash
# 从现有 Office 文件初始化
docugit init ./合同.docx -d ./合同-repo

# 从空白模板创建
docugit new docx "我的文档" -d ./my-doc

# 克隆远程文档仓库
docugit clone https://github.com/org/doc-repo.git

# 在 Office 中编辑
docugit open

# 在 Office 中保存后，提交以应用 open session 并记录变更
docugit commit

# 语义 diff 与导出
docugit diff
docugit diff --html
docugit export

# 合并分支（三路 merge）
docugit merge feature-branch
docugit merge feature-branch --html   # 冲突时打开 HTML 报告

# 其他 git 命令透传
docugit push
docugit pull
docugit branch
```

## 仓库结构

一个 DocuGit 仓库 = 一个协作文档：

```
my-doc/
├── .docugit.yml       # DocuGit 配置
├── README.md          # 自动生成的说明与 Metadata
├── AGENTS.md          # Agent 说明（优先使用 DocuGit）
├── CLAUDE.md          # 指向 AGENTS.md 的软链接
├── .agents/skills/docugit/
├── [Content_Types].xml
├── _rels/
├── word/              # docx
│   └── document.xml
└── ...
```

## 工作流建议

- `main` 分支 = 定稿
- 功能分支 = 草稿
- 通过 GitHub PR Review 完成审批
- 使用 `docugit diff --html` 在 PR 中审查文档变更

## 命令一览

| 命令 | 说明 |
|------|------|
| `docugit init <file> [-d dir]` | 从 Office 文件初始化仓库（`dir` 为空则直接初始化，否则创建 `<文档基名>/` 子目录） |
| `docugit new <type> <name>` | 创建空白 docx/xlsx/pptx 仓库 |
| `docugit clone <url>` | 克隆远程仓库 |
| `docugit open` | 在 Office 中打开编辑 |
| `docugit restore [-y]` | 丢弃 open session |
| `docugit import <file> [-y] [-m msg]` | 从外部 Office 文件导入并提交为新版本 |
| `docugit export [path]` | 导出 Office 文件（默认 `../<文档名>`） |
| `docugit name` | 查看文档文件名 |
| `docugit rename <name>` | 修改文档文件名 |
| `docugit diff [--html\|--json]` | 语义 diff |
| `docugit status [--json]` | 状态 + 语义摘要 |
| `docugit log [--json]` | 提交历史 |
| `docugit commit [-m msg]` | 应用 open session 后提交并生成语义摘要 |
| `docugit merge <branch> [--html\|--json]` | 三路 merge |
| `docugit <any-git-cmd>` | 兼容其他的任意 Git 命令！(需要系统安装有 Git) |

## 如果你不是人类...

使用 DocuGit 的 AI Agent 请参考 [`skills/docugit/SKILL.md`](skills/docugit/SKILL.md)。

若要长期使用，强烈建议安装此 Skill 到 AI Agent 的 Skill 区域: `npx skills add xiaoheiCat/docugit -g -y`

## 许可证

GPL-3.0
