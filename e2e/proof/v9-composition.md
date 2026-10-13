# Hotpress demo v9 — composition only

Delivery: `~/Downloads/hotpress-v9/`. Duration 43.766 s, 1920×1080, 30 fps.
Master video bitrate 7.964 Mbps (container 7.967 Mbps); web 0.408 Mbps
(container 0.411 Mbps), CRF 22 with `-tune stillimage`. Both are H.264,
yuv420p, faststart, silent, and pass a complete FFmpeg decode.

## Changes from v8

1. The first guest tag now interpolates to `Guest's screen (Quiet Storyteller)`.
   Every generated text asset is checked for unresolved `${` before rendering;
   the visible-string manifest is saved in `v9-metadata.json`. A syntax-tree
   scan found no ordinary string with `${` except the guard itself. All final
   captions, tags, and attribution chips were visually checked.
2. Link: 2.000 s, including a 1.200 s hold on the last real connecting frame.
   Arrival: 1.500 s, including an eight-frame hold, with the real QS avatar
   and the caption `Quiet Storyteller joins Ana`. Reconnect: 1.500 s,
   including a 0.700 s hold on the real LIVE frame. The reconnect cut starts
   at source time 38.764 s, because the captured OFFLINE / RECONNECTING / LIVE
   transition precedes the recorded polling event. No application states
   were fabricated. The accepted sentence hold remains unchanged.
3. All three offline/reconnect shots are reframed to 1800×1012 inside the
   1920×1080 white canvas. Every frame was scanned for the lowest ink in the
   bottom text/caret region: minimum clear space is 53 px for both offline
   shots and 62 px for reconnect, measured to the caption's top at y=967.
4. Removed 1.500 s before offline typing. Frame inspection showed the
   post-popover idle tail is only about 0.3 s, not 1.5 s: the close fade ends
   at source 29.16 s. Cut at 29.26 s, removing eight output frames (0.267 s)
   and preserving the reply's reading time. The end card remains 4 s.
5. End card: `Edits reach the other writer in about 0.1 s`, with the smaller
   line `median of 30 edits, measured end to end`, followed by
   `Tested end to end against Liveblocks` and `hotpress.app`. Reuses v8's
   measured median, 118.892 ms; no new measurement is claimed.
6. Transition QA caught a one-frame blank at the start of the stacked
   comparison. Resetting its input timestamps makes real footage visible
   from its first frame. The comparison layout and content are unchanged.

## Provenance and checks

Uses v8's existing Ana and Quiet Storyteller recordings and the same accepted
opening referenced by v8 metadata (stored in the v6 take directory).
No recording, server, rooms, production calls, push, or deploy. No environment
files opened, printed, or edited. Composer browser blocks HTTP(S) requests.
Port 3847 checked free before and after. No v9 room cleanup is needed because
zero rooms were created or accessed. Existing v8 cleanup evidence remains
in the v8 delivery; it was not re-run or represented as a new verification.

Reviewed all 22 final two-second samples at full 1920×1080 and 390 px width,
plus the join, arrival, reconnect and receiving transitions. Delivery includes
named frames, poster, contact sheet, four phone review sheets, full-size and
phone transition frames, four phone transition sheets, metadata, and delivery
and spacing verification JSON. Syntax and Biome formatting checks passed.
No app changes, so recording/integration tests were not re-run.

## Recompose

Run from the repository root with existing dependencies and FFmpeg:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v9" \
HOTPRESS_V8_SOURCE="$HOME/Downloads/hotpress-v8" \
node e2e/proof/compose-v9.mjs
```

Retain v8 raw footage, scenario and latency JSON, v8 metadata, and its referenced
opening source. Delivery media stays outside git. Recomposition regenerates
shot intermediates; remove those after final verification, preserving final
exports and review evidence.
