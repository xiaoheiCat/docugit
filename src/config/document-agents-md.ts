import { symlink, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const DOCUMENT_REPO_AGENTS_MD = `# AGENTS.md

This is a **DocuGit document repository** (an unpacked Office document under version control).

## Rules

- Do **not** use Git directly on this repository. Use **DocuGit** instead (\`docugit open\`, \`docugit diff\`, \`docugit commit\`, \`docugit merge\`, \`docugit export\`, etc.).
- Prefer \`docugit open\` to edit content; do not hand-edit OOXML XML unless you know what you are doing.
- Read [.agents/skills/docugit/SKILL.md](.agents/skills/docugit/SKILL.md) for the full agent workflow.

\`CLAUDE.md\` symlinks here.
`;

export async function setupDocumentAgentDocs(repoRoot: string): Promise<void> {
  const agentsPath = join(repoRoot, "AGENTS.md");
  const claudePath = join(repoRoot, "CLAUDE.md");

  await writeFile(agentsPath, DOCUMENT_REPO_AGENTS_MD, "utf-8");

  try {
    await unlink(claudePath);
  } catch {
    /* absent */
  }

  try {
    await symlink("AGENTS.md", claudePath);
  } catch {
    await writeFile(claudePath, DOCUMENT_REPO_AGENTS_MD, "utf-8");
  }
}
