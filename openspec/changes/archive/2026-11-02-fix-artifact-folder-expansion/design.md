## Context

The content-page `FileManager` supplies `setExpandedFolders` directly to `getTreeOptions`. The installed `@epam/ai-dial-react-file-manager` sends caret and Arrow-key expansion to `onExpandedPathsChange`, independently of `onPathChange`. Only the wrapper's folder-selection handler currently fetches children.

`AssetsFolderContext.fetchFiles` already merges a folder response into the tree without replacing an existing selection. Its `fetchedFoldersData` records successful loads, including empty folders; `isFetchingFiles` covers all pending context requests. Its public fetch signature is fire-and-forget, so callers cannot await completion. The wrapper also maintains a local `loadedPaths` set that is currently updated when requesting data, not necessarily on successful completion.

A design is included because cache and pending-request semantics need an explicit decision across this shared integration.

## Goals / Non-Goals

**Goals:** Load children on caret and keyboard expansion; preserve selection and navigation; reuse successful loads; prevent duplicate expansion requests while pending; permit retry on a later expansion after failure.

**Non-Goals:** Change FolderList, folder-name click semantics, backend contracts, package internals, or eager-fetch the entire hierarchy. No automated browser-verification task, as explicitly requested by the user.

## Decisions

### Wire an expansion-specific callback

Replace the `setExpandedFolders` argument to `getTreeOptions` with `onExpandedPathsChange`. Apply the requested set, then fetch paths newly added relative to the previous expanded set. Do not call the selection handler, `setFilePath`, `toggleFolder`, or the caller's `onPathChange` from this callback. Folder fetch completion must not reopen a folder collapsed while loading.

Alternative: `selectOnCaretClick: true` reuses selection but changes the grid and does not cover Arrow-key expansion. Rejected because it contradicts the agreed interaction.

### Distinguish successful cache entries from pending requests

Use `fetchedFoldersData` membership to recognize successful expansion loads, including an empty array. Do not treat request-start entries in the wrapper's local `loadedPaths` as proof of successful loading. Keep a small pending-path ref to suppress repeated expansion requests before a render and while a request is active. Release successful entries when their cache appears; release unresolved entries after an observed fetching cycle returns to idle, allowing a later close/open to retry. Do not clear freshly registered paths merely because the callback was invoked from an idle render.

The public context API remains unchanged. Extract this stateful logic to a narrowly scoped hook if it would otherwise obscure the wrapper's markup. Place it in `src/hooks/use-file-manager-expansion.ts`; keep any local object types in an adjacent dedicated model file. This avoids adding a general domain-aware abstraction under Common.

Alternative: change every context's fetch API to expose per-path completion or add provider-wide request coordination. Deferred: this issue only requires expansion requests to be coordinated and does not justify a broader context refactor.

### Preserve existing behavior outside expansion

Retain the existing name-click selection behavior, popup-path, root initialization, refresh, and mutation handlers. Route the selection handler's lazy fetch through the hook's same guarded `onFetchFolder` callback: the library calls selection and expansion consecutively for a collapsed folder name, so both must register/read pending paths synchronously to avoid duplicate requests before a render. Successful preloaded roots and child caches must not trigger new expansion fetches. Keep the existing provider error handling and listing notification path; do not emit a success toast or duplicate error notification for expansion.

### Verify the integration rather than vendor internals

Use the existing FileManager test harness to invoke its supplied expansion callback and check requests and absence of selection callbacks. Cover meaningful state transitions with rerenders or hook tests, and retain existing selection/root tests. The callback is shared by caret and keyboard in the installed library; tests need not reproduce the library's internal event implementation.

## Risks / Trade-offs

- [Shared wrapper affects multiple listings] → Test multi-root and synthetic file-root cache reuse and run existing FileManager regressions.
- [Global fetching state delays releasing a failed path while another fetch is active] → Retain the guard until the context becomes idle; do not poll or auto-retry. A later expansion after idle retries the unresolved folder.
- [Request-start `loadedPaths` masks failures] → Base expansion cache decisions on successful context data, not the local optimistic set.
- [Collapse/reopen while pending duplicates a request or completion reopens a collapsed folder] → Register pending paths synchronously and keep expansion independent of fetch completion.
- [Popup requests use legacy loading bookkeeping] → Keep their existing semantics; coordinate name selection with expansion, but broader request coordination is out of scope.

## Migration Plan

No data migration or configuration changes. Ship the shared integration and tests together. Rollback is reverting this change; stored folder data is unaffected.

## Open Questions

None blocking. Scope and selection semantics are confirmed; automated browser verification was explicitly declined.
