# Comments authentication

- **Found:** intermittent comments REST 403s while WebSocket edits still worked.
- **Cause:** one client cached both room access tokens and roomless ID tokens. Its auth manager accepted the latest ID token for any room, whose server-side permissions were empty.
- **Fix (`280a329`):** consistently use access tokens. Preserve the existing exact-room `FULL_ACCESS` grant for a supplied session/room ID, and issue an empty grant for roomless notifications/AI. Reject wildcard room patterns. No default grants or room-permission API mutations, and no migration of production rooms.
- **Proof:** 10 consecutive real create/reply/resolve/reload cycles passed with independent owner/anonymous-guest contexts. Three consecutive production suites passed 17/17 each. Ten final comment measurements: median 1535 ms, p95 6568 ms (all HTTP 200); raw samples are in the external v2 report.

This follows [Liveblocks' individual-room access-token guide](https://liveblocks.io/docs/guides/how-to-grant-access-to-individual-rooms-with-access-tokens), which explicitly covers roomless notifications. Installed node 3.12.1 serializes empty permissions; core caches that token only for roomless requests and requires an exact matching grant for room calls. The node SDK emits a future-deprecation warning for empty grants; no wildcard workaround is used.

The pre-existing auth route treats possession of a room/session ID as access; the fix preserves that policy and its write permissions for authenticated and anonymous users. It does not replace the app's session access checks or broaden room access.
