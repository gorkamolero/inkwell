# Hotpress demo v11 — one continuous take

Outputs: `~/Downloads/hotpress-v11/`. Final duration **46.566 s** (1,397 frames at 30 fps), 1920×1080, silent H.264 High, yuv420p, faststart. Master video bitrate **7.966 Mbps** (container 7.969 Mbps); web **0.357 Mbps** (container 0.360 Mbps), CRF 22 with `-tune stillimage`.

## Single-take provenance

**One take only. No other take’s footage is used.** Both browser contexts recorded uninterrupted from before the synchronized slate through the final matched state. There were no failed or discarded takes. The scenario began **2026-10-13 05:57:31.352 UTC** and ended **2026-10-13 05:58:20.419 UTC**, lasting **49.067 s** (Costa Rica: October 12, 23:57:31.352–23:58:20.419). Setup and the green sync slate are pre-roll in these same two recording files.

The only footage inputs are `take-1/raw-ana.webm` and `take-1/raw-guest.webm`. Their first post-slate frame is at media time 4.920 s in both files. The opener uses its own recorded pointer motion; it has no replacement editor patch or synthetic pointer. All cuts advance source time; no source ranges overlap or run backward. The final comparison crops both recordings at the same timestamps, as permitted for the match shot. No footage from the latency test is used.

## Shot ranges and every hold

Ranges below are seconds from the scenario start, followed by absolute media ranges in the raw WebM files. Output durations are quantized to 30 fps. All listed holds clone the final captured frame of that shot, from this take. There are no slow-motion segments or other editorial holds. Ordinary pauses inside source footage are included in its range.

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
| 09-offline-start | guest | 32.551–34.118 | 37.471–39.038 | 25.167–26.733 | 0.000 s |
| 10-ana-meanwhile | ana | 34.647–37.477 | 39.567–42.397 | 26.733–29.567 | 0.000 s |
| 09-offline-writing | guest | 37.480–39.695 | 42.400–44.615 | 29.567–31.767 | 0.000 s |
| 10-reconnected | guest | 40.000–40.596 | 44.920–45.516 | 31.767–33.867 | 1.500 s |
| 11-merge | ana | 40.596–45.596 | 45.516–50.516 | 33.867–39.467 | 0.600 s |
| 12-match | both | 45.864–48.964 | 50.784–53.884 | 39.467–42.567 | 0.000 s |

End card: output 42.567–46.567 s, four seconds of generated typography, with no app footage. The opener has a 0.600 s reading hold, avatar arrival 8 frames (0.267 s), same sentence 11 frames (0.367 s), reconnect LIVE 45 frames (1.500 s), and the attributed merge 0.600 s. The join loading animation is not frozen. The reply delivery wait is trimmed before the receiving count change.

The reconnect cut ends at source 40.596 s, then freezes its real LIVE frame. The Ana merge cut begins at exactly 40.596 s; her receiving pixels change at 40.896 s. This preserves the v10 LIVE reading beat while eliminating the old overlapping reconnect insert. The merge close-up lasts 5.600 s including its listed hold; the match lasts 3.100 s.

## Choreography and review

Production recorder: `portfolio-v11.spec.ts`, derived from v8 choreography. Guest identities are rerolled until blue and free of Editor, Writer, and Scribe; this take uses **Quiet Narrator**. Both writing, concurrent sentence edits, selection/comment, guest hover/open/reply, Ana receiving the reply, actual socket disconnection, Ana writing meanwhile, reconnect, whole-sentence merge and matching final Lexical states all passed in this take.

The v10 crops, Inter pills, curly apostrophes, screen tags, paired blue/green attribution chips, stacked match spacing and end-card wording are preserved. The new source events determine the cuts; there are no hard-coded timestamps from older takes.

Inspected all 23 final two-second samples at full 1920×1080, and all 23 corresponding 390 px images in the four phone review sheets. Also reviewed the offline-start named frame and reconnect transition sheet. Text and screen attribution remain readable; no duplicate identity labels, clipped discussion UI, raw interpolation strings, or document text beneath captions were found. Loading and reply delivery waits were shortened; the remaining holds serve opener, state recognition and merge reading beats. The match has at least **55 px** clear above the caption across all frames. This is the agent’s visual review, not a claim of an external reviewer’s approval.

## Measurement and verification

Fresh v11 measurement: **116.4924165 ms median of 30 edits**, rounded to **about 0.1 s** on the end card. Wording: “Edits reach the other writer in about 0.1 s”, “median of 30 edits”, “Tested end to end against Liveblocks”. Measurements use Node monotonic input-to-remote-DOM timing and include automation overhead. All ten comment attempts also passed. Evidence: `suite/latency.json`.

Production build (`NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build`) passed; recording and measurement ran on `pnpm start` with `HOTPRESS_PROOF_PRODUCTION=1` and the existing configured production Liveblocks credentials. Existing loaders handled environment files automatically; none were opened, printed or edited. Browser routes blocked hotpress.app. No push, deploy or hotpress.app calls. Application `tsc --noEmit` passed. Recorder lint has only inherited explicit-any warnings, no errors.

Both final videos passed complete FFmpeg decoding, dimensions/frame-rate checks, faststart checks, and SHA-256 generation. `verify-v11.py` checks source identity, chronological nonoverlapping ranges, equal final document states, all holds, fresh median, match spacing, exact cleanup-manifest equality and the free port. Evidence: `v11-metadata.json`, `v11-delivery-verification.json`.

## Exact-room cleanup

Only these two recorded rooms were created, deleted and independently verified GET 404:

- `xlj3m5qq67cp54nq5xdylkoa` — successful continuous take.
- `m5ymn3x39wur08nwyefj1ymf` — fresh latency measurement.

No discarded takes or untracked rooms. No remote room enumeration. Exact local proof sessions/users were removed by the existing teardown. Evidence: the two `rooms-*.jsonl` manifests, teardown logs, and `cleanup-verification-v11-cleanup.json`. The owned production server was stopped and **port 3847 is free**. Duplicate capture files and intermediate shot videos were removed after verification; final raw recordings, deliveries and evidence remain outside git.

## Reproduce

Use `playwright.v11.config.ts` to run the recorder, latency test and explicit-manifest room verifier separately, each with its own output directory/run ID. Never combine a failed take with a later one. Recompose the successful take with:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v11" node e2e/proof/compose-v11.mjs
python3 e2e/proof/verify-v11.py "$HOME/Downloads/hotpress-v11"
```
