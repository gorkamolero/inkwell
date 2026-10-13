# Hotpress demo v15 — tighter comments, take 7 recomposition

Outputs: `~/Downloads/hotpress-v15/`. **48.267 seconds**, 1920×1080, 30 fps, silent H.264, yuv420p, faststart. Master, web copy, poster, contact sheet, representative frames, two-second samples, phone review sheets, transition frames, quarter-second samples, metadata, self-review and verification are named v15.

Only the comment framing changes from v14 (commit 17803e1). Selection is a phase of the original continuous `05-comment` shot, not a new cut. All captions, merge pills/tints, match crop, end card, source ranges and forward-only cuts are unchanged. No editorial freeze or slow motion was introduced; every source shot has zero holds. The inherited four-second typography end card remains unchanged.

## Framing

- Selection and Ana's new-comment composer: source `[8,518,1536,752]`, output 1920×940 at `(0,16)`, **1.25× source / 1.44× v14**. Retains the full context line “The boats waited. Sails stirred.” at the maximum permitted source upscale.
- Guest preview, guest Discussion/reply and Ana's received Discussion: one shared **1.20× source / 1.561× v14** framing. Actual source crop `[480,610,1256,780]`, padded white 20 source pixels above and 24 to the right, then scaled to 1536×960 at `(192,8)`. Virtual crop `[480,590,1280,800]` in metadata preserves the exact coordinate transform. The top padding removes the preceding line's clipped descenders; the right padding excludes the original black window edge. No UI element is redrawn or relocated.
- The tall two-message Discussion sets the height constraint. Its border/shadow envelope is source `[1000,768,1728,1368]`, mapped to output `[816,221.6,1689.6,941.6]`. Minimum white clearance **26.4 px**, caption clearance **30.4 px**. Pin envelope clearance is **28.8 px**. The framing uses almost all available height while leaving the required 24 px margins and maintaining a uniform scale.
- Composer/toolbar minimum white clearance is **48.75 px**. The highlighted phrase and pin stay inside both framings. The native pin appears only after the comment is posted, as in the original take.

## Encoded text measurements

Measurements are actual dark-glyph ink heights in the delivered master, not CSS font sizes. The verifier excludes the blinking insertion caret and records measurement ROIs and timestamps.

| Text | Height at 1920 | Equivalent at 390 |
|---|---:|---:|
| composerBody | 53 px | 10.77 px |
| composerTitle | 21 px | 4.27 px |
| commentBody | 50 px | 10.16 px |
| replyBody | 49 px | 9.95 px |
| authorAna | 31 px | 6.30 px |
| authorSwift | 32 px | 6.50 px |
| discussionTitle | 32 px | 6.50 px |

The requested thresholds pass: comment/reply bodies ≥34 px, author names and Discussion ≥24 px. The separate native “New comment” composer label is 21 px of ink at the maximum 1.25× source scale; the requested title threshold concerns “Discussion”.

## Verification and review

`verify-v15.py` passes the inherited v14 checks for source provenance/hashes, source dimensions and timestamps, chronological ranges, zero holds, upscale ceiling, badges, real merge arrival, join label, match paragraphs, original latency/cleanup evidence, encoded video validity, merge annotations, heading padding and end-card URL. It additionally compares every unchanged shot field and all visible caption/asset strings directly against v14.

All **417 frames** across the three continuous comment shots are scanned: **188 composer/selection, 129 guest reply, 100 Ana reply**. Connected border/shadow bounds are measured and checked against the white window and full frame with ≥24 px clearance. Conservative envelopes are checked through native opacity fades; delivered white pixels below/right of popovers, highlight/pin pixels, and top/right padding are checked independently.

Agent self-review inspected all **64 quarter-second samples** throughout the changed shots and adjacent boundaries at full size and at 390 px. `v15-changed-review/` contains 16 full-size sheets with unscaled 1920×1080 tiles and seven phone sheets with unscaled 390 px tiles. Additional inherited quarter-second samples and all-cut transition samples remain available. This is self-review, not external approval.

## Provenance and constraints

Only the two original recordings in `~/Downloads/hotpress-v13/take-7/` are used. Their SHA-256 hashes match verified v13 evidence. Original latency and exact-room cleanup records are read locally, not represented as a new run. No recording, rooms, server, hotpress.app call, push or deployment. No env file was opened, printed or edited. Port 3847 remains free on IPv4 and IPv6. Temporary shot encodes and task scratch files are removed after successful verification; delivery/review evidence is retained outside git.

## Source ranges and holds

Scenario times use the original take epoch. Every hold is zero.

| Shot | Source start | Source end | Output start | Duration |
|---|---:|---:|---:|---:|
| 01-alone | 0.000 | 1.585 | 0.000 | 1.600 |
| 02-link | 2.943 | 4.419 | 1.600 | 1.467 |
| 02-arrival | 4.419 | 6.778 | 3.067 | 2.367 |
| 03-ana-writing | 6.778 | 9.939 | 5.433 | 3.167 |
| 03-guest-writing | 9.939 | 14.031 | 8.600 | 4.100 |
| 04-sentence | 16.060 | 20.535 | 12.700 | 4.467 |
| 05-comment | 21.436 | 27.697 | 17.167 | 6.267 |
| 07-guest-reply | 32.677 | 36.989 | 23.433 | 4.300 |
| 08-ana-reply | 41.933 | 45.262 | 27.733 | 3.333 |
| 09-offline-start | 47.505 | 49.121 | 31.067 | 1.600 |
| 10-ana-meanwhile | 49.675 | 52.511 | 32.667 | 2.833 |
| 09-offline-writing | 52.515 | 54.694 | 35.500 | 2.167 |
| 11-merge | 55.594 | 58.594 | 37.667 | 3.000 |
| 12-match | 58.594 | 62.194 | 40.667 | 3.600 |

## Reproduce locally

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v15" node e2e/proof/compose-v15.mjs
uv run e2e/proof/verify-v15.py "$HOME/Downloads/hotpress-v15"
```

Run from the repository root. Existing v13 evidence and v14 metadata are required. Chromium renders only local typography assets with HTTP(S) requests blocked. The verifier requires the completed self-review JSON and never manufactures a review claim.
