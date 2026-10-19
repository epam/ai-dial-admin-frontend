## Why

`createFolderContext` (`context/assets/AssetsFolderContext.tsx`, 290 lines) is the state machine behind
all 14 asset-folder providers, and it is the least-tested, most intricate code in `src/context/`: its
spec has 10 tests, none of which touch `toggleFolder`, `fetchFolderHierarchy`, or any failure path.
Reading it turns up real defects, not just style:

- `fetchFiles` calls `toggleFolder(...)` inside a `setFiles(prev => …)` updater — an impure updater that
  StrictMode runs twice.
- Responses are applied in arrival order, not request order, so a slow response for folder A can
  overwrite `data` after the user has moved to folder B.
- `isFetchingFiles` is a boolean, so the first of two overlapping fetches to finish clears it early.
- `toggleFolder`, `fetchFiles` and `fetchRoots` read `expandedFolders`, `fetchedFoldersData` and
  `filePath` from the render they were created in, including after an `await`.
- `data` duplicates `fetchedFoldersData[filePath]` — and, because `fetchFiles(path)` sets it for the
  fetched path even when `filePath` is unchanged, it can describe a *different* folder than the one
  selected. Its `null` also doubles as the failure signal, so `CreateAsset` shows its spinner forever
  when a fetch fails.

Now is a good time: the provider nesting was just flattened (`compose-asset-folder-providers`), and any
later consolidation of the 14 contexts is much cheaper on a tested, decomposed factory.

## What Changes

- **Characterization tests first.** Extend the factory's spec to pin current behavior of
  `fetchFiles` (single path and multi-root), `fetchFolderHierarchy`, `toggleFolder`, the config-file
  root, failure paths, and the hook's out-of-provider error. Quirks that a later step deliberately
  changes are marked as such in the test name.
- **Behavior-preserving extraction.** Move the pure parts out of the React component into
  `src/utils/files/` (hierarchy loading with an injected fetcher, root-node construction,
  config-file item mapping, the repeated "items only" filter), each unit-tested without React.
- **State consolidation.** Replace the five lock-step `useState`s (`files`, `data`/`filePath`,
  `expandedFolders`, `fetchedFoldersData`) with a single reducer whose actions are the named
  transitions; convert `.then/.finally` chains to `async/await` per `code-standards.md`; drop the
  `as T` / `as unknown as T` casts where the extracted helpers can be typed instead.
- **Fix the hazards above** as separate, individually tested steps: no side effect in an updater,
  latest-request-wins for the displayed folder, an in-flight counter for `isFetchingFiles`, and no
  stale-closure reads.
- **Remove `data` from the context.** Its three consumers (`BaseAssetList`, `ImportModal`,
  `CreateAsset`) read `fetchedFoldersData[filePath]` instead, and failure becomes an explicit signal
  rather than `null`.

## Non-goals

- Merging the 14 contexts into one or any `Map`/registry keyed by route or entity.
- Changing the per-entity wrappers, hook names, or `AssetsFolderContextReader`'s remaining shape.
- Touching `RuleFolderContext`.
- Changing which requests are made or what the backend returns. In particular the flat platform views
  keep fetching only the root list (`asset-list-rows`: "The flat platform views shed the tree
  machinery").
- Render-performance work beyond what falls out naturally; no external store.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
<!-- None expected. `asset-list-rows` ("The folder context is generic over the row model") constrains
     the factory's typing and the flat-platform-view fetching, and both are preserved; no requirement
     text changes. Revisit if the failure signal that replaces `data == null` turns out to be
     user-visible (see design: Open Questions). -->

## Impact

- **Code**: `context/assets/AssetsFolderContext.tsx` and its spec; new helpers and specs under
  `src/utils/files/`; the three `data` consumers — `components/Assets/BaseAssetList/BaseAssetList.tsx`,
  `components/EntityListView/Import/ImportModal.tsx`, `components/Assets/Deployments/CreateAsset.tsx`.
- **Public surface**: `AssetsFolderContext.data` is removed (internal API, 3 consumers). The 21 specs
  that `vi.mock` the per-entity modules, and any fixtures that supply `data`, need updating.
- **Risk**: medium. This is the state behind every Assets list, move/delete/duplicate flow, and the
  publication pickers. Mitigation is ordering: tests land before any code moves, and each behavior
  change is its own step with its own test.
- **Depends on**: `compose-asset-folder-providers` (no code dependency; sequencing only).
