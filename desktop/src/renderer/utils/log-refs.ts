export function refDisplayName(ref: string): string {
  if (ref.includes("->")) {
    return ref.split("->").pop()?.trim() ?? ref;
  }
  if (ref.startsWith("tag: ")) {
    return ref.slice(5);
  }
  return ref;
}

export function isActiveRef(
  ref: string,
  currentBranch: string,
  entryHash: string,
  headHash: string,
): boolean {
  if (!headHash || entryHash !== headHash) {
    return false;
  }

  const label = refDisplayName(ref);
  if (currentBranch === "HEAD") {
    return ref.startsWith("HEAD");
  }

  return label === currentBranch;
}
