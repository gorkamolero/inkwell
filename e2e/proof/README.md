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

The recording test uses two 1280×600 Playwright recordVideo contexts, retains both raw WebMs, and uses ffmpeg hstack, drawtext labels, H.264, yuv420p, and faststart. Pacing delays exist only in the recording scenario. No accelerated footage or simulated remote edits. When Liveblocks rejects comments, the recording preserves that attempt, omits a fabricated reply, and carries a visible failure label. Such footage is a partial proof, not a successful end-to-end comments demonstration.

PDF verification calls the local preview endpoint and extracts text from the generated PDF. Whitespace is normalized to account for decorative drop caps. The separate background export pipeline uses Vercel Workflow and is not invoked.

## Current fixes and verification

The sidebar/provider fix from `8f1463a` remains in place. The follow-up fixes use
one access-token auth model and a narrow pnpm patch that prevents redundant
active-thread React state updates from interrupting Lexical's Yjs listener.
See `AUTH-FAILURE.md` and `SYNC-FAILURE.md` for found/cause/fix/proof notes.

Run the repeated checks with `--repeat-each=10` for rapid typing/comments and
`--repeat-each=5` for the nine-second outage. Every browser error fails the proof.
The read-only Yjs snapshot bridge is enabled by `NEXT_PUBLIC_COLLABORATION_PROOF=1`;
`run.sh` sets it when starting the dev server. For the production proof:

```sh
NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build
pnpm start
# In a second shell, using production cookie names and signing salts:
HOTPRESS_PROOF_PRODUCTION=1 bash e2e/proof/run.sh
```

The v2 video uses 1280×600 per person, 20px editor text, and a continuous paced
50-second scenario. B joins through the actual shared URL; both type in separate
paragraphs and then at different positions in one sentence; A comments, B
replies, and a nine-second outage merges both contributions. The actual badge
shows Offline/Reconnecting. Any failed scenario is labelled on the composed
footage. Output is `collaboration-split-screen-v2.mp4`; v1 is preserved.

Each invocation deletes and verifies only its recorded remote rooms (GET 404)
and removes those exact local writing-session fixtures. Never discover rooms
remotely. Use `verify-rooms.spec.ts` with an explicit manifest list for final
verification or recovery.

The local ffmpeg build with drawtext is reused from the output folder. The
proof invokes neither the background export workflow nor any deployment.

For local production runs, the fixture validates the returned share link is on
localhost:3847, then uses HTTP to match next start. The app hardcodes HTTPS in
production-mode share URLs. No external host is accepted or contacted.

## Portfolio recording

After the production suite has passed, `portfolio.spec.ts` records a separate,
continuous 55-second take using Ana and an actual anonymous share-link guest.
Run it with the Chromium project and the same production environment flags.
The two 956px panes use 24px manuscript text. `compose-portfolio.mjs` aligns the
raw WebMs using a green setup slate, removes only setup/tail footage, crops the
bottom status bars, and adds labels, event-timed captions and a three-second
end card. It produces 1920×1080 H.264 at 30 fps and 7 Mbps with faststart.
The end card reads this run's `names-suite/latency.json` and verified
`names-suite/suite.log`; it refuses failed takes or missing suite results.
The video spec is separate from the 18-check `collaboration` project.

Set `HOTPRESS_PROOF_OUTPUT` explicitly when invoking the compositor, and point
`HOTPRESS_PROOF_FFMPEG` at the existing drawtext-enabled binary. Preserve the
successful raw files and scenario JSON with the deliverable. Any failed take
must be re-recorded from the beginning, never repaired by mixing takes.

## Portfolio v3: one continuous production take

Start an owned `NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build`, then `pnpm start`
(port 3847). Do not reuse an unrelated server. The existing configuration loads
credentials; do not inspect or print environment files. Set
`HOTPRESS_PROOF_PRODUCTION=1` for production-compatible signed test cookies.

Run the complete collaboration project into a fresh evidence directory with
`--workers=1 --reporter=list,json` and `PLAYWRIGHT_JSON_OUTPUT_NAME` pointing to
its `suite-results.json`. Supply the existing drawtext-capable ffmpeg through
`HOTPRESS_PROOF_FFMPEG` for the legacy suite video. Run
`e2e/proof/portfolio.spec.ts --project=chromium --workers=1` into its own fresh
`HOTPRESS_PROOF_OUTPUT` directory. Each failed rehearsal must be discarded in
full; retain its room ledger and cleanup evidence.

Compose with:

```sh
HOTPRESS_PROOF_OUTPUT="$delivery_directory" \
HOTPRESS_PROOF_TAKE="$successful_take_directory" \
HOTPRESS_PROOF_SUITE="$fresh_suite_directory" \
node e2e/proof/compose-portfolio.mjs
```

Use `PLAYWRIGHT_BROWSERS_PATH` consistently if Chromium is installed outside the
default cache. Composition requires the successful take, a fresh 20/20 suite
with zero skips/retries, and its latency measurements. It aligns the two raw
recordings using a pre-take slate; the action is never spliced. Frame, Inter
labels, caption fades, eased camera moves and the measured end card are added
in composition. The output contains master/web MP4s, a poster, step frames,
a contact sheet and `v3-metadata.json` with exact measurement sources.

Review every step at full resolution and review motion and phone playback size.
Record review results separately from the product UI's Claude style approval.
Verify each room in this run's exact creation manifests is deleted with GET 404;
never list rooms. Stop the owned server and verify port 3847 is free. Publishing
is a separate action, outside the v3 recording brief.
