# Intermittent comments authorization failure

Observed against real Liveblocks, using isolated local test users and anonymous guests. No transport mocks or real account logins.

## Evidence

- `comments-diagnostic-report` records failed thread creation with 403 `FORBIDDEN`.
- `sidebar-fix-report` records a passing anchored comment, guest reply, owner visibility, resolution, and persisted thread contents after both pages reload.
- `sidebar-fix.log` records ID-token requests failing after reload, including `GET .../thread-with-notification/<test-thread>` and `POST .../text-metadata`, while access-token grants contain both write permissions.
- The diagnostic prints only token kind and room permission names, never token strings, headers, or signing keys.

## Cause

`src/app/api/liveblocks-auth/route.ts` returns `identifyUser` ID tokens when `room` is missing and `prepareSession` access tokens when a room is supplied. `src/lib/liveblocks.ts` has a single shared client. The installed Liveblocks core auth manager's `getCachedToken` scans tokens in reverse arrival order and accepts an ID token immediately for any room. A later roomless token can therefore replace the effective authority used by room REST requests. The WebSocket can continue synchronizing edits with its original access token, so working edits do not imply working comments.

The roomless path is exercised by the mounted notification/AI features. Both request types were observed without opening any external service or settings page. The server's room-specific grants were verified from decoded permission metadata only. Failed room requests were verified to use token kind `id`.

## Reproduce

Run `bash e2e/proof/run.sh collaboration-proof.spec.ts --grep 'Comments —'` repeatedly as independent diagnostic runs, keeping every result. Depending on auth response order, thread creation or later reads can return 403. A reload starts a new race. The full suite also exercises comments after 30 edits and in the recording.

## Boundary

The sidebar provider/layout issue is fixed separately in `8f1463a`. No authentication redesign, wildcard grant, production room-policy change, notification removal, or service-settings change was made. A safe resolution needs an explicit choice of authentication model for both room and roomless features; broadening production permissions is not an acceptable test workaround.
