# Hotpress demo v14 — take 7 recomposition

Outputs: `~/Downloads/hotpress-v14/`. **48.267 s**, 1920×1080, 30 fps, silent H.264, yuv420p, faststart. Master and web MP4, JPEG poster, contact sheet, representative frames, two-second samples, phone sheets, transition samples, metadata, self-review and delivery verification are named v14.

## Single-take provenance

Every action frame comes from **v13 take 7**, retained at `~/Downloads/hotpress-v13/take-7/`. Both raw hashes match v13. All source ranges, screens, cut times, durations and zero holds are unchanged. No recording, room, server, push, deployment or hotpress.app request. No environment file was opened, printed or edited. **Port 3847 is free**.

Original capture, latency and exact-room cleanup evidence is read locally from v13; it is not relabelled as a new run. The end-card measurement remains the original 120.962375 ms median of 30 edits. Native source dimensions are 1744×1600; source offsets are Ana 1.114729 s and Swift Author 1.112500 s. Match uses one shared scenario range with the two epoch offsets.

## Shot ranges and every hold

Scenario times start at take 7's common epoch. Raw ranges use the selected screen's offset; match lists Ana / Swift Author. Output times are frame-quantized. **No editorial freeze, cloned hold or slow motion**, including the final match. Only the four-second typography end card is still.

| Shot | Screen | Scenario range | Raw media range | Output range | End freeze | Maximum upscale |
|---|---|---:|---:|---:|---:|---:|
| 01-alone | ana | 0.000–1.585 | 1.115–2.700 | 0.000–1.600 | 0.000 s | 1.0556× |
| 02-link | guest | 2.943–4.419 | 4.056–5.532 | 1.600–3.067 | 0.000 s | 1.0556× |
| 02-arrival | ana | 4.419–6.778 | 5.534–7.893 | 3.067–5.433 | 0.000 s | 1.0556× |
| 03-ana-writing | ana | 6.778–9.939 | 7.893–11.054 | 5.433–8.600 | 0.000 s | 1.0565× |
| 03-guest-writing | guest | 9.939–14.031 | 11.052–15.144 | 8.600–12.700 | 0.000 s | 1.0565× |
| 04-sentence | ana | 16.060–20.535 | 17.174–21.650 | 12.700–17.167 | 0.000 s | 1.1111× |
| 05-comment | ana | 21.436–27.697 | 22.551–28.812 | 17.167–23.433 | 0.000 s | 0.8681× |
| 07-guest-reply | guest | 32.677–36.989 | 33.790–38.102 | 23.433–27.733 | 0.000 s | 0.7689× |
| 08-ana-reply | ana | 41.933–45.262 | 43.048–46.377 | 27.733–31.067 | 0.000 s | 0.7689× |
| 09-offline-start | guest | 47.505–49.121 | 48.618–50.234 | 31.067–32.667 | 0.000 s | 1.0556× |
| 10-ana-meanwhile | ana | 49.675–52.511 | 50.790–53.626 | 32.667–35.500 | 0.000 s | 1.0565× |
| 09-offline-writing | guest | 52.515–54.694 | 53.628–55.807 | 35.500–37.667 | 0.000 s | 1.0556× |
| 11-merge | ana | 55.594–58.594 | 56.709–59.709 | 37.667–40.667 | 0.000 s | 1.0556× |
| 12-match | both | 58.594–62.194 | 59.709–63.309 / 59.707–63.307 | 40.667–44.267 | 0.000 s | 0.6484× |

End card: **44.267–48.267 s**. Maximum upscale is **1.1112×**, below 1.25×.

## Changes and measurements

1. **Reply shots 07 and 08:** crop `[8,240,1728,1220]`, rendered 1328×938 at `(296,16)`. Pulling back preserves the highlighted phrase and pin and contains the full popover border/shadow. The largest source border/shadow box is `[1000,768,1728,1368]`, with output bottom 883.3 px. Caption row starts at 972 px: **88.7 px minimum clearance**. This worst-case envelope fits during native fades as well. The verifier scans all **129 guest and 100 Ana frames**, measures connected border/shadow components, checks source and output bounds, checks white delivered pixels below/right of the shadow, and checks highlight/pin pixels in every output frame.
2. **Merge:** the unannotated frame pixels give ink bounds `[1008,596,1455,642]` for “The tide turned.” and `[117,879,759,933]` for “The town woke slowly.” (left, top, right, bottom). Tint boxes extend 3 px horizontally and 7 px vertically around exactly these sentences. Ana is green `#16803c`, Swift Author blue `#2563eb`, both at 12% opacity. Each dark 30 px pill begins **20 px after its full stop**, vertically centred at y=619 or y=906, clear of other text and the pin. The 0.2 s fades begin at +0.60 and +1.35 s, after the town sentence arrives in encoded frame 5 (+0.167 s). All 90 merge frames are checked for annotation timing, positions, tint colours, retained sentence ink and pill pixels.
3. **Match:** both windows use the same contiguous top-left `[8,8,1420,950]` crop and scenario timestamp. Each renders at 920×616: **60 × 920 / 1420 = 38.87 px body type**. Headers, avatars, LIVE, formatting row, heading, all four paragraphs, highlight and pin retain their original arrangement. Only right/bottom margins are dropped. Side-by-side allows larger text than stacking intact regions. Screens are at `(20,130)` and `(980,130)`, labels at y=762; the complete screens-plus-labels group is centred above the caption, with approximately 130 px above and below.
4. **Same sentence:** crop starts at source y=256 instead of 280, rendered at `(0,68)` at the same scale. Every frame has **37 px white above “Chapter One”**.
5. **Reconnect caption:** “Swift Author is back online. Both edits merge.” Fade begins at the cut, gated by original guest LIVE pixels. Ana's real receiving-frame arrival remains visible.
6. **End card:** adds **hotpress.app at 40 px**, matching Inter and secondary `#c6d0da`. Other copy and the four-second duration remain unchanged.

## Review and verification

**Passed:** `v14-delivery-verification.json`. Both videos fully decode. V13 checks remain: source hashes and PNG dimensions/timestamps, chronological non-overlapping ranges, no freezes, upscale, source duration, badges, real arrival, join label, paragraph bands, latency, prior exact cleanup and free port. New checks cover popovers frame by frame, sentence annotations after arrival, match body type and every-frame heading padding.

Pulled and reviewed **105 samples every 0.25 s**, throughout each changed shot and around its boundaries, at full 1920×1080 and 390 px: `v14-changed/`, `v14-changed-phone/`. Review sheets in `v14-changed-review/` contain **28 full-size four-frame sheets** with unscaled 1920×1080 tiles and **six phone sheets** with unscaled 390 px tiles. All samples were viewed. The inherited-format 120 all-cut samples per size remain in `v14-transitions/` and `v14-transitions-phone/`. Review is agent self-review, not external approval.

Temporary shot encodes and inspection helpers are removed after verification. Delivery assets, raw v13 captures and review evidence remain outside git. Source is committed by explicit path only.

## Reproduce without recording or a server

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v14" node e2e/proof/compose-v14.mjs
uv run e2e/proof/verify-v14.py "$HOME/Downloads/hotpress-v14"
```

Run from the repository root with the existing v13 directory available. The verifier declares NumPy, Pillow and SciPy dependencies inline; FFmpeg/ffprobe are required. Headless Chromium generates only local typography assets and blocks HTTP(S) page requests. The verifier requires the completed `v14-self-review.json`; it never manufactures a review claim.
