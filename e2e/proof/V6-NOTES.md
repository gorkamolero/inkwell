# Hotpress demo v6

Record `portfolio-v6.spec.ts` against an owned production build with the existing
Playwright environment loader and production cookie flag. The recorder creates
an actual anonymous guest, uses browser input for every edit, and retains plain
local pointers with a 1.1-second idle timer. Comment and reply typing use 70 ms
per character. Identity colours match v5 so accepted footage can be reused.

The offline take sets Chromium offline **and closes its real WebSocket**.
Chromium offline emulation alone retains a stalled connection and can replay
individual queued packets on recovery. No document edits, remote messages,
badges, or awareness state are mocked. Both writers blur the editor by clicking
the header before reconnecting. A read-only MutationObserver records Ana's
receiving DOM; the successful take contains one update with the whole sentence.
Two unsuccessful rehearsals exposed the packet replay and were discarded.

Run fresh `collaboration-latency.spec.ts` into the delivery's `suite` directory.
It measures 30 edits from input dispatch to remote DOM observation using a Node
monotonic clock, including automation overhead. Do not reuse v4/v5 latency.

Compose with explicit `HOTPRESS_PROOF_OUTPUT` and `HOTPRESS_V5_SOURCE` using
`compose-v6.mjs`. It reuses v5's accepted parallel-writing and same-sentence raw
footage, preserving its timing and 2.222x zoom. Other choreography is freshly
recorded. The edit omits a comment-delivery wait and uses hard screen cuts. The
Ana merge insert overlaps source time with the preceding guest badge insert to
show each side of the same actual reconnect; it is not a continuous-time claim.
A 300 ms opening-frame hold lets the join caption settle before page loading.
All caption fades take 250 ms, without repeated fades across the same caption.

The final comparison shows the same three actual paragraphs, Ana above guest,
for three seconds. The end card reports the fresh rounded median, sample count,
measurement provenance, end-to-end Liveblocks wording, and source URL.

Verify only this run's exact room manifests, including discarded takes. Never
list remote rooms. Retain cleanup records and successful raw footage, stop the
owned production server, and verify port 3847 is free. Review every two-second
sample at native 1920x1080 and 390px, plus badge/merge transition frames. This
workflow does not call hotpress.app, deploy, push, or commit media.
