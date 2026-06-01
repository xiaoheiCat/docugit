#!/usr/bin/env bash
set -euo pipefail

# Pull wixl-native WiX UI fragments from msitools (not WiX3 wixlib).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/packaging/msi/wixl-ui"
MSITOOLS_VERSION="${MSITOOLS_VERSION:-0.105}"
BASE="https://raw.githubusercontent.com/GNOME/msitools/v${MSITOOLS_VERSION}/data/ext/ui"

mkdir -p "$TARGET"

FILES=(
  Common.wxs
  CancelDlg.wxs
  ErrorDlg.wxs
  ExitDialog.wxs
  FatalError.wxs
  FilesInUse.wxs
  MaintenanceTypeDlg.wxs
  MaintenanceWelcomeDlg.wxs
  MsiRMFilesInUse.wxs
  OutOfDiskDlg.wxs
  OutOfRbDiskDlg.wxs
  PrepareDlg.wxs
  ProgressDlg.wxs
  ResumeDlg.wxs
  UserExit.wxs
  VerifyReadyDlg.wxs
  WaitForCostingDlg.wxs
  WelcomeDlg.wxs
)

for file in "${FILES[@]}"; do
  curl -fsSL "${BASE}/${file}" -o "${TARGET}/${file}"
done

echo "Synced ${#FILES[@]} wixl-native UI files into ${TARGET}."
