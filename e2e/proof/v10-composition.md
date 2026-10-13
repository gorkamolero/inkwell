# Hotpress demo v10 — composition only

Delivery: `~/Downloads/hotpress-v10/`. Duration 44.566 s, 1920×1080,
30 fps, silent H.264, yuv420p, faststart. Master video bitrate 7.965 Mbps
(container 7.968 Mbps); web video 0.397 Mbps (container 0.400 Mbps),
CRF 22 with `-tune stillimage`.

## Changes from accepted v9 (e5fb20e)

- Changed the initial guest tag to `Guest’s screen (Quiet Storyteller)`.
  Every generated caption, tag, chip and end-card string passes an ASCII
  apostrophe and unresolved interpolation guard.
- End-card subline is `median of 30 edits`. Retained `Tested end to end
  against Liveblocks`. Subline is 48 px against the 58 px main statistic
  (82.8%, above the requested 70%). End-card duration remains four seconds.
- Reconnect clones the real captured LIVE frame for 1.5 s (45 output frames),
  extending the movie by 0.8 s. Badge pixels remain stable throughout the hold.
- Match preserves v9’s three selected text lines and stacked comparison.
  Restored the source’s approximately 67 px paragraph step, as in 11-merge,
  then uniformly scaled each text block to fit. The lower block starts at
  y=506. All 105 frames have at least 55 clear pixels between the last ink
  (y=911) and the caption pill (y=967). Tags and divider are unchanged.
- Opener uses cursor-free editor pixels at absolute 6.000 s in the same
  accepted v6 recording referenced by v9, with identical static text.
  This replaces only the editor region containing the baked local pointer.
  The same pointer shape now eases into the blank area below the text over
  0.85 s, stopping at approximately (1300, 620); no letter is covered.

All other shot source ranges, captions, crops and durations are unchanged.
Eleven untouched shots were compared against v9 at corresponding times;
maximum mean grayscale pixel difference at 480×270 was under 0.01/255,
consistent with delivery encoding differences.

## Verification and provenance

Reviewed changed named frames at full 1920×1080, opener entry samples at
0, 0.2, 0.4, 0.6 and the final frame, and all four 390 px phone review sheets.
Also reviewed opener, reconnect and match transition sheets at 390 px.
Both finished videos pass complete FFmpeg decoding and faststart checks.
The frame scan, duration/bitrate/hash details, LIVE hold verification and
unchanged-shot comparisons are in `v10-delivery-verification.json` and
`v10-spacing-verification.json`.

No recordings, rooms, app calls, servers, push or deploy. Port 3847 was free
before and after. Chromium is used only to rasterize local composition text;
HTTP(S) is blocked. No environment files were opened. All original v9
recordings and outputs remain untouched. Generated shot intermediates and
exploratory images were removed after verification; final delivery and review
artifacts remain outside git.

## Recompose and verify

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v10" \
HOTPRESS_V8_SOURCE="$HOME/Downloads/hotpress-v8" \
node e2e/proof/compose-v10.mjs
python3 e2e/proof/verify-v10.py \
  "$HOME/Downloads/hotpress-v10" "$HOME/Downloads/hotpress-v9"
```

Uses the same v8 scenario, latency data and recordings as v9, plus its
referenced v6 opening recording. No new latency measurement is claimed.
