# Hotpress demo v12 — two composition fixes, same continuous take

Outputs: `~/Downloads/hotpress-v12/`. Final duration **48.166 s** (1,445 frames at 30 fps; edit timeline 48.167 s), 1920×1080, silent H.264 High, yuv420p, faststart. Master video bitrate **7.967 Mbps** (container 7.970 Mbps); web **0.356 Mbps** (container 0.359 Mbps), CRF 22 with `-tune stillimage`.

## Single-take provenance

Recomposed only from the accepted v11 take at `~/Downloads/hotpress-v11/take-1/`, recorded by v11 (baseline commit `87362bc`). **No new recording, rooms, measurement, server, push, deployment or hotpress.app calls.** The output `take-1` is a symlink to that exact original take; it is not a new capture. Copied suite/build/cleanup logs are explicitly inherited v11 evidence, not new executions.

The scenario began **2026-10-13 05:57:31.352 UTC** and ended **05:58:20.419 UTC**, lasting **49.067 s**. Only `raw-ana.webm` and `raw-guest.webm` supply footage, with post-slate starts of **4.920 s** each. Both SHA-256 hashes match `v11-delivery-verification.json` exactly. Every source range advances and none overlap; the two match panels use the same timestamps. No latency-test footage is used.

## Shot ranges and every hold

Ranges are seconds from scenario start, followed by absolute raw WebM media ranges. Output durations are quantized to 30 fps. All freezes clone the shot’s final real captured frame from this take. No slow motion or new freezes were added.

| Shot | Screen | Scenario range | Raw media range | Output range | End freeze |
|---|---|---:|---:|---:|---:|
| 01-alone | ana | 0.000–2.751 | 4.920–7.671 | 0.000–3.367 | 0.600 s |
| 02-link | guest | 2.751–3.820 | 7.671–8.740 | 3.367–4.433 | 0.000 s |
| 02-arrival | ana | 3.820–5.050 | 8.740–9.970 | 4.433–5.933 | 0.267 s |
| 03-ana-writing | ana | 6.307–8.607 | 11.227–13.527 | 5.933–8.233 | 0.000 s |
| 03-guest-writing | guest | 8.607–10.477 | 13.527–15.397 | 8.233–10.100 | 0.000 s |
| 04-sentence | ana | 11.861–12.663 | 16.781–17.583 | 10.100–11.267 | 0.367 s |
| 05-comment | ana | 13.572–18.657 | 18.492–23.577 | 11.267–16.367 | 0.000 s |
| 07-guest-reply | guest | 20.399–24.379 | 25.319–29.299 | 16.367–20.333 | 0.000 s |
| 08-ana-reply | ana | 25.902–30.741 | 30.822–35.661 | 20.333–25.167 | 0.000 s |
| 09-offline-start | guest | 30.941–34.118 | 35.861–39.038 | 25.167–28.333 | 0.000 s |
| 10-ana-meanwhile | ana | 34.647–37.477 | 39.567–42.397 | 28.333–31.167 | 0.000 s |
| 09-offline-writing | guest | 37.480–39.695 | 42.400–44.615 | 31.167–33.367 | 0.000 s |
| 10-reconnected | guest | 40.000–40.596 | 44.920–45.516 | 33.367–35.467 | 1.500 s |
| 11-merge | ana | 40.596–45.596 | 45.516–50.516 | 35.467–41.067 | 0.600 s |
| 12-match | both | 45.864–48.964 | 50.784–53.884 | 41.067–44.167 | 0.000 s |

End card: output **44.167–48.167 s**, four seconds of unchanged generated typography with no app footage. The inherited freezes remain: opener 0.600 s, avatar arrival 8 frames, same sentence 11 frames, reconnect LIVE 45 frames, merge 0.600 s. Reconnect ends at source 40.596 s and the merge begins there; receiving pixels change at 40.896 s. All other shot definitions, captions, tags, attribution, source ranges and holds are unchanged from v11. Later output timestamps shift by the added 1.600 s of real offline-shot footage.

## Fix 1 — complete matching document

The old match row selector omitted source y=337–377, which contains “A lantern glowed. Light warmed the quay.” Both panels now retain four source bands: heading/first paragraph/highlight/pin at y=132–240, boats at y=270–310, lantern at y=337–377 and town at y=405–445. Only blank vertical gutters are removed. These bands all come from the same timestamp in each uninterrupted recording; no text or document state is synthesized.

The 864×228 assembled crop becomes 1468×388, retaining approximately **51 px body type** in the 1920 frame (about 10.4 px at 390 width), above the requested 18 px minimum in the 1920 frame. Both panels visibly show all four complete lines and the highlight/pin. Minimum caption clearance is **83 px**, verified across every match frame. All four paragraph bands contain text in both panels throughout all **93 frames** of the 3.100 s match.

## Fix 2 — establish offline before meanwhile

`09-offline-start` now starts at source **30.941 s** (offline-intro + 0.200 s, after the closing discussion disappears), instead of 32.551 s. It still ends at **34.118 s**, before Ana’s source range **34.647–37.477 s**. The final encoded shot opens with **8 frames of real LIVE**, flips to the real red OFFLINE at output **25.433 s**, then remains OFFLINE for **2.900 s before the Ana cut**. This is continuing real-time footage, not a freeze or composited badge. No red editorial pill is needed.

The take’s own `portfolio-scenario.json` logs actual disconnection at **31.194 s**, badge observation at **31.201 s**, Ana writing at **34.647 s**, and reconnect at **40.200 s**. Thus the guest really is offline during Ana’s entire meanwhile shot. The recorder code confirms that the offline event precedes network emulation and socket closure, and that the badge event follows the visible OFFLINE assertion. Final-video pixel checks confirm the visible LIVE→OFFLINE order independently of event labels.

## Choreography and review

Reviewed the final changed shots at full **1920×1080** and **390 px width**, including the live opening, red badge hold, transition to Ana, and complete match. All four match lines remain legible, the first-line highlight and pin are intact, and the bottom line clears the caption. The tighter paragraph spacing retains the v11 body text scale. Review evidence includes `v12-frames/`, `v12-transitions/`, `v12-transitions-phone/`, and the added offline/meanwhile phone transition sheets. Standard two-second samples, phone sheets, contact sheet and poster are regenerated. This is the agent’s visual review, not external reviewer approval.

## Measurement and verification

The existing v11 **116.4924165 ms median of 30 edits** is preserved, including the unchanged “about 0.1 s” end card. `suite/latency.json` is copied evidence from that measurement, not a new run.

`verify-v12.py`, adapted from `verify-v11.py`, passes: both videos decode completely; 1920×1080/30 fps/yuv420p and faststart; exact v11 source hashes and take timestamps; forward-only nonoverlapping ranges; matching final document states; inherited holds; unchanged other shot definitions; four paragraphs in both panels across every match frame; at least 40 px caption clearance; real LIVE→OFFLINE before Ana with 2.900 s OFFLINE visibility; preserved 45-frame reconnect LIVE freeze; original measurement and cleanup manifests; free port 3847. Evidence: `v12-metadata.json`, `v12-delivery-verification.json`, `verify.log`.

## Exact-room cleanup

No rooms were created or contacted for v12. The copied cleanup manifest records v11’s prior GET 404 results for `xlj3m5qq67cp54nq5xdylkoa` and `m5ymn3x39wur08nwyefj1ymf`. The verifier compares that inherited manifest against the original take and copied suite manifests locally; it performs no remote cleanup requests. **Port 3847 remains free.** Intermediate shot videos and temporary inspection files are removed after verification; raw source, final deliverables and evidence remain outside git.

## Reproduce (composition only)

Keep the original v11 take and v11 verification alongside this output. The v12 composer intentionally binds to the original v11 take; do not run a recorder, server or room test.

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v12" node e2e/proof/compose-v12.mjs
python3 e2e/proof/verify-v12.py "$HOME/Downloads/hotpress-v12"
```
