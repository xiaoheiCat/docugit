import { readConfig } from "../../config/docugit-yml.ts";
import { summarizeChanges } from "../../diff/engine.ts";
import { formatHtmlDiff } from "../../diff/html.ts";
import type { MergeResultJson } from "../../diff/json-schemas.ts";
import { conflictsToSemanticChanges, threeWayMerge } from "../../merge/three-way.ts";
import { gitOutput, passthroughToGit, runGit } from "../../utils/git.ts";
import { requireDocuGitRepoRoot, prepareCommitMetadata } from "../../utils/repo.ts";
import { writeAndOpenHtml } from "../../utils/temp.ts";

export async function runCommit(message: string[]): Promise<number> {
  const repoRoot = await requireDocuGitRepoRoot();
  try {
    const config = await readConfig(repoRoot);

    const { applyOpenSessionIfPresent } = await import("../../utils/open-session.ts");
    const applied = await applyOpenSessionIfPresent(repoRoot);
    if (applied != null) {
      console.log(`Applied open session: ${applied}`);
    }

    const { computeSemanticDiff } = await import("../../diff/engine.ts");
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    let summary = "";
    try {
      const headDir = await mkdtemp(join(tmpdir(), "docugit-commit-"));
      try {
        const { listOoxmlParts, writePart } = await import("../../ooxml/pack.ts");
        const parts = await listOoxmlParts(repoRoot);
        for (const part of parts) {
          try {
            const content = gitOutput(["show", `HEAD:${part}`], repoRoot);
            await writePart(headDir, part, content);
          } catch {
            /* new part */
          }
        }
        const diff = await computeSemanticDiff(headDir, repoRoot, config.document.type);
        summary = summarizeChanges(diff);
      } finally {
        await rm(headDir, { recursive: true, force: true });
      }
    } catch {
      summary = "initial commit";
    }

    const msg = message.length > 0 ? message.join(" ") : `docugit: ${summary || "update"}`;

    await prepareCommitMetadata(repoRoot);
    runGit(["add", "-A"], repoRoot);
    return runGit(["commit", "-m", msg], repoRoot);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}

export async function runMerge(branch: string, html?: boolean, json?: boolean): Promise<number> {
  const repoRoot = await requireDocuGitRepoRoot();
  try {
    const config = await readConfig(repoRoot);
    const base = gitOutput(["merge-base", "HEAD", branch], repoRoot);
    const result = await threeWayMerge(repoRoot, base, "HEAD", branch, config.document.type);

    if (result.success) {
      await prepareCommitMetadata(repoRoot);
      runGit(["add", "-A"], repoRoot);
      const code = runGit(["commit", "-m", `docugit: merge ${branch} (${result.summary})`], repoRoot);
      if (json) {
        const payload: MergeResultJson = { success: true, summary: result.summary };
        console.log(JSON.stringify(payload, null, 2));
      } else {
        console.log(`Merge succeeded: ${result.summary}`);
      }
      return code;
    }

    const semantic = conflictsToSemanticChanges(result.conflicts, config.document.type);
    if (json) {
      const payload: MergeResultJson = { success: false, conflicts: semantic };
      console.log(JSON.stringify(payload, null, 2));
      return 1;
    }

    console.error(`Merge has ${result.conflicts.length} conflict(s)`);
    if (html) {
      await writeAndOpenHtml(formatHtmlDiff(semantic, "DocuGit Merge Conflicts"));
    }
    return 1;
  } catch (err) {
    return passthroughToGit(["merge", branch]);
  }
}
