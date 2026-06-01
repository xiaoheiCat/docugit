#!/usr/bin/env bash
set -euo pipefail

# wixl 0.105 treats CDATA as an unhandled Publish child node (libxml CDATA != TEXT).
# Expand CDATA condition text and escape "<>" for XML.

out="${1:?output directory}"
shift

mkdir -p "$out"

for src in "$@"; do
  dest="$out/$(basename "$src")"
  perl -0777 -pe '
    s/<!\[CDATA\[(.*?)\]\]>/
      my $text = $1;
      $text =~ s{<>}{&lt;&gt;}g;
      $text
    /gse;
  ' "$src" > "$dest"
done
