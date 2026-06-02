import { repairOoxmlPackage, summarizeRepair } from "../../ooxml/repair.ts";
import { requireDocuGitRepoRoot } from "../../utils/repo.ts";

export async function runRepair(): Promise<number> {
  try {
    const repoRoot = await requireDocuGitRepoRoot();
    const result = await repairOoxmlPackage(repoRoot);
    const summary = summarizeRepair(result);
    if (summary === "no repairs needed" && result.warnings.length === 0) {
      console.log("No OOXML repairs needed.");
    } else {
      if (summary !== "no repairs needed") {
        console.log(`Repaired: ${summary}.`);
      }
      if (result.warnings.length > 0) {
        console.warn(`${result.warnings.length} warning(s):`);
        for (const warning of result.warnings) {
          console.warn(`  - ${warning}`);
        }
      }
      if (result.embedded > 0) {
        console.log("Review changes with git diff, then commit if appropriate.");
      }
    }
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 1;
  }
}
