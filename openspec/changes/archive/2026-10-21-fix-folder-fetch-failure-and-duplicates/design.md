## Context

`createFolderContext` builds one provider per asset entity. Its `fetchRoots`, `fetchFolder` and
`fetchFolderHierarchy` each wrap an awaited fetch in `try { … } finally { request.finish() }`. The only
failure they model is a fetch that *returns* `undefined` (`FetchFailed`). A fetch that *throws* — a
server action rejecting during a session/token refresh — reaches `finally`, drops the in-flight
counter to 0 and dispatches nothing. Callers use `void fetchRoots(...)`, so the rejection is swallowed.
Resulting state: `files = []`, `filePath = ''`, not fetching, `hasFetchError = false` — what #5128
shows (`CreateAsset` loader keyed on `folderItems == null && !hasFetchError`, `FolderList` "No Folders").

`FolderList`'s empty-state auto-fetch effect depends on `folderContext`, a memoized object rebuilt on
any change. Starting a fetch flips `isFetchingFiles`, which rebuilds it and re-runs the effect while
`files` is still empty, so a second fetch starts, and so on. Next.js runs server actions serially
(`runRemainingActions` chain), so these queue.

The two defects interact: once failures are recorded (`FetchFailed`), the effect would see
`files` still empty, `isFetchingFiles` false and the context value changed, and **retry forever**. The
catch fix is therefore unsafe without the dedupe, and the dedupe must not be "skip while fetching".

## Goals / Non-Goals

**Goals**
- A fetch that throws ends in the same observable state as one that returns `undefined`.
- One empty-state auto-fetch per `FolderList` mount per root set, regardless of context re-renders.

**Non-Goals**
- Root cause of the first-call-after-login throw; automatic retry; other fetch paths (file manager,
  `FilePath`).

## Decisions

**D1 — Catch in the context, not in the callers.** Add a `catch` to the three fetchers that dispatches
`FetchFailed`, gated by `request.isLatest()` exactly like the existing `undefined` branch, so a stale
failure cannot overwrite a newer success. Alternative: `.catch` at `fetchFiles`' `void` call sites —
rejected, it would cover `fetchRoots`/`fetchFolder` only and leave `fetchFolderHierarchy` (called
directly) uncovered, and put policy in the dispatcher instead of next to the other failure branch.
`finally` stays, so in-flight accounting is unchanged.

**D2 — "Once per mount" guard in `FolderList`, via a ref.** A `useRef` holds the root-set key the
auto-fetch has already issued; the effect fetches only if the key differs. `rootPaths` is joined into a
string for the comparison so a new-but-equal array does not re-fetch. Alternatives considered:
- *Skip while `isFetchingFiles`* — rejected: it stops the pile-up but retries endlessly after a
  recorded failure (see Context), and does nothing for the empty-result case.
- *Drop `folderContext` from the dependency array* — rejected: breaks `react-hooks/exhaustive-deps`
  and would read a stale context in the effect.
- *Move the auto-fetch into the provider* — rejected: a larger change to a shared contract for 14
  providers; the provider does not know when a consumer is mounted.

The ref survives React Strict Mode's dev double-invoke, so that duplicate also disappears.

The `initialPath` branch (`fetchFolderHierarchy`) keeps its current behavior; it is not part of the
reported pile-up and has its own `files` emptiness guard.

## Risks / Trade-offs

- [A failed auto-fetch is not retried on its own; the modal stays on the error state until reopened] →
  matches what already happens for a returned `undefined`, and reopening mounts a fresh `FolderList`,
  which is what currently makes the second open work.
- [The guard keys on the root set, so if `rootPaths` genuinely changes mid-mount a new fetch is issued]
  → intended; `catalogEnabled` is static per session, so this is only a defensive path.
- [Shared by every `createFolderContext` provider and every `FolderList` consumer] → covered by
  provider-level and component-level specs rather than per-entity ones.
- [Hides rather than fixes the throw if the trigger is not the queue backlog] → the user now sees the
  load-error notification instead of an empty modal; the trigger investigation is a stated non-goal.

## Open Questions

- Does removing the duplicate fetches also remove the first-open failure? Needs one real re-login
  repro after the change.
