# Hotpress demo v18 — inline merge labels, take 7

Delivery: `~/Downloads/hotpress-v18/`. Baseline: v17, commit `4f9ec5f`.
50.767 seconds, 1920×1080, 30 fps, silent H.264/yuv420p, faststart.

Only the merge attribution labels change. All source intervals, cut timings, crops,
captions, sentence tints, and annotation fade timings remain v17. The accepted v17
OFFLINE-exit timestamp is reused because re-scanning the raw seek boundary sampled
the intermediate badge one frame early. Delivered reconnect pixels remain subject
to the full inherited verification.

| Label | Font | Pill rectangle (x, y, width, height), px | Sentence gap | Right clearance |
|---|---|---|---|---|
| Ana, meanwhile | 30 px | 1475, 592.5, 260.453, 52 | 20 px | 136.547 px |
| Swift Author, offline | 30 px | 779, 880, 315.031, 52 | 20 px | 777.969 px |

Pill vertical centres are 618.5 and 906 px, matching their respective sentence
ink-box centres. Ana has 373 px available at the required 24 px window margin;
its measured 260.453 px width fits at 30 px, so no 28 px fallback is used.
Swift Author retains 34 px bottom clearance. Both labels remain on their sentence
lines and avoid the captured text and native comment pin.

Tints retain v17 green/blue and 12% opacity. The 0.2 s fades start at close-up local
0 s (Ana) and 0.6 s (Swift Author), both after captured sentence arrival.

## Checks and review

`verify-v18.py` PASSES. All 1,403 source-shot frames pass the edge scan,
and all 67 merge frames pass the annotation checks. Both labels measure 28 px
encoded glyph ink at 30 px font size. All 31 non-attribution overlay PNGs match
v17 byte for byte. Port 3847 is free on IPv4 and IPv6.

The verifier retains the v17 provenance, source hashes, chronology, badges,
reconnect progression and caption fade, pin duration, paragraph match, latency,
local cleanup evidence, encoding, popover, text, heading, URL, crop-edge and
regression-control checks. It adds strict v17 shot equality except attribution
layout/text, same-line centring, 16–24 px sentence gaps, 24 px window clearance,
text/pin exclusion, and blank unannotated pixels under each pill in every frame.
Font-size and encoded-glyph-height measurements are reported separately.

Quarter-second merge samples, including adjacent cut boundaries, are reviewed at
native 1920 and 390 widths. The full inherited frame, phone, contact-sheet and
transition delivery set is retained. Review details and verifier results are in
`v18-self-review.json` and `v18-delivery-verification.json`.

## Reproduce

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v18" node e2e/proof/compose-v18.mjs
uv run e2e/proof/verify-v18.py "$HOME/Downloads/hotpress-v18"
```

Existing v13 take/evidence, v14/v15/v16 references and the accepted v17 metadata
and verification are required. Chromium renders local embedded assets with HTTP(S)
blocked. No recording, rooms, server, hotpress.app calls, push, deployment or env-file
access. Port 3847 is checked free on IPv4 and IPv6. Videos remain outside git.
Temporary shot encodes are removed after verification.
