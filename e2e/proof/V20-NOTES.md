# Hotpress demo v20 — both join pointers and smooth comment zooms

Delivery: `~/Downloads/hotpress-v20/`. **55.467 seconds**, 1920×1080, 30 fps, silent H.264 High/yuv420p, faststart. Master, web MP4, poster, contact sheet, representative frames, two-second frames, phone set, quarter-second samples, cut samples, metadata and verification JSON are all named v20.

## Provenance

All action footage is **new take 3 only**, captured continuously from **2026-10-13T08:45:41.568Z** through **2026-10-13T08:46:42.905Z**, a 61.337-second scenario. Both native **1744×1600** streams use lossless CDP PNG capture, Chromium `--force-device-scale-factor=2`, context device scale 2, and CDP scale 1. Lossless VP9 sources are assembled from the original epoch-stamped PNG stream at 30 fps. Unchanged capture intervals retain real elapsed time; no editorial freeze, slow motion or cloned hold is added.

Raw offsets to the common scenario clock: Ana **1.073550 s**, Swift Author **1.076460 s**. The two-screen shots use the same scenario interval with independent clock offsets. Every selected interval moves forward without overlap. Source hashes are recorded by the delivery verifier. No v13–v19 footage or old latency result is used.

Production build ID: `f_plGmA0ep0tF90BUkUJr`, application commit `b6a2d660a71887eed42d6738357bf8bfb69c2127`. Build: `NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build`; owned server: `HOTPRESS_PROOF_PRODUCTION=1 pnpm start`. Proof config also enables production cookies. Automatic environment loading was retained; no env file was opened, printed or edited. No secrets were printed. Browser routes abort hotpress.app and its subdomains. No push, deployment, publication or hotpress.app request.

Take 1 failed before the join because the test invocation lacked the production-cookie flag; it contributes no footage. Take 2 passed the scenario but was replaced so Ana closes the reply before pulling back and the product-assigned Swift Author name retains the reviewed header geometry. The recorder selects a genuine blue Swift Author guest identity through the existing product identity function; it does not relabel recorded pixels. Take 3 is the only delivery source.

## Shot table

Scenario ranges are relative to take 3 start. Raw ranges are scenario ranges plus the selected stream's offset above. Output ranges are frame-quantized. All holds are zero.

| Shot | Screen | Scenario seconds | Output seconds | Maximum upscale | Hold |
|---|---|---:|---:|---:|---:|
| 01-alone | ana | 0.001–2.500 | 0.000–2.500 | 1.055556× | 0 |
| 02-link | guest | 3.672–6.004 | 2.500–4.833 | 1.055556× | 0 |
| 02-arrival | ana | 6.004–8.314 | 4.833–7.133 | 1.055556× | 0 |
| 03-ana-writing | ana | 8.314–11.351 | 7.133–10.167 | 1.056471× | 0 |
| 03-guest-writing | guest | 11.351–15.360 | 10.167–14.167 | 1.056471× | 0 |
| 04-sentence | ana | 17.154–21.661 | 14.167–18.667 | 1.111111× | 0 |
| 05-comment | ana | 22.506–30.028 | 18.667–26.200 | 1.250000× | 0 |
| 07-guest-reply | guest | 32.110–36.294 | 26.200–30.400 | 1.130326× | 0 |
| 08-ana-reply | ana | 38.237–43.826 | 30.400–36.000 | 1.130326× | 0 |
| 09-offline-start | guest | 44.921–46.535 | 36.000–37.600 | 1.055556× | 0 |
| 10-ana-meanwhile | ana | 47.063–49.898 | 37.600–40.433 | 1.056471× | 0 |
| 09-offline-writing | guest | 49.903–52.425 | 40.433–42.967 | 1.055556× | 0 |
| 10-reconnect | both | 52.425–55.092 | 42.967–45.633 | 0.635789× | 0 |
| 11-merge | ana | 55.092–57.325 | 45.633–47.867 | 1.055556× | 0 |
| 12-match | both | 57.325–60.925 | 47.867–51.467 | 0.635789× | 0 |
| End card | generated typography | — | 51.467–55.467 | — | 4 s graphic |

## Changes and carried fixes

**Join, 2.500–7.133 s:** Swift Author's loaded screen is shown first. Ana's genuine green arrow and “Ana” pill glide through blank space below the lantern line; the next shot shows Swift Author's blue arrow and pill moving on Ana's screen. Both paths use smoothstep speed and a sinusoidal bend. The join caption starts only after the guest editor, LIVE badge and synchronized document are ready. Pixel checks measure both pill heights and horizontal/vertical movement. Neither pointer covers document words.

**Zoom in, 18.667–19.467 s:** Ana's comment shot starts at full-document framing, then uses a 0.8-second smoothstep camera move into the v19 comment crop, before the selection gesture starts at output 19.672 s. Selection is complete at 20.861 s; its caption starts there. Ana types the complete question, clicks Send, and her native pin remains visible before cutting to the guest.

**Zoom out, 35.167–35.967 s:** after Ana reads the reply and closes the popover, a 0.8-second smoothstep camera returns to the full-document framing. The last recorded frame reaches that exact framing before the 36.000 s cut to the guest's OFFLINE view. Guest hover/reply and Ana's reply reading retain v19's complete-line close-up.

Camera sampling uses **floating-point inverse affine bicubic resampling**, with sub-pixel coverage at the moving window bounds. It never rounds a crop origin or size per frame. Whole peripheral header, toolbar and context-line bands briefly fade before crossing the aperture, preventing half-icons or word/caret fragments during the zoom; the anchor, pin, composer and reply are never redrawn or moved independently. Blank native right-edge padding carries over from v19. Every transform and context-band opacity is in metadata. The verifier independently estimates affine motion from encoded glyph pixels with SIFT/RANSAC and compares consecutive scale/translation against the curve, including monotonic direction and eased endpoints. Maximum source upscale is **1.25×**.

The comment and reply geometry, ≥34 px body / ≥24 px author thresholds, 4.5-second same-sentence shot, moving opener, Send/pin reading time, inline 30 px merge labels and sentence tints, intact 38.12 px two-screen body text, OFFLINE hold, caption timing and end-card URL carry over from v19. This fresh-run verifier replaces old-take hash/timestamp equality with new capture/measurement evidence while retaining the meaningful pixel, source, encoding and cleanup checks. A negative-control crop through a real delivered word verifies that the edge detector still rejects fragments. Dynamic edges exclude only their one-pixel antialias boundary before scanning the inner eight pixels; no icon exclusions are allowed.

## Goal checklist — every section 2 item

The framing amendment in section 2 applies: one screen follows the action; two screens appear where comparison matters. “Pass” here means local delivery evidence, not external approval or publication.

| Section 2 item | Output timestamps / evidence | What the frames show / status |
|---|---|---|
| 1920×1080, 16:9, calm backdrop; amended camera-following framing and named screen tags | 0.000–51.467; match 47.867–51.467 | Native windows on the inherited dark backdrop; Ana’s / Swift Author’s screen tags. Two intact windows for reconnect and match. The earlier decorative three-dot browser treatment is not reintroduced; the accepted v19 framing is retained. |
| Choreography: one focal action at a time | Entire action sequence | Join pointers in sequence, separate-paragraph writing, simultaneous same-sentence edits, selection/comment, reply, offline/reconnect. |
| Human curved pointer glides with eased speed and pauses | 2.500–4.833, 4.833–7.133 | Green Ana pointer on guest screen, then blue Swift Author pointer on Ana screen, both over blank document space. |
| Smooth zoom in for comment and back out; readable pin/popover/reply on a phone | 18.667–19.467 and 35.167–35.967; reading 21–34 s | Continuous 0.8 s eased camera moves; v19 close-ups preserve the full anchor line and native cards. |
| Step 1: guest joins by link and both pointers appear | 2.500–7.133 | Guest page is loaded and LIVE before the caption; both real pointers visibly glide on the other screen. Navigation to the real created share path is recorded in the scenario. No synthetic URL bar or share-link graphic is added. |
| Step 2: both write at once, each with caret/name | 14.167–18.667; context 7.133–14.167 | Simultaneous typing adds “old ” and “just ”; Ana's native caret and Swift Author's named remote caret are separated. Ana is identified by her screen tag; her native local caret has no synthetic name flag. |
| Step 3: edit the same sentence at two places | 14.167–18.667 | Both insertion positions are visible, with 4.5 s to read the completed sentence. |
| Step 4: Ana selects a phrase, comments, pin on both screens | 19.672–26.200; guest from 26.200 | Phrase selection, composer text, Send activation, own green pin, then the corresponding guest-side pin and hover preview. |
| Step 5: guest opens pin, replies, Ana sees reply | 26.200–35.167; received reply readable around 32.129–33.629 | Guest hover/Discussion/reply entry and Send; Ana's Discussion shows both authors and the exact reply. Captions start after the corresponding visible action. |
| Step 6: guest offline writing and merge | 36.000–47.867 | OFFLINE appears before “Meanwhile”; guest finishes locally. Two-screen reconnect shows 1.5 s OFFLINE, then LIVE, then Ana receives the whole line. Tints and inline attribution pills distinguish the edits. |
| Refined Inter captions, soft pills and fades | Throughout | Event-gated captions, names consistent with the product, no caption during RECONNECTING. |
| End card uses only this run's measured numbers | 51.467–55.467 | “about 0.1 s”, median of 30 edits, measured against this production build; hotpress.app. |
| One continuous take, 45–65 s; no errors/test chrome/spliced steps | 0.000–55.467; source manifest and hashes | 55.467 s. All action is take 3, forward-only intervals, no editorial freezes or overlapped source ranges. |
| Claude reviews a frame from every step and records findings | This notes table and local review assets | **Not claimed:** this run has Codex self-review, not Claude approval. Frames and explicit findings are supplied for that gate. |
| Independent fresh-eyes reviewer scores framing, legibility, pacing, polish and claims | — | **Not performed in this self-review task.** No independent approval is fabricated. |
| Re-record until nothing remains to fix | Takes 1–3; final self-review and verification | Two takes rejected/replaced; final delivery uses only take 3. Rendering fixes were iterated without combining takes. |
| Publish after review and send video/contact sheet | Local master, web version and contact sheet | **Publication intentionally not performed:** this request explicitly forbids push/deploy/hotpress.app calls. v19 remains published. |

## Measurement, verification and review

Fresh edit median: **118.6105625 ms**, p95 **250.306625 ms**, over **30 edits**. All **10 comment attempts passed**. Method: Node monotonic input-dispatch to remote DOM observation, including automation overhead; not a server-only benchmark. Real reconnect-to-DOM arrival: **Ana 570 ms**, **Swift Author 491 ms**. Complete measurement: `suite/latency.json`.

Final visual checks **PASS**. All **1,544 action frames** pass the crop-edge scan; the edge regression control rejects a deliberately clipped real word. Both native pointer pills measure **at least 62 px** high; tracked horizontal travel is **878.5 px for Ana** and **947.5 px for Swift Author**. Own-pin reading time is **1.567 s**. Comment body glyph ink is **53 px** in the composer and **48 px** in Discussion; reply body **46 px**; both author names **30 px**. Match body size is **38.1215 px**.

Both zooms contribute **24 measured consecutive frame transforms**. Maximum encoded position-fit error is **0.09230 px** on zoom in and **0.08432 px** on zoom out. Scale and position are monotonic with eased endpoints, and the final zoom-out frame is exactly full-document framing. OFFLINE lasts **45 frames / 1.500 s** in the split; LIVE first appears at split frame **57 / output 44.867 s**, and Ana's complete line lands at frame **63 / output 45.067 s**, 0.200 s later. The online caption begins fading on LIVE. Maximum identical source-state run in the opener is **0.567 s**.

TypeScript checking passes. Biome reports no errors; inherited explicit-any warnings remain. Final verifier results and exact encoded-pixel measurements: `v20-delivery-verification.json`. It checks source PNG dimensions/timestamps/duration and hashes, single-take chronology, zero editorial holds, upscale, badge/caption/arrival pixels, both join pointers, every-frame edge clearance, match paragraphs, comment geometry/text, pin duration, annotation timing/positions/text, opener motion, URL, encoding, fresh latency, exact cleanup, port state, zoom curve and rendered zoom motion.

Self-review inspected every all-cut sample (128 per size) in native-resolution and native 390 px sheets, including quarter-second samples through both zooms. Full-size raw join pointers, selection, completed composer, received reply and flagged edge frames were also inspected. There are additionally 261 generated quarter-second samples across all shots; generation is not represented as visual inspection of every optional sample. Review record: `v20-self-review.json`. This is self-review, not independent approval.

## Exact-room cleanup

Exactly these four created rooms were deleted and each individually verified by GET 404, including both unused takes. No room listing or bulk deletion:

- `tk2z2vdh8lfipit56bku28gs` — rejected take 1.
- `ewwna1vk3l8msjwl6f7a4qht` — replaced take 2.
- `rl2a7fi5dlcd85zceoaevl4o` — accepted take 3.
- `bg64gli6ampvcivb8qnaiag2` — fresh latency suite.

Evidence: `cleanup-verification-v20-cleanup.json`, exact creation manifests, per-run cleanup logs. Local fixture users/sessions were removed. The owned server was stopped and port **3847 is free on IPv4 and IPv6**. Final media and raw audit evidence remain outside git. Temporary shot/camera encodes and inspection scratch files are removed after verification.

## Reproduce

Start the production build/server as above. For each take use a unique output directory and run ID:

```sh
HOTPRESS_PROOF_PRODUCTION=1 HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v20/take-N" HOTPRESS_PROOF_RUN_ID=v20-take-N pnpm exec playwright test --config=playwright.v20.config.ts portfolio-v20.spec.ts
```

Run `collaboration-latency.spec.ts` with the same config into `suite/`. Supply every exact creation manifest to `verify-rooms.spec.ts`, using run ID `v20-cleanup` and root output. Stop the owned server. Compose and verify:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v20" HOTPRESS_TAKE=take-3 node e2e/proof/compose-v20.mjs
uv run e2e/proof/verify-v20.py "$HOME/Downloads/hotpress-v20"
```

The verifier requires a real completed self-review JSON; it does not manufacture an approval. Commit only explicit recorder/helper/config/composer/camera/verifier/notes source paths, never the output directory or videos.
