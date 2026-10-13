# Hotpress demo v8

Delivery: `~/Downloads/hotpress-v8/`. 43.500 seconds, 1920×1080, 30 fps.
Video bitrates: master 7.964 Mbps, web 0.405 Mbps (container 7.967 / 0.408).
Master is constrained 8 Mbps H.264; web is CRF 22 with tune stillimage.
Both are High profile, yuv420p, faststart, and pass a complete FFmpeg decode.

## Requested changes

1. Actual offline recording now intercuts the guest starting “The town ”,
   Ana typing “The tide turned.” for 2.833 seconds with her caret visible,
   and the guest finishing “woke slowly.”. Guest OFFLINE remains visible in
   both guest cuts. The final offline tail is approximately 0.65 seconds.
2. The merge close-up lasts 4 seconds and begins 0.3 seconds before the
   receiving pixels change. Blue “Guest, written offline” and green
   “Ana, written meanwhile” use identical 48 px pill typography and padding.
   Their tints and pills fade in over 0.3 seconds, hold, and fade out only
   during the final 0.35 seconds. Attribution overlays cover real source pixels.
   The LIVE insert and receiving close-up overlap source time, as in v7.
3. Offline is full bleed with the same approximately 70 px document margin
   as the neighbouring body zooms. No outer window frame crosses the caption.
4. Match remains stacked, with top panel labels, a divider, Chapter One,
   and the same three key lines in both panels: the anchored opening sentence,
   the boats/tide line, and the guest's final sentence. These are crops from
   each actual recording; the lantern line is omitted in this comparison.
   Main text remains approximately 67 px rather than shrinking whole documents.
5. Guest identity is rerolled to a blue Quiet Storyteller using the existing
   generator. App code is unchanged. Sentence editing cuts before the guest
   parks their pointer; an 11-frame editorial hold keeps the last clean name
   label fully visible. Comment creation cuts immediately after local posting
   (120 ms allowance for capture), instead of waiting for the remote observer.
   The reply pointer parks in clear white space left of the discussion panel.
6. End card retains the requested title and two statistics, then only
   hotpress.app. Fresh 30-edit median: 118.892 ms, displayed as 0.1 s.
   The measurement includes automation overhead; 10 comment attempts also passed.

## Provenance and verification

Reused the accepted opening footage referenced by v7 metadata. Preserved v7's
visual treatment, writing, comments, reply, and sequence. Name-bearing footage
was retaken to keep Quiet Storyteller consistent in native cursors, avatars,
comments, and header; reusing Bold Editor there would violate the naming request.
Both writers' real DOM states converged after the actual socket disconnection.
No edits, network badges, or remote messages were fabricated.

Production build: NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build, then pnpm start.
Recording and latency used HOTPRESS_PROOF_PRODUCTION=1 and existing configured
production Liveblocks credentials. Existing loaders handled environment files;
none were opened, printed, or edited. Browser routes blocked hotpress.app.
No push, deploy, or hotpress.app requests. Application tsc --noEmit passed.

Personally inspected all 22 final two-second samples at original 1920×1080
and 390 px. Also inspected cut boundaries, full-opacity sentence labels,
completed Ana typing/caret, LIVE badge, receiving arrival, and final tint fade.
The final phone review has four sheets. Evidence: v8-delivery-verification.json,
v8-metadata.json, v8-transitions/, v8-frames/, v8-every2s/, and v8-phone/.

Exact-room teardown and a separate explicit-manifest verification returned
GET 404 for all three rooms created during this revision:

- m37ptbb510kv6y6olbf3v4ry — first corrective rehearsal
- t8200v9smjm0b52fnh2y5s16 — final recording
- ih9hrx8kofk2kxgotn8olo9r — latency measurement

Evidence: cleanup-verification-v8-cleanup.json. No remote room enumeration.
The existing cleanup removed the exact local proof sessions/users. The owned
production server was stopped; port 3847 is verified free. Final raw recording,
logs, manifests and delivery evidence remain. Rehearsal video and redundant
composition video intermediates were removed.

## Recompose

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v8" \
HOTPRESS_V7_SOURCE="$HOME/Downloads/hotpress-v7" \
node e2e/proof/compose-v8.mjs
```

The accepted opening source referenced by v7 metadata must remain available.
Commit only explicit source paths; no media belongs in git.
