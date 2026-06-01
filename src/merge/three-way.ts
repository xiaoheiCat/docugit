import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DocumentType } from "../config/docugit-yml.ts";
import { computeSemanticDiff, summarizeChanges } from "../diff/engine.ts";
import { listOoxmlParts, writePart } from "../ooxml/pack.ts";
import { gitOutput } from "../utils/git.ts";

export interface MergeConflict {
  part: string;
  base: string;
  ours: string;
  theirs: string;
}

export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  appliedParts: string[];
  summary: string;
}

async function snapshotRef(repoRoot: string, ref: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const parts = await listOoxmlParts(repoRoot);
  for (const part of parts) {
    try {
      map.set(part, gitOutput(["show", `${ref}:${part}`], repoRoot));
    } catch {
      /* part missing in ref */
    }
  }
  return map;
}

function mergeTextParts(
  base: Map<string, string>,
  ours: Map<string, string>,
  theirs: Map<string, string>,
): { merged: Map<string, string>; conflicts: MergeConflict[] } {
  const merged = new Map<string, string>();
  const conflicts: MergeConflict[] = [];
  const allParts = new Set([...base.keys(), ...ours.keys(), ...theirs.keys()]);

  for (const part of allParts) {
    const b = base.get(part) ?? "";
    const o = ours.get(part) ?? b;
    const t = theirs.get(part) ?? b;

    if (o === t) {
      merged.set(part, o);
    } else if (o === b) {
      merged.set(part, t);
    } else if (t === b) {
      merged.set(part, o);
    } else {
      conflicts.push({ part, base: b, ours: o, theirs: t });
    }
  }

  return { merged, conflicts };
}

export async function threeWayMerge(
  repoRoot: string,
  baseRef: string,
  oursRef: string,
  theirsRef: string,
  documentType: DocumentType,
): Promise<MergeResult> {
  const base = await snapshotRef(repoRoot, baseRef);
  const ours = await snapshotRef(repoRoot, oursRef);
  const theirs = await snapshotRef(repoRoot, theirsRef);

  const { merged, conflicts } = mergeTextParts(base, ours, theirs);
  const appliedParts: string[] = [];

  for (const [part, content] of merged) {
    if (!conflicts.some((c) => c.part === part)) {
      await writePart(repoRoot, part, content);
      appliedParts.push(part);
    }
  }

  if (conflicts.length === 0) {
    const tempDir = await mkdtemp(join(tmpdir(), "docugit-merge-preview-"));
    try {
      for (const [part, content] of merged) {
        const fullPath = join(tempDir, part);
        await mkdir(join(fullPath, ".."), { recursive: true });
        await writeFile(fullPath, content, "utf-8");
      }
      const preview = await computeSemanticDiff(
        await snapshotDir(base),
        tempDir,
        documentType,
      );
      return {
        success: true,
        conflicts: [],
        appliedParts,
        summary: summarizeChanges(preview),
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  return {
    success: false,
    conflicts,
    appliedParts,
    summary: `${conflicts.length} part(s) in conflict`,
  };
}

async function snapshotDir(parts: Map<string, string>): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "docugit-snap-"));
  for (const [part, content] of parts) {
    const fullPath = join(tempDir, part);
    await mkdir(join(fullPath, ".."), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  }
  return tempDir;
}

export function conflictsToSemanticChanges(
  conflicts: MergeConflict[],
  documentType: DocumentType,
): import("../diff/engine.ts").SemanticDiffResult {
  return {
    documentType,
    changes: conflicts.map((c) => ({
      kind: "paragraph" as const,
      location: c.part,
      before: c.ours,
      after: c.theirs,
      type: "modified" as const,
    })),
    summary: {
      added: 0,
      removed: 0,
      modified: conflicts.length,
    },
  };
}

export async function applyPackedChanges(
  repoRoot: string,
  packedFile: string,
): Promise<string> {
  const { unpackFromFile } = await import("../ooxml/pack.ts");
  const { readConfig } = await import("../config/docugit-yml.ts");
  const tempDir = await mkdtemp(join(tmpdir(), "docugit-apply-"));
  try {
    await unpackFromFile(packedFile, tempDir);
    const config = await readConfig(repoRoot);
    const diff = await computeSemanticDiff(repoRoot, tempDir, config.document.type);
    const parts = await listOoxmlParts(tempDir);
    for (const part of parts) {
      const content = await readFile(join(tempDir, part), "utf-8");
      await writePart(repoRoot, part, content);
    }
    return summarizeChanges(diff);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
