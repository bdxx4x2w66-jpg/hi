#!/bin/bash
# Concatenate rendered parts and mux the synthesised audio → build/manfen.mp4
set -e
cd "$(dirname "$0")/.."
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -loglevel error -f concat -safe 0 -i build/render/parts.txt -i build/audio/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart build/manfen.mp4
ls -la build/manfen.mp4
