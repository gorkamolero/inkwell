#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
export HOTPRESS_PROOF_OUTPUT="${HOTPRESS_PROOF_OUTPUT:-/private/tmp/claude-501/-Users-gorkolas-Developer-job-hunt-command-center/130c3c3e-ffb7-43bf-a354-cb1c2408aaed/scratchpad/hotpress-proof}"
export PLAYWRIGHT_BROWSERS_PATH="$HOTPRESS_PROOF_OUTPUT/browsers"
mkdir -p "$HOTPRESS_PROOF_OUTPUT"
if ! curl -fsS http://localhost:3847 > /dev/null; then
  pnpm dev > "$HOTPRESS_PROOF_OUTPUT/dev.log" 2>&1 &
  dev_pid=$!
  trap 'kill "$dev_pid" 2>/dev/null || true' EXIT
  for attempt in {1..90}; do
    if curl -fsS http://localhost:3847 > /dev/null 2>&1; then break; fi
    sleep 1
  done
fi
bash e2e/proof/prepare-video-tools.sh
pnpm exec playwright test --project=collaboration "$@"
