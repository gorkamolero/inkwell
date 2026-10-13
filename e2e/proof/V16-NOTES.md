# Hotpress demo v16 — complete comment context, take 7

Delivery: `~/Downloads/hotpress-v16/`. Duration **48.267 seconds**, 1920×1080, 30 fps, silent H.264/yuv420p with faststart. Includes master, web copy, poster, contact sheet, representative frames, two-second samples, phone review sheets, transitions, quarter-second samples, metadata, review and verification, all named v16.

Only `07-guest-reply` and `08-ana-reply` framing changes from v15 (f4ae5bd). Both share the same static crop throughout hover, opening, typing and received reply. Ana’s `05-comment` already contains the entire line and remains unchanged at 1.25×. All source ranges, cuts, durations, captions, annotations, match view and end card remain as v15. No freezes or speed changes.

## Framing and measured text

The shared virtual source crop is `[50,592,1700,798]`, rendered at 1920×902 at `(0,24)`. Actual crop is `[50,610,1686,780]`, padded with 18 white source pixels above and 14 on the right to exclude the preceding line and native window edge. No text or UI is redrawn or relocated.

Scale is **1.129412× horizontally / 1.130326× vertically** (integer raster rounding), below the 1.25× limit. This fills the frame width while retaining the full “A lantern glowed. Light warmed the quay.” line, its native pin, and complete hover/Discussion border and shadow. The conservative full-line envelope starts at source x=72; line left clearance and popover right clearance are **24.847 px**, pin top clearance **24.867 px**, and Discussion bottom clearance **24.867 px**. This leaves less than one output pixel beyond the requested margin at the limiting edges.

Actual encoded glyph-ink measurements at 1920 width:

| Text | Pixels | Equivalent at 390 |
|---|---:|---:|
| Composer body, unchanged | 53 | 10.77 |
| Discussion comment body | 48 | 9.75 |
| Discussion reply body | 46 | 9.34 |
| Ana author | 30 | 6.09 |
| Swift Author author | 30 | 6.09 |
| Discussion heading | 30 | 6.09 |

Body text exceeds 34 px and author names exceed 24 px. The unchanged native “New comment” label measures 21 px, as in v15.

## Verification and visual review

`verify-v16.py` **passes** all inherited v15 checks, with complete-line clearance replacing selected-phrase-only clearance. Direct metadata comparison against v15 permits only the two reply framings and their derived fields to change. Provenance, hashes, chronology, zero holds, scale limit, badges, merge arrival, match paragraphs, original local latency/cleanup evidence, encoding, annotation timing, heading clearance and end-card URL remain verified.

The new edge-fragment check scans **all 1,328 encoded frames of all 14 source shots**, including both windows in the match shot. It requires zero text pixels within the 8 px inner band along all four crop edges. It detects dark/gray glyph ink, removes long native straight rules, and explicitly excludes only the known non-text copy-outline icon at the right edge of Ana’s unchanged match header (local box `[908,18,920,44]`). Header text remains checked. The four-second dark end card has no white-window crop; its inherited glyph check remains in place. A regression control confirms the new detector rejects the actual v15 “ed.” fragment.

All 417 source frames across composer and replies retain the inherited popover/envelope checks. Every one of the **36 quarter-second samples** covering changed shots and adjacent boundaries was visually inspected at full 1920 size and 390 px. `v16-changed-review/` contains nine sheets with native-size 1920×1080 tiles and three with native 390 px tiles. The full inherited sample/transition set remains available. This is agent self-review.

## Constraints and reproduction

Only existing v13 take-7 recordings and local evidence were read. No recording, rooms, server, hotpress.app calls, push or deployment. No env files opened, printed or edited. Port 3847 verified free on IPv4 and IPv6. Temporary shot encodes are removed after verification; final media and review evidence stay outside git.

From the repository root:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v16" node e2e/proof/compose-v16.mjs
uv run e2e/proof/verify-v16.py "$HOME/Downloads/hotpress-v16"
```

Existing v13 evidence, v14/v15 metadata, and the v15 master regression control are required. Chromium creates local typography assets with HTTP(S) blocked. The verifier requires an actual completed self-review JSON.
