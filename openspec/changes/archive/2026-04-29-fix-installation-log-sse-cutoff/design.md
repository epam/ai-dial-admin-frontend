## Context

The Installation log tab on the image detail view subscribes to a Server-Sent Events stream at `/api/sse?entity=image&id={imageBuildId}` and appends incoming `'logs'` events to a local string buffer rendered by `LogViewer`. The same SSE proxy route (`apps/ai-dial-admin/src/app/api/sse/route.ts`) is shared with container log streaming used by `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/PodView.tsx`.

`InstallationLog.tsx` additionally subscribes to a `'status'` event whose handler unconditionally calls `eventSource.close()`. The backend appears to emit `'status'` events for non-terminal states during the build, so the connection is closed after the first such event — typically after only one or two log lines have been delivered. Because the tab body is mounted via conditional rendering in `TabsContent.tsx`, switching to another tab and back unmounts and remounts `InstallationLog`, opening a fresh subscription that receives the full backlog from the backend; this is what makes the bug appear intermittently.

`PodView.tsx` does not register any `'status'` listener and works correctly. It relies on the backend to terminate the stream when there is nothing more to send.

## Goals / Non-Goals

**Goals:**
- Image installation logs stream continuously for the lifetime of a build without being interrupted by frontend logic.
- Behavior matches the working pattern in `PodView.tsx`: backend owns stream termination.
- Minimal change surface — only `InstallationLog.tsx` is modified.

**Non-Goals:**
- Stabilizing `useEffect` dependencies on `t` and `showNotification`. The same shape exists in `PodView` and is not implicated in #3083.
- Persisting the visible log buffer across tab switches.
- Frontend interpretation of `event: status` payloads.
- Adding manual verification steps to the spec.

## Decisions

### Decision: Remove the `'status'` listener entirely instead of inspecting payload

**Choice:** Drop the `handleStatus` function and the `addEventListener('status', ...)` / `removeEventListener('status', ...)` calls.

**Rationale:**
- The working sibling (`PodView.tsx`) has never listened to `'status'` and produces correct behavior, demonstrating that the backend already terminates streams cleanly.
- Inspecting `event.data` to close only on terminal statuses would couple the frontend to a status vocabulary we do not currently model in this codebase, and would require backend documentation we do not have.
- Dropping the listener restores the contract that stream lifetime is owned by the backend, consistent with the rest of the SSE consumers in the app.

**Alternatives considered:**
- *Inspect status payload and close only on terminal values.* Rejected: introduces backend-coupled string matching; the listener offers no value if the backend already closes on completion.
- *Stabilize `useEffect` deps as part of the same change.* Rejected: scope creep; not implicated in #3083 and `PodView` proves the current dep shape works.

### Decision: Do not introduce frontend deduplication of replayed logs

**Choice:** Keep the existing append-on-event behavior. The component's local `logs` state is reset to `''` on unmount and rebuilt from the backend's full replay on remount, which avoids duplication naturally.

**Rationale:**
- Removing the `'status'` close does not change unmount/remount behavior.
- Adding dedup logic would require maintaining a sequence/offset, which the current event payload does not carry.

## Risks / Trade-offs

- **Risk:** Backend never closes the stream on build completion, leaving an open SSE connection on the Installation log tab. → **Mitigation:** Same risk already applies to `PodView` and has not been reported in production. The connection is closed by the existing `useEffect` cleanup when the user navigates away or unmounts the tab. No new exposure.
- **Risk:** A future backend change emits structured status events the frontend should react to. → **Mitigation:** Out of scope here; can be reintroduced as a separate change with explicit terminal-status semantics.

## Migration Plan

Single-file code change with no data, schema, or API impact. Rollback is a straight revert. No feature flag needed.
