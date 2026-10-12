# Rapid typing fails full-document convergence

The focused `Rapid typing — full paragraph integrity` test fails against real Liveblocks with two independent browser contexts. A types ten short numbered phrases with Playwright keyboard.type and zero artificial delay. No comments, formatting, clipboard injection, or mocked transport are involved in this test.

A's complete serialized text:

```text
Latency anchor 0. Latency anchor 1. Latency anchor 2. Latency anchor 3. Latency anchor 4. Latency anchor 5. Latency anchor 6. Latency anchor 7. Latency anchor 8. Latency anchor 9.
```

B's serialized text after the 20-second convergence deadline in the final proof run:

```text
Latency anchor 0. Latency anchor 1. Latency anchor 2 Latency anchor 3. Latency anchor 4. Latency anchor5. Latency anchor 6. Latency anchor 7. Latency ancho 8. Latency anchor 9.
```

B lacks the period after `2`, the space before `5`, and the `r` in `anchor 8`. This is not a screenshot overlap or merely different Lexical node segmentation: the text field itself differs. The saved JSON pair is `failed-states-1791846873400-34153-3a1839686382919b8fd6693bf6b65de9fa31bb30.json` in the output folder. The same long-input setup also failed in the preceding full suite.

The shorter concurrent-edit check (two simultaneous five-character keyboard streams, bold formatting, and a real clipboard paste) passes full serialized-state comparison. Thirty individually observed marker edits also propagate. Those results do not invalidate this longer burst failure.

Reproduce with:

```sh
bash e2e/proof/run.sh collaboration-proof.spec.ts --grep 'Rapid typing'
```

The defect is localized to the live editor/synchronization path: A has the expected text, while B's actual Lexical state remains different. The precise cause inside the Lexical/Yjs/Liveblocks integration has not been isolated. No CRDT, provider, dependency-version, or synchronization-design change was attempted. The failing test and complete state evidence are retained for that investigation, as required by the risky-change boundary.

## Longer outage in the recording

The short offline/reconnect unit check passes, including negative assertions while offline and full-state equality afterward. The paced recording's eight-second outage does not: after reconnect, A contains both `A continued online.` and `B kept writing offline.`, but B still lacks A's sentence after the ten-second deadline. Both pages did receive their own typing before reconnect. The state pair is `failed-states-1791846873400-34153-bb068b514c0935a2803231f7cffb0d43bbbb4534.json`.

The MP4 preserves the failure and carries a partial-proof label. The cause of this one-sided reconnect result has not been isolated; do not assume it is identical to the auth-cache issue or the rapid-typing issue. No successful reconnect was fabricated or substituted into the recording.
