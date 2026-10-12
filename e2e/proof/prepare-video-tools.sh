#!/usr/bin/env bash
set -euo pipefail
proof_output="${HOTPRESS_PROOF_OUTPUT:-/private/tmp/claude-501/-Users-gorkolas-Developer-job-hunt-command-center/130c3c3e-ffb7-43bf-a354-cb1c2408aaed/scratchpad/hotpress-proof}"
if ffmpeg -hide_banner -filters 2>/dev/null | rg drawtext > /dev/null; then exit 0; fi
if test -x "$proof_output/ffmpeg-9.0.2/ffmpeg"; then exit 0; fi
mkdir -p "$proof_output"
if ! test -d "$proof_output/ffmpeg-9.0.2"; then
  curl -fL -C - --retry 3 --retry-all-errors https://ffmpeg.org/releases/ffmpeg-9.0.2.tar.xz -o "$proof_output/ffmpeg-9.0.2.tar.xz"
  tar -xf "$proof_output/ffmpeg-9.0.2.tar.xz" -C "$proof_output"
fi
mkdir -p "$proof_output/build-tmp"
export TMPDIR="$proof_output/build-tmp"
cd "$proof_output/ffmpeg-9.0.2"
./configure --disable-everything --disable-autodetect --disable-network --disable-doc --disable-debug --enable-ffmpeg --enable-protocol=file --enable-demuxer=matroska --enable-decoder=vp8,vp9 --enable-encoder=libx264 --enable-muxer=mp4 --enable-filter=pad,drawtext,hstack,format,scale,setsar --enable-libfreetype --enable-libharfbuzz --enable-libfontconfig --enable-libx264 --enable-gpl > "$proof_output/ffmpeg-configure.log" 2>&1
make -j8 ffmpeg > "$proof_output/ffmpeg-build.log" 2>&1
