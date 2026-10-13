# Interrupted Lexical-to-Yjs synchronization

- **Found:** rapid typing left B missing characters; longer offline merges could leave one side stale.
- **Cause:** Liveblocks' comment provider sets a fresh active-thread array on every editor update, even if unchanged. React throws `Maximum update depth exceeded` from `$onStateRead`, interrupting Lexical's update listeners before Yjs receives every edit. Read-only failure snapshots show A's complete Lexical text, but the same truncated text in A's Yjs, B's Yjs, and B's Lexical state. This is not a receiving-client-only CRDT loss.
- **Fix (`fa30116`):** a reproducible pnpm patch to `@liveblocks/react-lexical@3.12.1` compares active-thread IDs with the SDK's existing `shallow` helper and retains unchanged state. Both ESM and CJS are patched. No CRDT replacement, transport throttling, or document overwrite. The badge now reports actual offline/reconnecting state.
- **Proof:** 10 consecutive rapid-typing checks passed. Five consecutive nine-second outages with both writers typing passed 5/5. Three consecutive production suites passed 17/17 each, including the continuous 53.48-second recording. Thirty final edit measurements: median 196 ms, p95 453 ms.

Disabling History/List/Link/AutoLink/paste/MarkdownShortcut/word-count plugins did not eliminate the exception. The app's autosave only serializes state; paste plugins are command-driven; autolinking skips collaboration updates. HotpressEditor's initial-content setter is not mounted in the shared editor. The stack identifies the upstream comment listener.

A coordinated 3.24.3 upgrade reproduced the exception and divergence and was discarded. The intervening changelog contains storage/reconnect and Tiptap fixes, but no fix for this Lexical listener. Liveblocks remains 3.12.1 and Lexical remains 0.35.0.

Failure evidence is retained in the output folder (`yjs-diagnostic.log`, `stack-diagnostic.log`, their timestamped `failed-states` JSON, `no-app-plugins.log`, and `upgrade-candidate.log`). The proof now rejects browser errors and captures Yjs alongside Lexical on failure.
