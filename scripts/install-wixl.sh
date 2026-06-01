#!/usr/bin/env bash
set -euo pipefail

# Ubuntu apt ships wixl 0.103, which cannot parse WiX <Environment> (added in msitools 0.105).
MSITOOLS_VERSION="${MSITOOLS_VERSION:-0.105}"

wixl_version_ok() {
  local version="${1:-}"
  [[ "$version" =~ 0\.10[5-9] ]] || [[ "$version" =~ 0\.1[1-9] ]]
}

if command -v wixl >/dev/null 2>&1; then
  installed_version="$(wixl --version 2>&1 | head -1 || true)"
  if wixl_version_ok "$installed_version"; then
    echo "wixl already sufficient: $installed_version"
    exit 0
  fi
  echo "Replacing outdated wixl: $installed_version"
fi

sudo apt-get update
sudo apt-get install -y \
  build-essential bison flex gettext git \
  libgcab-dev libgsf-1-dev libxml2-dev \
  gobject-introspection libgirepository1.0-dev \
  valac pkg-config perl python3-pip

PREFIX="${HOME}/.local"
LIBDIR="${PREFIX}/lib/x86_64-linux-gnu"

python3 -m pip install --user "meson>=1.4" ninja
export PATH="${PREFIX}/bin:${PATH}"
export LD_LIBRARY_PATH="${LIBDIR}${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

git clone --depth 1 --recursive --branch "v${MSITOOLS_VERSION}" \
  https://github.com/GNOME/msitools.git "$tmpdir/msitools"

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

banner_bmp="${PREFIX}/share/wixl-${MSITOOLS_VERSION}/ext/ui/bitmaps/bannrbmp.bmp"
if [ ! -f "$banner_bmp" ]; then
  echo "error: wixl UI bitmaps missing at $banner_bmp" >&2
  exit 1
fi

echo "Installed: $installed_version"
