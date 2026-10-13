# Hotpress demo v21 — recompose of the accepted v20 take

Delivery: `~/Downloads/hotpress-v21/`. **54.267 seconds**, 1920×1080, 30 fps, silent H.264, faststart. Master, web MP4, poster, contact sheet, representative frames, two-second frames, phone frames, quarter-second samples, cut samples, camera frames, metadata, self-review and verification JSON use v21 names.

## Scope and provenance

Only `~/Downloads/hotpress-v20/take-3/raw-{ana,guest}.webm` contributes action footage. The verifier compares both source SHA-256 hashes against the v20 delivery manifest, validates the original PNG sequence and scenario, and retains v20’s latency and cleanup evidence. Those are historical capture records, not new online checks. No recording, room operations, server, push, deployment, hotpress.app requests or env-file access occurred. Port 3847 is checked locally on IPv4 and IPv6.

All source intervals advance without overlap. Every action frame comes from elapsed source time; there are no editorial freezes, duplicated-frame holds or speed changes. The existing four-second generated end card remains. Maximum upscale is 1.25×. Both join pointers, captions, sentence beat, offline/reconnect proof, attributions and end-card claims remain as in v20.

## Five fixes

1. **Matched push-in, 18.667–19.467 s.** Option (b): the first comment frame uses exactly the preceding sentence shot’s crop, render size and placement. No reset to full app, dark side margins or LIVE badge. A 0.8 s smoothstep pushes directly to the comment view.
2. **Pull-back, 33.600–34.400 s; real full-view hold, 34.400–34.800 s.** Twelve final source frames stay at the full-document transform before the offline cut. The header enters through the top edge and remains opaque.
3. **Ana reply, 30.400–34.800 s.** Source begins at 39.237 s, one second later than v20, just before the actual pin click/open animation. Source ends at 43.626 s, 0.2 s earlier than v20. Caption begins at 31.129 s, after the reply is visible. The actual encoded card is checked for at least 1.5 s of reading, and its disappearance precedes the zoom by less than 0.7 s. No caption-less interval can exceed 0.767 s (the initial caption delay, rounded up with a frame allowance); the final caption fade is 0.25 s.
4. **Same-screen move, 7.133–7.633 s.** A 0.5 s smoothstep starts from Ana’s preceding full view and arrives at the unchanged document crop. It replaces the roughly 210 px text jump.
5. **Comment border, settled close-up 19.467–26.200 s.** Move source crop x from 8 to 16 while retaining width 1536 and 1.25× scale. Reply crops keep their accepted x=50 and blank top/right extensions, preserving pin/card clearance. The new detector measures pale-gray as well as dark edge pixels.

No app bands fade at all. Native bands are geometrically clipped only as they cross the moving aperture; static framings still forbid clipped words/icons. Floating inverse-affine bicubic resampling and sub-pixel window coverage remain. The inherited edge detector now applies the requested **static framing** rule, while SIFT/RANSAC checks every consecutive moving transform and independent native-ink checks reject whitening of bands fully inside the aperture. The reply’s existing blank 18 px top extension applies only at its settled close framing, where the preceding line crosses the top crop edge; it does not erase a fully contained band.

## Selected source ranges

Times use the common v20 scenario clock; raw stream offsets remain Ana 1.073550 s / guest 1.076460 s. Output durations are quantized to 30 fps.

| Shot | Screen | Source seconds | Output seconds |
|---|---|---:|---:|
| 01-alone | ana | 0.001–2.500 | 0.000–2.500 |
| 02-link | guest | 3.672–6.004 | 2.500–4.833 |
| 02-arrival | ana | 6.004–8.314 | 4.833–7.133 |
| 03-ana-writing | ana | 8.314–11.351 | 7.133–10.167 |
| 03-guest-writing | guest | 11.351–15.360 | 10.167–14.167 |
| 04-sentence | ana | 17.154–21.661 | 14.167–18.667 |
| 05-comment | ana | 22.506–30.028 | 18.667–26.200 |
| 07-guest-reply | guest | 32.110–36.294 | 26.200–30.400 |
| 08-ana-reply | ana | 39.237–43.626 | 30.400–34.800 |
| 09-offline-start | guest | 44.921–46.535 | 34.800–36.400 |
| 10-ana-meanwhile | ana | 47.063–49.898 | 36.400–39.233 |
| 09-offline-writing | guest | 49.903–52.425 | 39.233–41.767 |
| 10-reconnect | both | 52.425–55.092 | 41.767–44.433 |
| 11-merge | ana | 55.092–57.325 | 44.433–46.667 |
| 12-match | both | 57.325–60.925 | 46.667–50.267 |
| End card | graphic | — | 50.267–54.267 |

## Goal checklist

| Goal | v21 output timestamps / evidence | Result |
|---|---|---|
| 1920×1080, calm backdrop, named screen tags | Action 0.000–50.267; comparison 46.667–50.267 | Accepted single-screen/two-screen design retained |
| One focal action at a time | Entire action sequence | Join, writing, sentence, comment/reply, offline/reconnect in order |
| Human curved pointer glides | 2.500–4.833 and 4.833–7.133 | Both genuine named pointers retained; encoded pixel tracking |
| Smooth camera in/out and readable phone comments | In 18.667–19.467; out 33.600–34.400; full hold to 34.800 | Matched push, natural edge crossings, sub-pixel smoothstep |
| Step 1: guest joins by link; both pointers | 2.500–7.133 | Loaded editor and LIVE precede the join caption |
| Step 2: both writers and native carets | Context 7.133–14.167; simultaneous writing 14.167–18.667 | Native names/carets and screen tags retained |
| Step 3: same sentence, two places | 14.167–18.667 | Complete 4.5 s sentence beat retained |
| Step 4: select phrase, comment, pin on both screens | Selection 19.672; caption 20.861; comment/pin through 26.200 | Complete composer and own-pin reading time retained |
| Step 5: guest replies; Ana sees it | Guest 26.200–30.400; Ana 30.400–34.800 | Pin click/open, readable reply, close, eased pull-back |
| Step 6: offline writing and merge | 34.800–46.667 | OFFLINE, parallel writing, reconnect and attributed merge retained |
| Inter captions, soft pills, accurate timing | Throughout; Ana caption from 31.129 | No caption ahead of visible action; no long caption-less reply stretch |
| Measured end card | 50.267–54.267 | Same v20 30-edit median, about 0.1 s; hotpress.app |
| One take, 45–65 s, chronology, no freezes | Entire 54.267 s | v20 take 3 only, forward-only non-overlap, real footage holds |
| Claude reviews a frame from every step | Delivery frames and notes supplied | Not claimed: this is Codex self-review |
| Independent fresh-eyes scores/approval | Review assets supplied | Not claimed; v20 reviewer’s five requested fixes addressed |
| Iterate until requested rendering fixes resolved | Local recomposition and encoded verification | No new recording, per this task’s explicit constraint |
| Publish after review | Local master/web/contact sheet | Not performed; push/deploy prohibited |

## Verification and visual review

`verify-v21.py` carries the v20 source, chronology, source-size, duration, maximum-scale, badge/caption, reconnect arrival, match text, comment geometry, glyph height, pin duration, annotation, opener motion, pointer, encoding, latency-evidence and historical-cleanup checks. Static edge checks retain the deliberately clipped-word negative control. It adds matched-start geometry, twelve-frame post-zoom hold, reply-card pixel timing, caption-less bounds, the 0.5 s camera move, pale-gray hairline measurements, opaque native band ink tests, source hash equality to v20, and complete camera extraction counts at both sizes.

All frames of the three moves, with neighboring context, are extracted to `v21-camera/` and `v21-camera-phone/`. `v21-transitions/` and `v21-transitions-phone/` contain eight samples around each cut, including quarter-second offsets and the immediately preceding frame. Additional quarter-second samples span every shot. The self-review JSON records the actual visual inspection scope; extracted frames are not automatically claimed as individually inspected. This is local self-review, not independent approval.

**Verification: PASS.** The encoded card is visible for 2.667 s; maximum camera-fit translation error is 0.0566 px across all three moves. There are 144 native-band opacity pixel checks. All 425 tested settled close-up frames have minimum edge-column mean 255 (pure white). Both pointers and the inherited semantic/pixel checks pass. There are 135 camera frames at each size, 128 cut samples at each size, and 256 additional quarter-second samples at each size.

Exact encoded measurements and pass/fail status: `v21-delivery-verification.json`; execution log: `verify-v21.log`.

## Reproduce without a server

From the repo, with the accepted v20 evidence still in Downloads:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v21" node e2e/proof/compose-v21.mjs
uv run e2e/proof/verify-v21.py "$HOME/Downloads/hotpress-v21"
```

The verifier requires a completed real self-review JSON. Source is committed by explicit path; media remains outside git. Temporary per-shot and lossless camera intermediates are removed after verification; PNG evidence, camera configs/transform records and delivered media remain.
