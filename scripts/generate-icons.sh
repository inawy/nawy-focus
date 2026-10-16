#!/usr/bin/env bash
# Generate PNG icons from SVG sources for PWA / Apple / notifications.
# Requires ImageMagick (`convert`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICONS="$ROOT/public/icons"
PUBLIC="$ROOT/public"

SRC="$ICONS/icon.svg"
SQ="$ICONS/icon-square.svg"
MONO="$ICONS/icon-mono.svg"

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick convert not found" >&2
  exit 1
fi

for s in 48 96 180 192 512 1024; do
  convert -background none -resize "${s}x${s}" "$SRC" "$ICONS/icon-${s}.png"
done

for s in 192 512 1024; do
  convert -background none -resize "${s}x${s}" "$SQ" "$ICONS/icon-maskable-${s}.png"
done

for s in 192 512; do
  convert -background none -resize "${s}x${s}" "$MONO" "$ICONS/icon-mono-${s}.png"
done

cp "$ICONS/icon-180.png" "$PUBLIC/apple-touch-icon.png"
echo "Generated PNG icons under public/icons and apple-touch-icon.png"
