#!/usr/bin/env bash
# Estrae frame di riferimento hero — campionamento bilanciato (non tutti i fotogrammi).
# - Screen recording (Instagram / browser): 5 fps = 1 frame ogni 200 ms
# - Riprese telefono AoT (.mp4): 10 fps = 1 frame ogni 100 ms
set -euo pipefail

BASE="$(cd "$(dirname "$0")" && pwd)"
FPS_SCREEN=5          # .mov screen recording: 1 frame ogni 200 ms
FPS_ACTION=10         # .mp4 riprese AoT: 1 frame ogni 100 ms

rm -rf "$BASE/frames"
mkdir -p "$BASE/frames"/{astra,hero-one-piece,pxl-1830,pxl-video,pxl-rec-3}

extract_fps() {
  local src="$1" outdir="$2"
  echo ">>> $src @ ${FPS_SCREEN} fps (200 ms)"
  ffmpeg -y -i "$BASE/$src" \
    -vf "fps=${FPS_SCREEN},scale=1280:-1" -q:v 2 \
    "$BASE/frames/$outdir/%05d.jpg"
}

extract_action() {
  local src="$1" outdir="$2"
  local ms=$((1000 / FPS_ACTION))
  echo ">>> $src @ ${FPS_ACTION} fps (${ms} ms)"
  ffmpeg -y -i "$BASE/$src" \
    -vf "fps=${FPS_ACTION},scale=1280:-1" -q:v 2 \
    "$BASE/frames/$outdir/%05d.jpg"
}

extract_fps astra.mov astra
extract_fps hero-one-piece.mov hero-one-piece
extract_action "PXL 2026-06-29 18-30-02.mp4" pxl-1830
extract_action "PXL 2026-06-29 Video.mp4" pxl-video
extract_action "Avviso scansione antivirus.mp4" pxl-rec-3

echo ""
echo "=== Riepilogo ==="
total=0
for dir in astra hero-one-piece pxl-1830 pxl-video pxl-rec-3; do
  count=$(find "$BASE/frames/$dir" -name '*.jpg' | wc -l | tr -d ' ')
  total=$((total + count))
  du -sh "$BASE/frames/$dir" | awk -v d="$dir" -v c="$count" '{print d ": " c " frame, " $1}'
done
echo "TOTALE: $total frame"
du -sh "$BASE/frames"
