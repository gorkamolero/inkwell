# Hotpress demo v17 — reconnect as an event, take 7 only

Delivery: `~/Downloads/hotpress-v17/`. **50.767 seconds**, 1920×1080, 30 fps, silent H.264/yuv420p, faststart. Includes master, web copy, poster, contact sheet, representative frames, two-second samples, phone sheets, transitions, quarter-second samples, metadata, self-review, composition source and verifier. Baseline: v16, commit `98a2924`.

## Source changes

All times below are seconds from take 7 start, not raw-container timestamps. The existing recording offsets are Ana **1.114729166 s**, guest **1.112500191 s**. Both sides of the reconnect and match use the same take timestamp, real windows and one contiguous crop per window.

| Shot | Source interval | Output interval | Change |
|---|---|---|---|
| 01-alone | 0–2.500 | 0–2.500 | Extended from 1.585 s. Captured caret motion continues after 1.585; longest identical source run is 0.533 s. The next shot still starts at source 2.943. |
| 05-comment | 21.436–28.497 | 18.067–25.133 | Extended by 0.800 s with real footage. Send is logged at 26.897; the pin first appears around 26.93 and remains for **1.567 s**. Next shot remains source 32.677. |
| 10-reconnect | 54.794333–56.361 | 39.367–40.933 | New 1.567 s two-screen shot. Starts 0.500 s before OFFLINE disappears and ends 0.600 s after Ana’s line lands in the delivered frame sequence. |
| 11-merge | 56.361–58.594333 | 40.933–43.167 | Ana close-up continues immediately from reconnect’s endpoint to the original v16 endpoint. Larger attribution pills on separate blank lines. |
| 12-match | 58.594333–62.194333 | 43.167–46.767 | Original source interval and layout; shared crop right edge moved clear of whole controls. |

The original four-second graphic end card follows unchanged. All other source intervals, framing, captions and content remain v16, allowing only derived timeline offsets.

## Reconnect timing: event log and pixels

Take 7’s `portfolio-scenario.json` logs reconnect requested at **55.261**, arrival confirmation at **56.125**, LIVE confirmation at **56.132**, and merged confirmation at **56.141**. Those latter entries are scenario confirmations, not first visible frames. `both-merge-observations.json` first observes the town line on Ana at **55.747**.

A 30 fps raw guest pixel scan anchored to the reconnect request finds OFFLINE departure at **55.294333**, and first green LIVE at **55.594333**. The actual native sequence is **OFFLINE → RECONNECTING… → LIVE**; v17 preserves the intermediate state.

Within the delivered reconnect shot, frames **0–14** show OFFLINE; frames **15–23** show RECONNECTING; frame **24** first shows LIVE (**source 55.594333 / output 40.166667**). Ana’s line is absent through frame 28 and complete from frame **29** (**source 55.761 / output 40.333333**). Five frames separate LIVE and the visible line. Pixel times have one-frame sampling precision and include the source-to-output frame sampling; an independently anchored source scan finds the line around 55.73 s.

Caption: “Swift Author is back online. Both edits merge.” Its 0.25 s fade starts at reconnect local **0.800 s**, exactly the first LIVE frame. No caption pixels precede LIVE. It continues across the cut to Ana without restarting.

## Crops and attribution

Reconnect and match both use source rectangle **[8,8,1448,950]**, ending at **x=1456**, rendered **920×604** at **(20,130)** and **(980,130)**. Scale is approximately **0.636×**, with only integer raster rounding. Body text remains **38.12 px** by the inherited source metric. Ana’s copy icon occupies source x=1413–1442 and is completely retained. The guest copy icon starts at x=1456 and is completely excluded. The same edge clears the OFFLINE, RECONNECTING and LIVE headers. There are **no icon exclusions** in v17’s edge-fragment scan.

Attribution font increases from 30 to **40 px CSS**, with **38 px actual glyph ink** in the rendered assets (encoded measurements are recorded by the verifier). Both pills start at output x=110, each on its own blank line: Ana y=649.5–714.5; Swift Author y=798.5–863.5. They cover neither document text nor the native pin. The original sentence tints remain. Ana’s annotation fades from close-up local 0; Swift Author’s from local 0.6. Both appear after the line has landed, and each remains for at least 1.5 s including its fade.

## Verification and review

`verify-v17.py` **PASSES**. All **1,403 encoded source-shot frames** pass the crop-edge scan (both windows where applicable), with zero edge-fragment pixels and no icon exceptions. Both attribution pills measure **38 px encoded glyph height**; pin duration is **1.567 s**.

The verifier retains the v16 provenance/hashes, chronology, zero editorial holds, scale, badges, merge arrival, match paragraphs, local latency/cleanup evidence, encoding, popover/envelope, typography, annotation, heading, URL and edge regression checks. Version-specific equality assertions now compare by shot name against v16 and allow only the requested changes. Reconnect arrival proof moves into the new two-screen shot, and pill-placement assertions reflect their required blank lines.

Additional delivered-pixel checks confirm badge progression, missing/present Ana line, caption fade timing, pin duration and actual pill glyph size. The all-frame edge scan checks both reconnect windows and both match windows with no icon exception. The rejected v15 fragment remains the regression control.

Agent self-review inspected all **80 quarter-second samples**, including adjacent boundaries, for the five changed shots at full 1920 width and native 390 width. `v17-changed-review/` contains 20 sheets with full-size tiles, seven phone sheets and the exact sample manifest. The full inherited sampling set is also included. This is agent self-review, not a separate fresh-eyes reviewer.

## Constraints and reproduction

Only existing take 7 media and local evidence were used. No recording, rooms, server, calls to hotpress.app, push, deployment or env-file access. Port 3847 remains free on IPv4 and IPv6. No editorial footage freezes or speed changes. Maximum upscale remains 1.25×. Final media and review evidence remain outside git; temporary shot encodes are removed after verification.

From the repository root:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v17" node e2e/proof/compose-v17.mjs
uv run e2e/proof/verify-v17.py "$HOME/Downloads/hotpress-v17"
```

Existing v13 take/evidence, v14/v15/v16 metadata, v16 verification and the v15 regression-control master are required. Typography uses local Chromium with HTTP(S) blocked. Verification requires the completed self-review JSON.
