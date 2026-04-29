## Why

Real-time installation log streaming for image builds breaks after the first one or two messages: the SSE connection is closed prematurely, so users on the Installation log tab see a stalled, near-empty log even while the build is still producing output (Issue #3083). The connection only "recovers" when users switch to another tab and back, because the remount opens a fresh subscription that receives the full backend buffer.

Root cause: `InstallationLog.tsx` registers a handler on the SSE `'status'` event that calls `eventSource.close()` unconditionally on every status notification. The sibling implementation that streams container logs (`PodView.tsx`) does not subscribe to `'status'` at all and works correctly, since the backend already terminates the stream itself when the build finishes.

## What Changes

- Remove the `'status'` event listener and its handler from `InstallationLog.tsx` so the SSE connection is no longer closed by frontend logic on non-terminal status events.
- Behavior aligns with the working container-log streaming pattern in `PodView.tsx`: rely on the backend to close the stream when it has nothing more to send.
- No change to log rendering, tab structure, error handling, or notifications.

## Capabilities

### New Capabilities
- `image-installation-log-streaming`: Defines the requirement that the Installation log tab streams build logs via SSE for the full lifetime of the build and lets the backend control stream termination.

### Modified Capabilities
<!-- None -->

## Impact

- Affected file: `apps/ai-dial-admin/src/components/Images/View/InstallationLog/InstallationLog.tsx`.
- No changes to API routes, server actions, backend endpoints, or shared components.
- No impact on container log streaming (`PodView.tsx`); this proposal only realigns image installation logs to the same behavior.
- User-facing fix for Issue #3083.

## Non-goals

- Stabilizing `useEffect` dependencies (`t`, `showNotification`) for `InstallationLog`. The same pattern exists in the working `PodView` and is not implicated in this bug.
- Preserving the visible log buffer when the user switches tabs. The component still unmounts on tab switch; the backend replays buffered logs on reconnect, which is acceptable.
- Adding interpretation of `event: status` payloads on the frontend. Stream termination remains a backend concern.
- Manual verification steps in the spec.
