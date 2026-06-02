export function isGitIdentityError(output: string): boolean {
  const text = output.toLowerCase();
  return (
    text.includes("please tell me who you are") ||
    text.includes("unable to auto-detect email") ||
    text.includes("author identity unknown") ||
    text.includes("committer identity unknown") ||
    text.includes("empty ident name") ||
    (text.includes("user.name") && text.includes("user.email")) ||
    text.includes("请告诉我你是谁") ||
    text.includes("无法自动检测") ||
    text.includes("身份未知")
  );
}
