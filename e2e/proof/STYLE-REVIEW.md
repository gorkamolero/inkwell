# Collaboration UI style review

Reviewer: Claude, against the rubric in goal.md section 1b. Each item is pass, or the fix needed. Codex fixes and Claude reviews again until every item passes.

## Round 1 (2026-10-12, commits a49bf98 to 82157ee; 12 screenshots at 1440 px and 390 px)

Working well: the pins and popovers replace the sidebar, the phone bottom sheet is the right pattern, resolved threads clear their pin and highlight, pointers have name pills, and the comment highlight (warm yellow with underline) is calm and visibly stronger when active.

### Must fix

1. **Colour and contrast (fail).**
   - White text on neon green fails badly: "WA" in the pin, the "Writer A" caret flag, the header avatar.
   - Neon green also makes a near-invisible 2 px caret on white.
   - Give collaborators a curated palette of saturated mid-dark colours that pass 4.5:1 with white text and stay visible as a caret or pointer on white (for example blue #2563EB, violet #7C3AED, magenta #BE185D, teal #0F766E, orange #C2410C, green #15803D, indigo #4338CA).
   - Use each person's one colour everywhere: pointer, caret, flag, selection tint, pill, header avatar, pin and thread avatar. If any colour stays light, choose the text colour by contrast instead.
2. **Thread avatars (fail).** The avatars inside the popover, preview and sheet are Liveblocks' grey default circles, so they don't match the pins. Render them in the person's colour with their initials, the same as the pin.
3. **Guest names (fail).** A fresh guest reply shows "Guest 6maxtgh3" on the poster's own screen (popover-reply) while the other screen shows "Bright Storyteller". Names must resolve to the display name immediately and on every screen, including for the current user and for guests no longer connected, for example from the id plus cached presence info.
4. **The pin's count (fail).** The hover screenshot shows "WA 0", the reply count with the first comment left out. Show the total number of comments, or no number for a single comment. Never show 0.
5. **Pin placement (risk).**
   - "Just above the end of the phrase" can cover words on the line above when that line is longer.
   - Place each pin at the first candidate position that intersects no text and no other pin: above the end of the phrase, then just past the end of that line in the column's right gutter.
   - Prove it with a long line above a commented phrase.
6. **Popover and preview alignment (fail).**
   - Both are offset left of the pin (popover-reply, hover-preview) instead of growing out of it.
   - Anchor both to the pin: left edge aligned with the pin, or centred on it with a small caret, an 8 px gap, and kept inside the viewport.
   - The hover preview shows a doubled box from its offset shadow. Give it the same single hard shadow as the popover.
   - Preview text is 12 px. Use at least 13 px for the comment and 12 px bold for the name.
7. **The pending-comment highlight is muddy (fail).** While writing a new comment, the selected words turn olive or brown (composer, phone-composer). Use the warm comment yellow, slightly stronger, for the pending highlight.
8. **The composer (fail).**
   - Its inner divider runs past the right border (composer).
   - It's offset left of the selection. Align its left edge with the start of the selection, 8 px below, clamped to the viewport.
   - It should look like the thread popover: the same border, shadow, radius and header treatment.
9. **Header name truncation (fail).** The current user's name is cut ("Bright Storyt…"). Show names up to about 20 characters before truncating.
10. **Phone layering (fail).**
    - The floating selection toolbar covers the pin on the line above (phone-composer). Keep the toolbar clear of pins (place it below the selection if above collides), or hide pins under it while it's open.
    - The bottom sheet needs a visible drag handle, a tap-outside close, and its reply box kept above the on-screen keyboard (`visualViewport`).
11. **The pointer arrow (improve).** About 14 px is small next to Figma's. Make the arrow about 18–20 px with a thin white outline so it reads on any background, and keep the pill offset just below-right of the tip.

### Not reviewed yet (needed for round 2)

12. **Motion.** No recordings yet. Record short clips (webm, 1440 px, 30 fps) of:
    - a pointer gliding along a curved path on the other screen;
    - a pin appearing;
    - the hover preview appearing;
    - the popover opening from the pin and closing with Esc;
    - the composer opening from the "Comment" button;
    - the phone sheet sliding up and closing.

    Export a strip of 8–10 frames from each, so the motion can be judged frame by frame.
13. **The full suite.** Run every collaboration spec (the proof, auth, names and latency specs, everything in the `collaboration` project), not only `collaboration-proof.spec.ts`, and report each one.

## Round 1 fixes

Implemented by Codex on 2026-10-12; ready for Claude's round 2 review. This records implementation and verification, not Claude's approval or a deployment.

Evidence directory: `/private/tmp/claude-501/-Users-gorkolas-Developer-job-hunt-command-center/130c3c3e-ffb7-43bf-a354-cb1c2408aaed/scratchpad/hotpress-style-r2/`. Filenames below are relative to that directory. Desktop captures are 1440 × 1000; phone captures are 390 × 844. Phone pointers and hover previews are intentionally suppressed; threads use the sheet instead of a desktop popover.

| Item | Change | Evidence |
| --- | --- | --- |
| 1 — fixed | One shared, ID-based palette for authentication, cursors, pins and comment avatars. Every colour passes white-text AA (5.02:1–7.90:1). | `1440-two-pointers.png`, `1440-caret-selection.png`, `1440-popover-reply-owner.png`, `palette-contrast.json` |
| 2 — fixed | Comment resolver supplies coloured initials avatars; preview and pin use the same identity colour and initials. | `1440-hover-preview.png`, `1440-popover-reply-guest.png`, `390-sheet-reply-guest.png` |
| 3 — fixed | A signed HttpOnly guest cookie and ordered authentication requests keep room, roomless and refreshed tokens on one identity. Display names are derived from that ID on server and client, with cached trusted presence profiles taking precedence. Auth tests check identity equality and rejection of a tampered cookie. Own-screen replies and a fresh viewer after both authors leave are asserted. | `1440-popover-reply-owner.png`, `1440-popover-reply-guest.png`, `390-sheet-reply-owner.png`, `390-sheet-reply-guest.png`; Comment authors case in `suite-results.json` |
| 4 — fixed | Pin count includes all non-deleted comments, including the first; accessibility label also says total comments. | `1440-pin-long-line-above.png` (1), `1440-popover-reply-guest.png` (2) |
| 5 — fixed | Measure text ranges and occupied pins. Try above the phrase end first; on collision, move past the line end, then find free vertical space if the viewport's gutter is occupied. No text reflow. | `product-highlight-pin.png` (normal), `1440-pin-long-line-above.png`, `390-pin-long-line-above.png`; automated glyph-intersection assertion |
| 6 — fixed | Preview and popover share the pin's left edge and an 8 px gap, clamped to the viewport. Preview is one card with one hard shadow; body 13 px, author 12 px bold. | `1440-hover-preview.png`, `1440-popover-reply-guest.png`, `1440-focus.png` |
| 7 — fixed | Pending selection uses the browser's text-range highlight in warm yellow, behind legible dark text; older engines retain a translucent fallback. | `1440-composer-pending.png`, `390-composer-pending.png` |
| 8 — fixed | Composer uses bottom-start placement, 8 px gap, viewport clamping, matching border/radius/shadow/header, contained divider and width. Fixed a focus race: selection-only focus updates preserve the draft and the captured Lexical selection is restored when attaching the thread. Actual document edits still invalidate the range. Both ESM/CJS patches and lockfile are committed. | `1440-composer-pending.png`, `390-composer-pending.png`, `composer-open.webm`; 10-comment latency case and Comment authors case |
| 9 — fixed | Header allows 20 characters before truncation. | `1440-popover-reply-guest.png`; guest display names are fully visible |
| 10 — fixed | Phone pins have a ≥44 px hit region and hide while the selection toolbar/composer is open. Sheet has a visible handle, close control, outside-tap dismissal, sticky reply composer and visualViewport resize/scroll insets. | `390-toolbar.png`, `390-composer-pending.png`, `390-sheet-reply-guest.png`, `390-sheet-keyboard-inset.png`, `phone-sheet-open-close.webm`. Keyboard inset is a simulated visualViewport height of 450 px, not a physical-device keyboard claim. |
| 11 — fixed | Pointer arrow is 20 px wide with a thin white outline; path tip starts at the transmitted coordinate and pill stays below-right. | `1440-two-pointers.png`, `pointer-curve.webm` |
| 12 — supplied | Six 1440 px, 30 fps WebM clips from timestamped Chromium compositor frames; each has a nine-frame strip. Opening and closing card/sheet animations are 180–200 ms ease-out. | `pointer-curve`, `pin-appear`, `hover-preview`, `popover-open-close`, `composer-open`, `phone-sheet-open-close` (each `.webm` and `-strip.png`); `motion-index.json`. Phone clip preserves the 390 px viewport inside the requested 1440 px canvas; its strip crops the unused canvas. |
| 13 — supplied | Entire collaboration project, including auth, latency, all proof/name cases, style capture, video and legacy collaboration specs, on a production build with real Liveblocks. | `suite-results.json`, `suite.log`, `report/index.html`, `latency.json`, `RESULTS.md` |

Additional states: `1440-toolbar.png`, `1440-focus.png`, `1440-resolved.png`, `390-caret-selection-no-pointers.png`, `390-resolved.png`, plus the `product-*.png` captures from the existing proof. The style test checks both guest-reply screens, text/pin intersection, phone horizontal overflow, outside-tap dismissal, resolution, and keyboard inset handling. Rerun `collaboration-style.spec.ts` to regenerate the intermediate compositor frames, then extract the clips and strips with `HOTPRESS_PROOF_OUTPUT=<evidence directory> node e2e/proof/extract-style-motion.mjs`.

Verification completed: production build and targeted source lint passed; the entire collaboration project passed **20/20** (auth 1, latency 1, proof including names 11, style 1, video 1, legacy collaboration 5), with zero skips/retries. A final capture-only run passed **1/1** on the same application build. All 31 delivered screenshots and all six nine-frame strips were inspected at full size. Video metadata confirms six 1440 × 1000, 30 fps clips. Across the debugging attempts and final runs, **66 exact recorded rooms** were deleted and each GET verified 404; the ledgers match with no missing or extra IDs. The production server was stopped and port **3847 is free**. No push, deployment or hotpress.app calls.
