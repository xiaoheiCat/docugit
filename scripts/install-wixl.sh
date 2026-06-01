#!/usr/bin/env bash
set -euo pipefail

# Ubuntu apt ships wixl 0.103, which cannot parse WiX <Environment> (added in msitools 0.105).
# ARM64 MSI packages need msitools main (unreleased); pin a known-good commit for CI reproducibility.
MSITOOLS_GIT_REF="${MSITOOLS_GIT_REF:-04d9640703629dd8509bff67fb70b14897cdde28}"

PREFIX="${HOME}/.local"
LIBDIR="${PREFIX}/lib/x86_64-linux-gnu"

find_wixl_extdir() {
  find "${PREFIX}/share" -type f -path '*/ext/ui/bitmaps/bannrbmp.bmp' 2>/dev/null | head -1 | sed 's|/ui/bitmaps/bannrbmp.bmp||'
}

wixl_version_ok() {
  local version="${1:-}"
  [[ "$version" =~ wixl\ [0-9]+\.[0-9]+ ]] || [[ "$version" =~ 0\.10[5-9] ]] || [[ "$version" =~ 0\.1[1-9] ]]
}

banner_bmp="$(find_wixl_extdir)"
banner_bmp="${banner_bmp:+$banner_bmp/ui/bitmaps/bannrbmp.bmp}"

if command -v wixl >/dev/null 2>&1; then
  installed_version="$(wixl --version 2>&1 | head -1 || true)"
  if wixl_version_ok "$installed_version" && [ -n "$banner_bmp" ] && [ -f "$banner_bmp" ]; then
    echo "wixl already sufficient: $installed_version"
    echo "WIXL_EXTDIR=$(find_wixl_extdir)"
    exit 0
  fi
  echo "Replacing outdated or incomplete wixl: $installed_version"
fi

sudo apt-get update
sudo apt-get install -y \
  build-essential bison flex gettext git \
  libgcab-dev libgsf-1-dev libxml2-dev \
  gobject-introspection libgirepository1.0-dev \
  valac pkg-config perl python3-pip

python3 -m pip install --user "meson>=1.4" ninja
export PATH="${PREFIX}/bin:${PATH}"
export LD_LIBRARY_PATH="${LIBDIR}${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

git clone --depth 1 --recursive https://github.com/GNOME/msitools.git "$tmpdir/msitools"
if [[ "$MSITOOLS_GIT_REF" =~ ^v[0-9] ]]; then
  git -C "$tmpdir/msitools" fetch --depth 1 origin "refs/tags/${MSITOOLS_GIT_REF}:refs/tags/${MSITOOLS_GIT_REF}"
fi
git -C "$tmpdir/msitools" checkout "$MSITOOLS_GIT_REF"

cd "$tmpdir/msitools"
# Install into ~/.local so `ninja install` does not need sudo (sudo breaks user pip meson).
meson setup build --prefix="${PREFIX}"
ninja -C build
ninja -C build install

installed_version="$(wixl --version 2>&1 | head -1 || true)"
if ! wixl_version_ok "$installed_version"; then
  echo "error: installed wixl is still too old: $installed_version" >&2
  exit 1
fi

banner_bmp="$(find_wixl_extdir)/ui/bitmaps/bannrbmp.bmp"
if [ ! -f "$banner_bmp" ]; then
  echo "error: wixl UI bitmaps missing at $banner_bmp" >&2
  exit 1
fi

echo "Installed: $installed_version (msitools ${MSITOOLS_GIT_REF})"
echo "WIXL_EXTDIR=$(find_wixl_extdir)"
