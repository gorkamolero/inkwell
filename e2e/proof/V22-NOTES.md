# Hotpress demo v22 — phone legibility and margins

Delivery: `~/Downloads/hotpress-v22/`. **54.267 seconds**, 1920×1080, 30 fps, silent H.264, faststart. Master/web MP4, poster, contact sheet, representative frames, two-second frames, phone sheets, quarter-second full-size/390 px samples, transitions, camera frames, metadata, self-review and verifier use v22 names.

## Scope

Recomposed only from `~/Downloads/hotpress-v20/take-3/raw-{ana,guest}.webm`. No recording, rooms, server, push, deployment, hotpress.app requests or env-file access. Historical source, latency and cleanup evidence remain the v20 records. Port 3847 is checked locally on IPv4 and IPv6. All source intervals, shot durations, caption text/timing, and camera timings are exactly v21; both join pointers remain. Maximum upscale stays 1.25×. Native bands cross the moving aperture naturally, with floating bicubic transforms and no band fades. Static crop edges retain all v21 checks, including the clipped-word negative control and pale-gray edge check.

## Four changes

1. **Screen tags, 0.000–50.267 s:** every tag is 44 px Inter 500, matching captions, with identical 17×27 px pill padding and 44 px corner radius. This is 8.9375 px at a 390 px playback width. Two-screen tags remain beneath their own windows at y=762; captions remain at y=972. All delivered action frames are checked for tag visibility, and the measured rectangles prohibit any tag/tag or tag/caption overlap, including both reconnect captions.
2. **Merge attributions, 44.433–46.667 s:** both pills fit at **36 px** without fallback, 20 px after their sentence, vertically centered. Ana’s right clearance is 90.859 px; Swift Author’s is 721.359 px, with 30 px below its pill. Blank-source-pixel checks cover every merge frame, in addition to 24 px minimum window clearance and text/pin exclusion.
3. **Matched guest/Ana reply framing, 26.200–33.600 s:** virtual source crop `[12,576,1780,836]` to `[1920,902]` at `[0,24]`, about 1.079×. Retain source x=12…1736 and y=610…1412; extend only the existing white top/right margins by 34/56 source pixels. The conservative line/pin/card envelopes have **64.719 px left, 69.034 px right and 41 px top** clearance. The right envelope includes the card border/shadow. No 48 px fallback is needed. Ana’s unchanged eased pull-back is 33.600–34.400, followed by twelve real full-view frames through 34.800. Every frame uses its actual transform; card clearance applies while the card exists, and line/pin clearance also holds during the pull-back. Delivered comment-body ink measures 42–46 px (hover 42, guest/received comment 46, reply 44); author ink is 28–29 px. Both minimums are met.
4. **End dissolve, 50.267–50.567 s:** nine transition frames blend the last real frame of the complete 3.6-second match shot into the unchanged end card. **Zero match footage is removed.** The final hold is 50.567–54.267, keeping the total duration unchanged. No editorial freeze is added outside this explicitly requested transition/final hold. Pixel fitting independently checks each blend frame and the opaque endpoint at frame 9.

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
| End transition | last match frame → graphic | — | 50.267–50.567 |
| End card hold | graphic | — | 50.567–54.267 |

## Goal checklist

| Goal | v22 output timestamps / evidence | Result |
|---|---|---|
| 1920×1080, calm backdrop, named screen tags | Action 0.000–50.267; comparison 46.667–50.267 | Uniform 44 px Inter 500 tags; same pill style |
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
| Measured end card | Dissolve 50.267–50.567; hold 50.567–54.267 | Same v20 30-edit median, about 0.1 s; hotpress.app |
| One take, 45–65 s, chronology, no freezes | Entire 54.267 s | v20 take 3 only, forward-only non-overlap, real footage holds |
| Claude reviews a frame from every step | Delivery frames and notes supplied | Not claimed: this is Codex v22 self-review |
| Independent fresh-eyes scores/approval | Review assets supplied | Not claimed; v22 polish addressed; independent review not claimed |
| Iterate until requested rendering fixes resolved | Local recomposition and encoded verification | No new recording, per this task’s explicit constraint |
| Publish after review | Local master/web/contact sheet | Not performed; push/deploy prohibited |

## Verification and visual review

`verify-v22.py` retains the v21 provenance, forward-only chronology, maximum-scale, no-hold, captions/badges, arrival, matching text, popover geometry, glyph height, pin duration, attribution placement/timing, source motion, both pointers, encoding, historical latency/cleanup, static crop edges, sub-pixel camera motion, opaque native bands, reply-card timing, and complete camera extraction checks. It adds uniform tag geometry/font/style and every-frame visibility, the 36 px pill requirements, every-frame close-up margins with encoded white-perimeter checks, nine-frame blend pixel checks, and equality of action/caption/camera timing to v21.

There are 256 quarter-second samples at each size in `v22-changed/` and `v22-changed-phone/`, 128 cut samples at each size, and 135 camera frames at each size. Additional quarter-second review sheets cover the replies, merge, match and end interval. `v22-self-review.json` specifies the actual visual review scope; extracted frames are not all claimed to have been individually opened. This is local self-review, not independent approval.

**Verification: PASS.** All 1,508 action frames pass tag visibility/separation; all 258 reply-shot frames pass margin checks. The nine-frame dissolve has at most 1.211 mean pixel levels of error against the independently calculated blend. Maximum encoded camera translation-fit error is 0.0797 px. Both source hashes match v20, both join pointers pass, and port 3847 is free.

Verification results and detailed measurements: `v22-delivery-verification.json`; execution log: `verify-v22.log`.

## Reproduce without a server

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v22" node e2e/proof/compose-v22.mjs
uv run e2e/proof/verify-v22.py "$HOME/Downloads/hotpress-v22"
```

The verifier requires the completed self-review JSON and retained v20/v21 evidence. Source is committed by explicit path; videos remain outside git. Per-shot MP4 and lossless camera intermediates are removed after verification; image evidence and camera transform records remain.
