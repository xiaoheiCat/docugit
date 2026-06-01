#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/packaging/msi/wixui"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 --filter=blob:none --sparse https://github.com/wixtoolset/wix3.git "$TMP/wix3"
git -C "$TMP/wix3" sparse-checkout set src/ext/UIExtension/wixlib

mkdir -p "$TARGET"
find "$TARGET" -maxdepth 1 -name '*.wxs' ! -name 'WixUI_DocuGit.wxs' ! -name 'Common.wxs' -delete
cp "$TMP/wix3/src/ext/UIExtension/wixlib/"*.wxs "$TARGET/"
rm -f "$TARGET/WixUI_InstallDir.wxs"

echo "Vendored WiX UI files into $TARGET (WixUI_DocuGit.wxs and Common.wxs preserved)."
