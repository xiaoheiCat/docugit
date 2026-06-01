# DocuGit

[English](README.md) | 简体中文

基于 Office OpenXML 的 Git 文档版本控制 CLI。

DocuGit 将 `.docx` / `.xlsx` / `.pptx` 解包为 Git 仓库内容，在 Git 之上提供**人类可读的语义 diff、三路 merge、Office 编辑回写**等能力。

本项目依赖 Git 的大量能力，使用前请先安装 [Git](https://git-scm.com)。

## 安装

### 裸二进制（推荐快速试用）

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

### Homebrew

```bash
brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit
brew install docugit
```

新版本发布后升级：

```bash
brew update
brew upgrade docugit
```

### APT deb（Linux）

从 [GitHub Releases](https://github.com/xiaoheiCat/docugit/releases/latest) 下载 `install/` 目录下对应架构的 `.deb`（文件名形如 `docugit_<version>_<arch>.deb`），然后：

```bash
sudo apt install ./docugit_<version>_<arch>.deb
```

### Windows MSI

双击 `docugit-{version}-{arch}.msi` 安装。

### 从源码

> 我们使用 Bun 作为运行时。

```bash
git clone https://github.com/xiaoheiCat/docugit.git
cd docugit
bun install
bun run dev -- --help
bun run build   # 编译本地二进制到 dist/docugit
```

## 快速开始

```bash
# 从现有 Office 文件初始化
docugit init ./合同.docx -d ./合同-repo

# 从空白模板创建
docugit new docx "我的文档" -d ./my-doc

# 克隆远程文档仓库
docugit clone https://github.com/org/doc-repo.git

# 在 Office 中打开并编辑
docugit open

# 查看语义 diff
docugit diff
docugit diff --html    # 浏览器报告（临时目录 + 自动打开）
docugit diff --json    # JSON 结构化输出

# 导出为 Office 文件
docugit export ./output.docx

# 提交（自动生成语义摘要）
docugit commit

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
| `docugit init <file>` | 从 Office 文件初始化仓库 |
| `docugit new <type> <name>` | 创建空白 docx/xlsx/pptx 仓库 |
| `docugit clone <url>` | 克隆远程仓库 |
| `docugit open` | 在 Office 中打开并监听保存 |
| `docugit export [path]` | 导出 Office 文件 |
| `docugit diff [--html\|--json]` | 语义 diff |
| `docugit status` | 状态 + 语义摘要 |
| `docugit log` | 提交历史 |
| `docugit commit [-m msg]` | 提交 + 语义摘要 |
| `docugit merge <branch> [--html]` | 三路 merge |
| `docugit <any-git-cmd>` | 兼容其他的任意 Git 命令！(需要系统安装有 Git) |

## 如果你不是人类...

使用 DocuGit 的 AI Agent 请参考 [`skills/docugit/SKILL.md`](skills/docugit/SKILL.md)。

若要长期使用，强烈建议安装此 Skill 到 AI Agent 的 Skill 区域: `npx skills add xiaoheiCat/docugit -g -y`

## 许可证

GPL-3.0
