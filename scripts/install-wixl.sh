#!/usr/bin/env bash
set -euo pipefail

# Ubuntu apt ships wixl 0.103, which cannot parse WiX <Environment> (added in msitools 0.105).
# ARM64 MSI packages need msitools main (unreleased); pin a known-good commit for CI reproducibility.
MSITOOLS_GIT_REF="${MSITOOLS_GIT_REF:-04d9640703629dd8509bff67fb70b14897cdde28}"

PREFIX="${HOME}/.local"
LIBDIR="${PREFIX}/lib/x86_64-linux-gnu"
WIXL="${PREFIX}/bin/wixl"

find_wixl_extdir() {
  find "${PREFIX}/share" -type f -path '*/ext/ui/bitmaps/bannrbmp.bmp' 2>/dev/null | head -1 | sed 's|/ui/bitmaps/bannrbmp.bmp||'
}

wixl_version_ok() {
  local version="${1:-}"
  [[ "$version" =~ ^wixl\ 0\.10[5-9] ]] || [[ "$version" =~ ^wixl\ 0\.1[1-9] ]]
}

wixl_supports_arm64() {
  local output
  output="$("$WIXL" -a arm64 2>&1)" || true
  [[ "$output" != *"not supported"* ]]
}

wixl_install_complete() {
  local extdir banner_bmp installed_version

  [ -x "$WIXL" ] || return 1
  installed_version="$("$WIXL" --version 2>&1 | head -1 || true)"
  wixl_version_ok "$installed_version" || return 1
  wixl_supports_arm64 || return 1
  extdir="$(find_wixl_extdir)"
  banner_bmp="${extdir}/ui/bitmaps/bannrbmp.bmp"
  [ -n "$extdir" ] && [ -f "$banner_bmp" ]
}

if [ "${FORCE_WIXL_INSTALL:-0}" != "1" ] && wixl_install_complete; then
  echo "wixl already sufficient: $("$WIXL" --version 2>&1 | head -1)"
  echo "WIXL_EXTDIR=$(find_wixl_extdir)"
  exit 0
fi

if [ -x "$WIXL" ]; then
  echo "Replacing outdated or incomplete wixl: $("$WIXL" --version 2>&1 | head -1 || true)"
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

if [[ "$MSITOOLS_GIT_REF" =~ ^v[0-9] ]]; then
  git clone --depth 1 --recursive --branch "$MSITOOLS_GIT_REF" \
    https://github.com/GNOME/msitools.git "$tmpdir/msitools"
else
  git init "$tmpdir/msitools"
  git -C "$tmpdir/msitools" remote add origin https://github.com/GNOME/msitools.git
  git -C "$tmpdir/msitools" fetch --depth 1 origin "$MSITOOLS_GIT_REF"
  git -C "$tmpdir/msitools" checkout FETCH_HEAD
  git -C "$tmpdir/msitools" submodule update --init --recursive --depth 1
fi

cd "$tmpdir/msitools"
# Install into ~/.local so `ninja install` does not need sudo (sudo breaks user pip meson).
meson setup build --prefix="${PREFIX}"
ninja -C build
ninja -C build install

if ! wixl_install_complete; then
  echo "error: installed wixl is still too old or missing arm64 support: $("$WIXL" --version 2>&1 | head -1 || true)" >&2
  exit 1
fi

echo "Installed: $("$WIXL" --version 2>&1 | head -1) (msitools ${MSITOOLS_GIT_REF})"
echo "WIXL_EXTDIR=$(find_wixl_extdir)"
