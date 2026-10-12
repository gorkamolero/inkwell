# Hotpress collaboration proof

Run from the repository root:

```sh
bash e2e/proof/run.sh
```

Requires the existing local environment, migrated local `inkwell` Postgres database, Playwright Chromium, ffmpeg with drawtext, and pdftotext. The wrapper starts `pnpm dev` when port 3847 is not serving and stops only the server it started. Environment files are loaded by the existing application/Playwright configuration; the proof never opens or modifies them.

All artifacts default to the requested `hotpress-proof` scratchpad directory (`output` in `rooms.ts`). Override `HOTPRESS_PROOF_OUTPUT` for a different artifact destination. Install the matching browser into that directory if necessary:

```sh
PLAYWRIGHT_BROWSERS_PATH="$HOTPRESS_PROOF_OUTPUT/browsers" pnpm exec playwright install chromium
```

The `collaboration` project includes the baseline, checklist, latency, and recording tests, with one worker. Each proof fixture creates isolated contexts, inserts two random local test users with `.invalid` emails, signs cookies with the existing auth helper, then removes the helper's client-side auth mock. Shared URLs must be localhost. The app's real session, auth, Liveblocks, and Yjs paths run without sync mocks. Reading `__lexicalEditor` is read-only; all document modifications use browser input and the real clipboard.

Room IDs are recorded immediately after creation in a per-invocation manifest. Global teardown deletes only those IDs and verifies each room returns GET 404. It runs even when tests fail; abrupt process termination can bypass teardown. Never invoke the old bulk cleanup helper. To recover an interrupted invocation, use only its exact room manifest; do not discover rooms from the production project.

Latency uses a Node monotonic clock from input dispatch to the other browser's real DOM on requestAnimationFrame. These are end-to-end observed times, including Playwright overhead, not pure network latency. JSON contains all 30 edit samples and 10 comment attempt outcomes; failed comment requests are not latency samples. Median averages the middle two samples; p95 uses nearest rank.

The recording test uses two 1280×800 Playwright recordVideo contexts, retains both raw WebMs, and uses ffmpeg hstack, drawtext labels, H.264, yuv420p, and faststart. Pacing delays exist only in the recording scenario. No accelerated footage or simulated remote edits. When Liveblocks rejects comments, the recording preserves that attempt, omits a fabricated reply, and carries a visible failure label. Such footage is a partial proof, not a successful end-to-end comments demonstration.

PDF verification calls the local preview endpoint and extracts text from the generated PDF. Whitespace is normalized to account for decorative drop caps. The separate background export pipeline uses Vercel Workflow and is not invoked.

## Findings from this run

The original sidebar crashed when a real thread arrived: it was outside the Lexical and Liveblocks comment contexts. Its scroll container also collapsed around absolutely positioned threads. Commit `8f1463a` moves the providers around the shared layout and gives the viewport a height. The real comment/reply/resolve/reload test passed after this fix.

A separate, intermittent authentication bug remains. `/api/liveblocks-auth` returns a room access token (`acc`, with `room:write` and `comments:write`) for room requests, but returns an ID token (`id`) for roomless notification/AI requests. Both enter the same client's cache. The installed SDK scans newest tokens first and accepts an ID token for any requested room. Diagnostics confirmed that rejected thread/text-metadata requests used `id`; room access grants themselves were correct. Rejected requests returned HTTP 403 `FORBIDDEN`. Depending on response order, comments can work or fail. A passing take does not establish reliability.

Changing this model safely requires deciding how roomless notifications/AI and room access should be authorized. Do not grant wildcard access to the production project or mutate existing room permissions to make tests green. This design issue is intentionally left unresolved under the task's risky-change rule. The suite retains the actual comment checks and records failures instead of marking them expected passes.

The standalone PresenceAvatars and CollaboratorCursors components are not mounted in the shared editor. The mounted avatars are LivePresenceAvatars (useOthers/useSelf); the cursor DOM is `.lb-lexical-cursors`, rendered by LiveblocksPlugin through Lexical's CollaborationPlugin. Tests inspect those actual elements.

Only the Liveblocks webhook imports `src/lib/redis.ts`. It tracks online users for notification de-duplication. No visible avatar, cursor, or Live badge depends on the TTL store. Local webhooks were not configured or simulated. Notification de-duplication and cross-process durability are outside this proof.

The rapid-typing regression also fails full-document convergence, with three characters missing on B in the captured run. See `SYNC-FAILURE.md` and the saved serialized state pair. Short successful edits are not evidence that longer bursts are safe.

The paced recording also captures a longer-outage failure: A receives both edits, but B does not receive A's offline-period sentence before the deadline. The raw footage is retained and the MP4 is labelled partial. See `video-scenario.json` and `SYNC-FAILURE.md`.

The system ffmpeg build lacks drawtext. `prepare-video-tools.sh` builds a minimal FFmpeg from [the official source release](https://ffmpeg.org/download.html) inside the output folder, using the already installed compiler and freetype/harfbuzz/fontconfig/x264 libraries. It does not install or change system packages. The suite wrapper checks this automatically. Recompose existing footage without creating any rooms with `node e2e/proof/compose-video.mjs`.
