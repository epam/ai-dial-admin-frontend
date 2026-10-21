## Context

`createFolderContext(getFilesFunc, name, getConfigFileNames?)` returns `{ Provider, useFolderContext }`.
Per provider it keeps `files` (the tree), `data` (items of one folder), `filePath` (selected folder),
`expandedFolders`, `fetchedFoldersData` (items cache by path), `isFetchingFiles`, and a ref of failed
config-file paths. Three entry points mutate them:

```
fetchFiles(path)            single folder: merge into tree, cache items, set data,
                            auto-expand the first node on first load / refresh
fetchFiles([rootA, rootB])  fetchRoots: both top-level nodes built in one setFiles call
                            (a deliberate fix for a two-fetch race, see the interface comment)
fetchFolderHierarchy(path)  walk path segments sequentially, then replace
                            files/cache/expanded/filePath/data in one go
toggleFolder(folder)        flip expansion, set filePath, fetch if uncached
```

`fetch*` results use a tri-state: `undefined` = failed, `null`/`[]` = nothing, array = items.

Constraints:
- 54 non-spec files consume the `use*Folder` hooks; 21 specs mock the per-entity modules.
- `asset-list-rows` requires the factory stay generic over the row type and the flat platform views
  fetch only the root list.
- `utils.md`: pure functions, no hooks/JSX, deterministic. `components.md` §8: prefer `useState`;
  `useReducer` only for genuinely interdependent state. `code-standards.md`: `async/await` over
  `.then`, booleans prefixed `is/has/can/should`, enums over string unions, types in `models.ts`.

## Goals / Non-Goals

**Goals:**
- Pin current behavior with tests before touching it.
- Pure logic out of the component, individually testable.
- Remove the four hazards listed in the proposal.
- Delete `data`; give failure an explicit signal.

**Non-Goals:** see the proposal (no consolidation of contexts, no external store, no change to what is
fetched, `RuleFolderContext` untouched).

## Decisions

### D1: Tests before code, and they pin quirks as quirks

The characterization suite lands first and passes against the unmodified factory. Where current
behavior is one a later step intentionally changes (arrival-order `data`, the early `isFetchingFiles`
reset, `data` describing a non-selected folder), the test is named for the current behavior and carries
a short comment naming the step that will flip it. Flipping it then shows up as a one-line diff in that
step's commit rather than as an unexplained failure.

- **Alternative:** write tests against the refactored code. Rejected — they would then encode the
  refactor's reading of the behavior, not the original's.

### D2: Extract pure helpers into `src/utils/files/`, keep React in the factory

New modules next to `folder.ts` / `root-folder.ts`:
- `loadFolderHierarchy({ fullPath, fullTree, fetchByPath })` → the computed
  `{ files, fetchedFoldersData, expandedFolders, filePath }` or `null` when a level fails. It is async
  but deterministic for given inputs (the fetcher is injected), so it fits `utils.md`.
- `buildRootNodes(paths, results)` and `toConfigFileItems(names)` — the synthesized-node construction
  currently inline in `fetchRoots`/`fetchByPath`.
- `getFolderItems(list)` — the `filter(nodeType === ITEM)` that appears three times.

Typing these generically removes most `as T` / `as unknown as T` / `as DialFile[]` casts; any that
remain sit at one documented boundary (the synthesized nodes), not scattered through the component.

### D3: One reducer for the lock-step state

`files`, `filePath`, `expandedFolders`, `fetchedFoldersData` (and, until D6, `data`) always change
together after a fetch, so they move into a `useReducer` with named actions (`rootsLoaded`,
`folderLoaded`, `hierarchyLoaded`, `folderToggled`, `fetchFailed`). This satisfies `components.md` §8
(interdependent fields) and is what makes D4 clean: the "auto-expand the first node on first load"
decision is made inside the reducer from current state, so no `toggleFolder` call is needed inside an
updater.

- **Alternative:** keep `useState` and `useRef` mirrors of the latest values to cure the stale
  closures. Rejected — the mirrors would be a second source of truth for exactly the fields that are
  hard to keep consistent.
- **Alternative:** one `useState` holding a state object. Rejected — same transition logic, spread
  across callers, none of the named actions.

### D4: Request ordering and in-flight count

Each user-initiated fetch gets an increasing request id held in a ref. Cache writes
(`fetchedFoldersData[path]`, tree merge) always apply — they are keyed by path and order-independent —
but updates to the *selected* folder (`filePath`, the displayed items) apply only for the newest
request. `isFetchingFiles` becomes derived from an in-flight counter (`isFetchingFiles = inFlight > 0`
via reducer actions), keeping the public field name and type.

### D5: Convert to `async/await`

`fetchRoots` and `fetchFiles` become `async` with `try/catch/finally` (as `fetchFolderHierarchy`
already is), per `code-standards.md`. Public signatures are unchanged (`void`-returning).

### D6: Remove `data`; derive, and make failure explicit

Findings from the consumers:
- `BaseAssetList` and `ImportModal` already prefer `fetchedFoldersData[filePath]` and fall back to
  `data` only when that entry is missing.
- `CreateAsset` reads only `data`, and uses `data == null` as its loading signal — which a failed fetch
  also produces (infinite spinner). Because `fetchFiles(path)` sets `data` for the fetched path even
  when `filePath` didn't change, it can also validate names and versions against the wrong folder.

All three switch to `fetchedFoldersData[filePath]`. The "failed" state that `data = null` stood in for
becomes an explicit field on the context (shape in Open Questions) backed by state, not the current
`failedFilePathsRef`, so consumers re-render when it changes.

- **Alternative:** keep `data` as a derived getter (`fetchedFoldersData[filePath] ?? null`) for a
  softer migration. Rejected for the end state — it preserves the ambiguity between "not loaded yet"
  and "failed" that is the actual defect — but it is a valid intermediate step if the consumer
  migration is split across commits.

### D7: Stable callbacks

With state in a reducer and no closure reads, `fetchFiles`, `fetchFolderHierarchy` and `toggleFolder`
can be wrapped in `useCallback` and the context value in `useMemo`. Before doing so, every consumer
that lists one of them in an effect dependency array is checked (`fetchFiles` appears in
`useCallback` deps in the platform `View`s) — stabilizing can only remove re-runs, but an effect that
*relied* on re-running each render would change behavior, and must be found first.

## Risks / Trade-offs

- **[Large blast radius: every Assets list and the publication pickers]** → D1 ordering; one behavior
  change per step; each step independently revertible.
- **[Reducer port subtly changes an edge case]** → the characterization suite from D1 runs unchanged
  against every later step; a changed expectation is a deliberate, commented flip.
- **[Race guard drops a response the UI needed]** → only the *selected-folder* update is guarded;
  cache writes are never dropped, so a later `toggleFolder` to that path hits the cache.
- **[Removing `data` breaks a fixture or mock]** → grep for `data:` in the 21 mocking specs and the
  `test-setup.tsx` mocks during the task; typecheck:specs catches fixture drift (it is at zero and
  blocking).
- **[Trade-off: more files]** — logic moves from one 290-line file to the factory plus a few small
  utils; accepted because each piece is now testable without React.

## Migration Plan

One PR, implemented in this order, one commit per step: (1) tests, (2) extraction, (3) reducer + async/await,
(4) the four hazard fixes, (5) `data` removal with consumer updates, (6) stable callbacks. No data or
API migration; rollback is a revert of the PR, or of a single step's commit.

## Implementation notes

Where the implementation settled differently from the decisions above:

- **D3, latest state in handlers.** Handlers read the committed state through one `stateRef` (a single
  read-only snapshot of the reducer state), not per-field mirrors. Selection decisions (`!filePath ||
  resetFolder`) moved into the reducer, so they see current state rather than the closure of the render
  that started the fetch.
- **D4, in-flight counter.** The counter is a plain `useState` next to the reducer, not reducer
  state; `isFetchingFiles` is `count > 0`.
- **D4, first-load landing.** The first load opens the tree's first node but keeps a selection the user
  made while the fetch was running; only a refresh also selects the first node.
- **D4, stale responses.** A response that is no longer the newest request still fills the cache and the
  tree (both keyed by path); it does not change the selection, and a stale refresh merges instead of
  replacing the cache. A stale failure does not set the error flag.
- **D6, notification text.** `CreateAsset` shows `FoldersI18nKey.LoadFolderError` ("Could not load the
  content of this folder.") when the context reports `hasFetchError`.
- **D6, import helper.** `ImportModal`'s private `getExistingFolderItems` moved to `Import/utils.ts` so
  it could be unit-tested.
- **D7.** `fetchFiles`, `fetchFolderHierarchy`, `toggleFolder`, `setFilePath` and `setExpandedFolders` are
  stable for the provider's lifetime, and the context value only changes with the state. The two
  setters were already stable `useState` setters, so they had to stay stable once they wrapped `dispatch`.
- **Not changed, but noticed.** `loadFolderHierarchy` names the placeholder after the current path segment
  when the next folder is missing from a non-empty level (the empty-level branch uses the next segment);
  pinned by a test, not fixed. `FolderList` re-runs its auto-fetch effect whenever the context value
  changes while the folder list is empty, so a persistently failing fetch retries on each state change,
  as it did before.

## Resolved Decisions

- **Failure signal shape: one boolean.** The context exposes a single `hasFetchError`: true when the most
  recent fetch for the selected folder failed, false once a later fetch succeeds. The factory keeps its
  internal per-path failed set for the config-file root logic (it decides whether `toggleFolder` may
  fetch), but that set is not part of the public surface.
- **`CreateAsset` on failure: a notification, nothing blocking.** The form renders with empty names and
  versions and an error notification is shown; the endless spinner is gone (the spinner is now tied to
  `isFetchingFiles`). No spec delta: the old behavior was a bug, not a requirement.
- **No browser-verification task** (user decision).

## Open Questions

- **Should step 4's race guard be per-provider or per-path?** Per-provider (one id) is simpler and
  matches how the UI shows one folder at a time; confirm no view shows two folders from one provider
  at once (the Applications view fetches two roots, but in a single `fetchRoots`).
