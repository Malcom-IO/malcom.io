#!/usr/bin/env bash
# Regenerate the optimized WebP derivatives the QuillQuest page actually serves.
# Sources (full-res PNGs) live alongside; the site references only public/assets/quillquest/web/*.
# Requires: cwebp (brew install webp).
#
# The page is one marketing hero since 2026-08-17, so this is down to two inputs: the app icon
# and the single home-screen shot. The gallery screenshots and the Ivy/Owen/Mia mascots went
# with the sections that used them — masters and derivatives both. If a future page wants them
# back, the screenshot masters live in the QuillQuest repo at store/screenshots/iphone-6.9/,
# which is their source of truth; these were only ever copies.
set -euo pipefail

QQ="$(cd "$(dirname "$0")/.." && pwd)/public/assets/quillquest"
WEB="$QQ/web"
mkdir -p "$WEB"

# iPhone screenshots (1320×2868) -> two widths for the hero's responsive srcset
for f in "$QQ"/screenshots/iphone/qq-iphone-*.png; do
  base="$(basename "$f" .png)"
  cwebp -quiet -q 80 -resize 440 0 "$f" -o "$WEB/${base}-440.webp"
  cwebp -quiet -q 80 -resize 660 0 "$f" -o "$WEB/${base}-660.webp"
done

# App icon (1024²) -> hero brand mark at 1x/2x. icon-512 also feeds make-og-card.mjs.
cwebp -quiet -q 85 -resize 256 0 "$QQ/icon.png" -o "$WEB/icon-256.webp"
cwebp -quiet -q 85 -resize 512 0 "$QQ/icon.png" -o "$WEB/icon-512.webp"

echo "Wrote $(find "$WEB" -type f | wc -l | tr -d ' ') files to $WEB"
