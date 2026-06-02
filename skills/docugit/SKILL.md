---
name: docugit
description: Use DocuGit CLI for Git-based Office OpenXML document version control. Use when working with .docx/.xlsx/.pptx document repos, semantic diff, merge, open/edit/save workflows, or when the user mentions DocuGit.
---

# DocuGit

Office 文档的 Git 版本控制 CLI。一个仓库对应一个解包后的 Office 文档。

## 何时使用

- 管理 Word / Excel / PPT 文档版本
- 仓库含 `.docugit.yml`
- 需要语义 diff、merge，或在 Office 中编辑文档

## 前置条件

- 已安装 `docugit` 与 `git`

## 典型工作流

### 创建

```bash
docugit init ./report.docx -d ./report-repo
docugit new docx "项目计划" -d ./plan-repo
docugit clone https://github.com/org/doc.git
cd report-repo
```

### 编辑

```bash
docugit open
# 在 Office 中编辑并保存
docugit commit
docugit restore
# 丢弃未提交的 open session，下次 open 会从仓库重新打包
```

### 查看变更

```bash
docugit status
docugit diff
docugit diff --html
docugit diff --json
docugit diff --ref HEAD~1
```

### 提交与协作

```bash
docugit commit
docugit commit -m "更新第三章"
docugit merge draft
docugit merge draft --html
docugit push origin main
```

### 导出

```bash
docugit export
docugit export ./final.docx
```

### 从外部文件导入

在已有 DocuGit 仓库中，用外部（非 DocuGit 管理）的 Office 文件替换当前解包内容并提交新版本（保留 `.git` 与仓库元数据）：

```bash
cd my-doc-repo
docugit import ../edited-offline.docx
docugit import ../edited-offline.docx -y
```

### 文档名称

```bash
docugit name
docugit rename "新版计划"
docugit commit -m "rename document"
```

## 命令参考

| 命令 | 参数 |
|------|------|
| `init` | `<file> [-d dir]` |
| `new` | `<docx\|xlsx\|pptx> <name> [-d dir]` |
| `clone` | `<url> [dir]` |
| `open` | |
| `restore` | `[-y]` |
| `import` | `<file> [-y]` |
| `export` | `[output]` (default: `../<document>`) |
| `name` | |
| `rename` | `<name>` |
| `diff` | `[--html] [--json] [--ref ref]` |
| `status` | |
| `log` | `[args...]` |
| `commit` | `[-m message]` |
| `merge` | `<branch> [--html]` |

其他 Git 操作可直接使用 `docugit` 前缀，例如 `docugit pull`、`docugit branch`、`docugit checkout`。

## 约定

- `main` 为定稿分支，功能分支为草稿
- 优先用 `docugit open` 编辑，不要直接改 XML
- 合并冲突时用 `docugit merge <branch> --html`
