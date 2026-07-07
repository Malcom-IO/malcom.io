#!/usr/bin/env bash
# Regenerate the optimized WebP derivatives the QuillQuest pages actually serve.
# Sources (full-res PNGs) live alongside; the site references only public/assets/quillquest/web/*.
# Requires: cwebp (brew install webp).
set -euo pipefail

QQ="$(cd "$(dirname "$0")/.." && pwd)/public/assets/quillquest"
WEB="$QQ/web"
mkdir -p "$WEB"

# iPhone screenshots (1320×2868) -> two widths for a responsive srcset gallery
for f in "$QQ"/screenshots/iphone/qq-iphone-*.png; do
  base="$(basename "$f" .png)"
  cwebp -quiet -q 80 -resize 440 0 "$f" -o "$WEB/${base}-440.webp"
  cwebp -quiet -q 80 -resize 660 0 "$f" -o "$WEB/${base}-660.webp"
done

# App icon (1024²) -> hero brand mark at 1x/2x
cwebp -quiet -q 85 -resize 256 0 "$QQ/icon.png" -o "$WEB/icon-256.webp"
cwebp -quiet -q 85 -resize 512 0 "$QQ/icon.png" -o "$WEB/icon-512.webp"

# Character mascots (600², transparent) -> decorative accents
for b in ivy owen mia; do
  cwebp -quiet -q 85 -resize 256 0 "$QQ/buddy-$b.png" -o "$WEB/buddy-$b-256.webp"
done

echo "Wrote $(find "$WEB" -type f | wc -l | tr -d ' ') files to $WEB"
