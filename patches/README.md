# Liveblocks Lexical patch

The 3.12.1 comment provider sets a fresh active-thread array on every Lexical
update, even when the IDs have not changed. In this React 19 editor that causes
maximum-update-depth exceptions inside the editor listener chain. The later Yjs
listener then misses edits: the originating Lexical state contains characters
absent from both Yjs documents and the receiving Lexical state.

Compare active IDs with Liveblocks' existing `shallow` helper and retain the
previous array when unchanged. Apply the same fix to both ESM and CJS builds.
This changes notification/render scheduling only; it does not replace document
state, debounce transport, or modify CRDT merge semantics.

The coordinated 3.24.3 upgrade reproduced the same error and was discarded.
Keep the pnpm patch until an upstream release fixes the redundant state update.
Run the real collaboration proof (including rapid typing and a nine-second
outage) before removing it. Lexical remains 0.35.0.
