/**
 * Convert DocuGit pkg_version (2026.06.02_09.41.38_e89edf) to semver for electron-updater.
 * Prerelease numeric identifiers must not have leading zeroes.
 */
export function pkgVersionToSemver(raw: string): string {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})_(\d{2})\.(\d{2})\.(\d{2})_([a-f0-9]+)$/.exec(raw);
  if (!match) {
    return raw;
  }

  const [, year, month, day, hour, minute, second, sha] = match;
  const major = year;
  const minor = String(Number(month));
  const patch = String(Number(day));
  const preHour = String(Number(hour));
  const preMinute = String(Number(minute));
  const preSecond = String(Number(second));

  return `${major}.${minor}.${patch}-${preHour}.${preMinute}.${preSecond}.${sha}`;
}

if (import.meta.main) {
  const raw = process.argv[2];
  if (!raw) {
    console.error("usage: pkg-version-to-semver.ts <pkg_version>");
    process.exit(1);
  }
  console.log(pkgVersionToSemver(raw));
}
