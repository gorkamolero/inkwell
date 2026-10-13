# Hotpress demo v19 — hold OFFLINE before reconnect

Delivery: `~/Downloads/hotpress-v19/`. Baseline: accepted v18, commit `801a8cf`.
50.867 seconds, 1920×1080, 30 fps, silent H.264/yuv420p, faststart.

Only the guest offline-writing end, split start, and their caption continuity change.
All other source ranges, crops, overlays, merge attribution pills and fades, match,
comment framing and end card retain v18. Removing the old 0.100333 s source gap
adds three output frames (0.1 s).

| Shot | Take-7 source range | Output duration |
|---|---|---|
| 09-offline-writing | 52.515–53.794333 s | 1.266667 s |
| 10-reconnect | 53.794333–56.361 s | 2.566667 s |
| 11-merge, unchanged | 56.361–58.594333 s | 2.233333 s |

Trade-off: preserving the preceding Ana shot leaves only 1.279333 s of source
for the guest single-screen shot (1.266667 s at 30 fps). Its inherited 0.25 s
caption fade remains; its outgoing fade is removed. The requested 1.5 s split
OFFLINE hold takes priority over 1.5 s single-screen typing.

The split shows the guest finishing “slowly.” while Ana has no town sentence.
“Offline. Still writing.” continues across the cut, fully visible for the 45
OFFLINE frames (1.500 s), then disappears on the first RECONNECTING frame.
The online/merge caption begins its inherited 0.25 s fade at the first LIVE
frame, frame 54 (1.800 s into the split). No caption is shown during reconnecting.
The first LIVE frame has zero fade opacity, as in v18.

`verify-v19.py` PASSES: all 1,406 source-shot frames pass the edge scan, and all
67 merge frames pass the attribution checks. Maximum upscale is 1.25×.

`verify-v19.py` retains the v18 provenance, chronology, encoding, badge progression,
arrival, latency, local cleanup evidence, port, popover, text, heading, URL,
all-frame crop-edge, regression-control and attribution checks. It extends the
rendered badge scan to measure the continuous OFFLINE hold, compares offline
caption glyphs against the asset throughout that hold, checks its removal, and
checks online-caption pixels before and after LIVE. Exact v18 metadata and PNG
comparisons permit only the two intended shot changes and shifted output times.

All 21 quarter-second samples of the two changed shots, including surrounding
boundaries, were visually reviewed at 1920 px and 390 px. Review records and
phone sheets are included with the full inherited delivery set.

Reproduce locally:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v19" node e2e/proof/compose-v19.mjs
uv run e2e/proof/verify-v19.py "$HOME/Downloads/hotpress-v19"
```

Existing take-7 evidence and accepted v14–v18 references are required. Chromium
renders embedded local assets with HTTP(S) blocked. No recording, rooms, server,
hotpress.app calls, push, deployment or env-file access. Port 3847 remains free.
Videos stay outside git; intermediate shot encodes are removed after verification.
