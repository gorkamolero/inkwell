# Hotpress demo v13 — a new continuous take

Outputs: `~/Downloads/hotpress-v13/`. Final duration **48.267 s**, 1920×1080, 30 fps, silent H.264 High, yuv420p, faststart. Master video bitrate **7.967 Mbps**; web **0.199 Mbps**, CRF 22 with `-tune stillimage`.

## Single-take provenance

**Every action frame comes from take 7 alone.** Its two browser windows were captured continuously from before the synchronized pre-roll slate through the final match. The scenario began **2026-10-13T06:47:05.068Z** and ended **2026-10-13T06:48:07.726Z**, lasting **62.658 s**. Nothing from v11, v12, the latency suite or rejected takes supplies action footage.

There were six rejected takes. Takes 1–4 exposed the comment-mark text-node lookup and native/keyboard selection problems when preparing the offline paragraph. Take 5 passed collaboration but was rejected for the guest flag beneath Ana's caret during separate-paragraph typing. Take 6 passed collaboration but was rejected because the join pointer path fell outside the final crop. Take 7 positions the native DOM selection at the final text node, waits for Lexical to consume selectionchange, and then types with real keyboard events; exact final paragraph assertions pass. It separates the two paragraph edits and places the join pointer glide inside the frame. All seven takes have individual room manifests and cleanup evidence.

Capture is **CDP `Page.startScreencast`, lossless PNG, 1744×1600**, with original epoch timestamps in `take-7/cdp-ana/frames.json` and `cdp-guest/frames.json`. Chromium uses `--force-device-scale-factor=2`, Playwright uses `deviceScaleFactor: 2`, and CDP device metrics retain scale 1. The isolated Playwright `recordVideo` experiment padded 872×800 pixels inside a larger video; it was rejected after 1:1 inspection. Merely setting CDP maximum dimensions was also insufficient; the Chromium device-scale flag produces native 2× content.

The raw videos are lossless VP9 at constant 30 fps, assembled by frame timestamp. CDP emits changed frames; unchanged intervals retain their captured state until the next timestamp or the actual capture stop. Those are recorded wall-clock intervals, not editorial freezes. Original PNG streams, timestamp lists and assembly manifests remain available for audit. The slate is pre-roll only. No synthetic local pointer, URL bar, reconstructed text or application patch is used.

All cuts move forward without overlap. Both match crops use the same scenario timestamps, with each raw stream aligned to the common epoch clock. Ana's raw offset is **1.114729 s**; Swift Author's is **1.112500 s**. Frame quantization is 1/30 s. Full raw-source SHA-256 hashes appear in `v13-delivery-verification.json`.

## Shot ranges and every hold

Scenario ranges are seconds from the shared scenario start. Raw ranges below use the selected screen's offset; the both-screen match uses both offsets independently against the same scenario range. Output ranges are frame-quantized. **No editorial freeze, cloned end hold or slow motion is used anywhere.** The final match's reading time is real captured time. Only the end card is generated still typography.

| Shot | Screen | Scenario range | Raw media range | Output range | End freeze | Maximum upscale |
|---|---|---:|---:|---:|---:|---:|
| 01-alone | ana | 0.000–1.585 | 1.115–2.700 | 0.000–1.600 | 0.000 s | 1.0556× |
| 02-link | guest | 2.943–4.419 | 4.056–5.532 | 1.600–3.067 | 0.000 s | 1.0556× |
| 02-arrival | ana | 4.419–6.778 | 5.534–7.893 | 3.067–5.433 | 0.000 s | 1.0556× |
| 03-ana-writing | ana | 6.778–9.939 | 7.893–11.054 | 5.433–8.600 | 0.000 s | 1.0565× |
| 03-guest-writing | guest | 9.939–14.031 | 11.052–15.144 | 8.600–12.700 | 0.000 s | 1.0565× |
| 04-sentence | ana | 16.060–20.535 | 17.174–21.650 | 12.700–17.167 | 0.000 s | 1.1120× |
| 05-comment | ana | 21.436–27.697 | 22.551–28.812 | 17.167–23.433 | 0.000 s | 0.8681× |
| 07-guest-reply | guest | 32.677–36.989 | 33.790–38.102 | 23.433–27.733 | 0.000 s | 0.8681× |
| 08-ana-reply | ana | 41.933–45.262 | 43.048–46.377 | 27.733–31.067 | 0.000 s | 0.8681× |
| 09-offline-start | guest | 47.505–49.121 | 48.618–50.234 | 31.067–32.667 | 0.000 s | 1.0556× |
| 10-ana-meanwhile | ana | 49.675–52.511 | 50.790–53.626 | 32.667–35.500 | 0.000 s | 1.0565× |
| 09-offline-writing | guest | 52.515–54.694 | 53.628–55.807 | 35.500–37.667 | 0.000 s | 1.0556× |
| 11-merge | ana | 55.594–58.594 | 56.709–59.709 | 37.667–40.667 | 0.000 s | 1.0556× |
| 12-match | both | 58.594–62.194 | 59.709–63.309 | 40.667–44.267 | 0.000 s | 0.5208× |

End card: **44.267–48.267 s**. The sentence lasts **4.467 s**, the merge **3.000 s**, and the final match **3.600 s**. The cut into the sentence excludes the residual setup pointer, retaining over one second before typing. Both match inputs reset their selected PTS to zero, preventing a blank first frame.

## Choreography and review

The final guest identity is **Swift Author**, as assigned by the product. Captions and tags use that name consistently. The only overlays are the dark frame, screen tags, captions (including two dark editorial merge attributions), and end card. The match uses two intact rectangular camera crops; no strip-stacking or removed paragraph gutters.

Review evidence: `v13-frames/`, `v13-every2s/`, `v13-phone/`, `v13-transitions/`, `v13-transitions-phone/`, the contact sheet, four phone review sheets and fifteen phone transition sheets. Every cut, including the end card, has samples at −0.75, −0.50, −0.25, −1/30, 0, +0.25, +0.50 and +0.75 s: **120 cut samples at full resolution and 390 px**. Reviewed all transition sheets, all two-second phone sheets, and the critical full-resolution join, sentence, Send, discussion, merge and match frames. This is agent self-review, not external reviewer approval.

### 1. Crisp text

Native 1744x1600 PNG screencast pixels, timestamp-assembled at 30 fps. The Playwright 2x experiment only padded 1x content and was rejected. Largest final source upscale is 1.1112x; enlarged 30 CSS px body type retained.

### 2. Opener

The 0.75 s sample shows Ana's caret at the lantern line. The opener lasts 1.60 s; the native caret moves and Ana enters/removes a space before the join.

### 3. Join

The first guest frame is fully loaded with Ana's avatar and LIVE. The following Ana shot shows the real Swift Author pointer gliding left to right below the text; its complete blue name pill stays inside the crop. No loading or CONNECTING frame is selected.

### 4. Names

Swift Author is the product-assigned identity in this take. The contiguous join caption reads “Swift Author joins through the share link”; every screen tag and attribution uses Ana or Swift Author, never Guest.

### 5. Pointers and flags

Separate-paragraph edits happen sequentially, avoiding a guest flag directly beneath Ana's caret. Pointers park in empty margins. The sentence cut starts eight frames after the setup event to omit a residual pointer on “dawn”. Same-sentence carets are horizontally separated; flags remain above their own positions.

### 6. Same sentence

The sentence shot is 4.467 s of real capture. Caret positions are established 1.136 s before typing; Ana's native caret blinks. Both insertions use 380 ms key spacing. The complete sentence remains for 1.404 s after the last typing event.

### 7. Comment

Ana's shot includes the completed composer, Send activation, composer dismissal and her own pin, followed by 0.8 s of real pin footage. Only then does the edit cut forward to Swift Author's pin, hover card and discussion.

### 8. Popovers

The anchor is “Light warmed the quay” in the last existing paragraph. The selection toolbar is above that phrase; the composer, preview and discussion open below it over blank space. The highlighted phrase and discussion text remain visible.

### 9. Offline

The first offline shot opens on the red OFFLINE badge and the first typed letter. Typing is dispatched at the badge observation, 7 ms after disconnection; the OFFLINE shot lasts about 1.6 s before the meanwhile cut. The second offline shot retains OFFLINE.

### 10. Reconnect

The receiving cut starts only at the guest's pixel-detected LIVE time. Ana's own LIVE header is visible throughout; her town paragraph arrives five 30 fps frames after the cut, without a freeze or prior slow-sync frame. Reconnect-to-DOM arrival: Ana 486 ms, Swift Author 403 ms. These timings include real transport and DOM observation, not polling assertions.

### 11. Merge

Exactly 3.0 s. Two dark editorial attribution pills appear in sequence at 0.6 and 1.35 s, in the blank strip below the toolbar. They use the same dark rounded caption style and never cover the document.

### 12. Match

Both rectangular real-window crops retain their own complete header, avatars, LIVE badge, heading, all four paragraphs and natural spacing. Both use the identical scenario time range. No gutters or text bands are removed. Body type is 31.25 output px. Both windows are present on the very first match frame.

### 13. Captions

Captions begin fading at t=0 of each cut, reach full opacity at 0.25 s, and remain through the shot with a final 0.25 s fade. Repeated captions continue across contiguous cuts. Short loaded-join shot uses its entire duration. OFFLINE and reconnect captions are gated by visible badge states. Attribution pills remain 2.4 and 1.65 s.

### 14. End card

Four seconds. Font sizes are 78, 58, 48 and 60 px. Only this run's 120.962375 ms median of 30 edits is represented as about 0.1 s, plus “Tested end to end against Liveblocks”. No inherited result or URL claim.

### 15. Length and pacing

48.267 s. Forward-only cuts remove join/loading and comment delivery waits. No editorial freeze or speed change anywhere. Typing, caret/pointer motion, selection, popover actions and sequential merge captions maintain change; the final 3.6 s match and 4 s end card supply the allowed final reading time.

## Measurement and verification

Fresh edit median: **120.962375 ms across 30 edits**, presented as “about 0.1 s” on the end card. All ten comment attempts passed. The latency method is Node monotonic input-dispatch to remote DOM observation and includes automation overhead. It is not a server-only transport benchmark. `suite/latency.json` is from this run, not inherited evidence.

Real reconnect-to-DOM arrival: **Ana 486 ms; Swift Author 403 ms**. The guest's first pixel-detected LIVE is source **55.594 s**; Ana's recorded DOM arrival is **55.747 s**. The receiving shot begins at LIVE and its encoded final paragraph appears after five frames (**0.167 s**). The verifier independently checks blank receiving pixels before arrival and text pixels afterward. Both observations are retained in `take-7/both-merge-observations.json`.

Production build: `NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build`; server: `HOTPRESS_PROOF_PRODUCTION=1 pnpm start`. Build ID: `oRc2Z5RGqz0KOR9uqtmT1`. All captures and the latency suite used that same build. Existing automatic environment loading was retained; no environment file was opened, printed or edited, and no credentials were logged. The configured production key is checked without persisting its value. No push, deployment or hotpress.app request; browser routes block that hostname and subdomains.

`tsc --noEmit` passes. Biome source check has no errors; inherited explicit-any/fixture warnings remain. Both final files fully decode. `verify-v13.py` checks source PNG dimensions and timestamps, uninterrupted-source identity, source duration, forward-only ranges, zero editorial holds, maximum 1.25× upscale, OFFLINE/LIVE pixels against caption timing, actual receiving-pixel arrival, join-name size, both match headers and paragraph bands, 31.25 px body type, fresh measurement, exact cleanup-manifest equality and port 3847. Result: **passed**, in `v13-delivery-verification.json`.

## Exact-room cleanup

Exactly these eight created rooms were deleted and individually verified GET 404. No room listing or bulk deletion was performed:

- `chx0034eth1d3gux3xvl34vp` — take 1 (rejected; no footage used).
- `sud79owkv5zeyfpijpvqqwad` — take 2 (rejected; no footage used).
- `t3kakcizvp6q2gnofuraxgsf` — take 3 (rejected; no footage used).
- `debw9hrz09zqc20de1cje01v` — take 4 (rejected; no footage used).
- `mouuyoeklzsy3s0tbiex6k4n` — take 5 (rejected; no footage used).
- `ftzrkpyunv31nmld3gn0loek` — take 6 (rejected; no footage used).
- `vp5feaaingzjuely7evalt6a` — take 7 (accepted).
- `ycinu863i2hwym02wku3fpht` — fresh latency suite.

Evidence: `cleanup-verification-v13-cleanup.json`, individual room manifests, per-take teardown logs and `cleanup.log`. Exact local proof users/sessions were removed by the existing fixture/teardown. The owned server was stopped; **port 3847 is free**, checked by the verifier. Temporary inspection PNGs, intermediate shot encodes and local helper scripts are removed after verification. Raw captures, failed-take audit evidence and final artifacts remain outside git.

## Reproduce

Start the same production build, use `playwright.v13.config.ts` with explicit per-take output/run IDs, then run the latency suite into `suite/`. Each failed take must remain separate and its manifest must be included in exact cleanup. Stop the owned server before delivery verification. Compose with:

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v13" HOTPRESS_TAKE=take-7 node e2e/proof/compose-v13.mjs
python3 e2e/proof/verify-v13.py "$HOME/Downloads/hotpress-v13"
```

The verifier also requires the completed self-review JSON and exact-room cleanup evidence; it does not silently create an approval or claim a visual review. Source files are committed by explicit path; no video or output directory is committed.
