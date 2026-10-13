# Hotpress demo v7

Delivery: `~/Downloads/hotpress-v7/`. Duration 45.533 seconds, 1920×1080,
30 fps. Measured video bitrates: master 7.965 Mbps; web 0.357 Mbps
(container rates 7.969 / 0.360 Mbps). Both are H.264 High, yuv420p,
with moov before mdat; both passed a complete FFmpeg decode.

## Changes and footage provenance

1. Retook the sentence/comment section. The guest blurs the editor and parks
   below all paragraphs before Ana selects the comment anchor. No remote label
   covers document words, and no blue chip protrudes from the comment popover.
2. Reused v6 guest raw footage as one continuous 10.8-second range, with a fixed
   wider crop showing both header and document. OFFLINE is visible throughout
   the typing and for over nine seconds total, followed by LIVE before cutting
   to Ana. There is no header/body crop jump. Ana writes during that same real
   offline interval; her sentence is attributed in the following merge shot.
3. Replaced the outlined teal rectangle with a translucent blue sentence tint
   fading out over 1.2 seconds and the chip “From the guest, written offline”.
   Ana's concurrent sentence gets a subtle green tint and “Ana’s online edit”.
   These are editorial overlays over actual receiving pixels. The Ana receiving
   insert retains v6's source-time overlap with the guest reconnect view.
4. The new sentence shot starts after both browser selections have collapsed.
   No stray yellow h appears. The subsequent drag selection of “before dawn”
   remains visible as the intentional comment gesture.
5. The opener uses the same full-bleed body crop as the later document shots.
6. Both match views include all four paragraphs, the highlighted phrase, and
   the complete two-comment pin. The last line ends around y=916; the caption
   starts at y=967, leaving approximately 51 px. Tags have 32 px right margins.
   The upper-left crop margin excludes the preceding heading's clipped
   descender while retaining the complete pin in the upper-right margin.
7. First guest tag: “Guest’s screen (Bold Editor)”; later tags: “Guest’s screen”.
8. The v6 end-card design stays, with the requested source line ending
   “github.com/gorkamolero/inkwell (Hotpress)”. Fresh 30-edit latency measurement:
   median 111.866 ms, rounded to 0.1 s on the card. Includes automation overhead.
9. The master uses an 8 Mbps constrained constant bitrate encode with filler;
   the web version uses CRF 22 and tune stillimage. Both use +faststart.

Only sentence editing and comment creation use fresh footage. The opener,
join, replies, offline/merge, and final comparison reuse v6's original raw
footage. Parallel-writing footage retains the same accepted v5 raw ranges
already used by v6. No application behavior, network state, document edits,
or remote messages were synthesized.

## Recording and verification

Built with `NEXT_PUBLIC_COLLABORATION_PROOF=1 pnpm build`, then used an owned
`pnpm start` on localhost:3847. Existing environment loaders were used without
opening, printing, or editing environment files. Production-compatible signed
cookies used `HOTPRESS_PROOF_PRODUCTION=1`; Liveblocks used the existing production
configuration. Browser routing blocks hotpress.app. No push or deployment.

The successful recorder and the real 30-edit/10-comment latency test passed.
Application `pnpm exec tsc --noEmit` passed. The broad e2e tsconfig check has
pre-existing failures in unrelated specs and lacks DOM.Iterable; v7's copied
DOMRectList iteration was changed to Array.from so it adds no such error.

Reviewed all 23 two-second samples (1, 3, …, 45 s) personally at original
1920×1080 and 390 px, against items 1–8. Re-reviewed the corrected match frames.
Also inspected the first guest tag, LIVE before the cut, and early/late tint
frames. Review images, metadata, and decode/encoding verification are retained
in the delivery directory. Native samples are v7-every2s; phone samples are
v7-phone with four v7-phone-review sheets. Key shots are in v7-frames.

One failed caret-positioning rehearsal was discarded. Exact-room teardown and
an additional explicit-manifest verification returned GET 404 for all three
rooms created in this round:

- gmu14cqdrbpumwm6ekswjp6e — discarded rehearsal
- o5lpz26pceknjavnpfzdao6l — successful corrective take
- b1f3m5x0xh9xqokc9uf40l5k — latency suite

Evidence: `cleanup-verification-v7-cleanup.json`. No remote room enumeration.
Local proof users/sessions were cleaned by the existing helpers. The owned
server was stopped and port 3847 verified free. Successful raw footage and
verification records remain; redundant and discarded video intermediates were
removed.

## Recompose

```sh
HOTPRESS_PROOF_OUTPUT="$HOME/Downloads/hotpress-v7" \
HOTPRESS_V6_SOURCE="$HOME/Downloads/hotpress-v6" \
HOTPRESS_V5_SOURCE="$HOME/Downloads/hotpress-v5" \
node e2e/proof/compose-v7.mjs
```

Commit only the recorder, composer, notes, and the helpers' v7 identity-colour
condition by explicit path. No media belongs in git.
