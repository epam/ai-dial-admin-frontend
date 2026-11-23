## Context

The folder providers live in `[lang]/layout.tsx` (`AssetFolderProviders`), so `files`, `filePath`, `expandedFolders` and `fetchedFoldersData` survive navigation to a details page. `FileManager.tsx` loads the roots only when `files` is empty. `RootsLoaded` keeps an existing `filePath` (`!state.filePath || resetFolder ? openPath : state.filePath`), so a tree that comes back empty with a non-empty `filePath` ends up with a selected folder that is neither in the tree nor in `fetchedFoldersData`: the grid shows nothing until a refresh clears `filePath`.

Folder crumbs on a details page avoid this by calling `fetchFolderHierarchy(path, true)` (`Breadcrumbs.onOpenFolder`), which replaces the state in one `HierarchyLoaded` dispatch. The menu item and the section crumb do not.

## Goals / Non-Goals

**Goals:**
- A listing that mounts with a nested selected folder the tree does not hold shows that folder's content.
- One fix point covering every way back to the list (menu, section crumb, browser back).

**Non-Goals:**
- Restoring the `platform/` root of Applications and Toolsets after a hierarchy restore.
- Changing reducer actions or `Breadcrumbs.onOpenFolder`.
- Identifying what empties the tree on the way back.

## Decisions

**D1. Restore in the `FileManager` mount effect.** The existing effect (runs on `files`) branches: if `filePath` is nested and `fetchedFoldersData[filePath]` is missing and the context offers `fetchFolderHierarchy`, call `fetchFolderHierarchy(filePath, true)`; otherwise keep the root fetch. Alternatives: (B) have the section crumb and menu item call the loader before navigating, which misses browser back and duplicates logic; (C) reset `filePath` in `RootsLoaded` when it is not in the loaded tree, which drops the user's folder.

**D2. "Nested" means more than one path segment.** `fetchFolderHierarchy` already ignores paths with no `/`; a root such as `public/` also has nothing to restore, so only a path with a segment below the root triggers the hierarchy load. The check lives in a small pure helper next to the hierarchy utils, tested on its own.

**D3. `fullTree: true`.** Same as the crumb flow, so every level keeps all its entries and siblings stay visible in the tree.

**D4. Keep `setLoadedPaths`.** The local `loadedPaths` set is seeded with the root paths as before; `treeLoadedPaths` already merges `fetchedFoldersData` keys, so restored levels count as loaded.

## Risks / Trade-offs

- [Applications/Toolsets `platform/` root missing after restore] → Accepted; the user can still reach it through a normal root load after a refresh. Recorded as a non-goal.
- [Hierarchy load fails mid-chain] → `fetchFolderHierarchy` dispatches `FetchFailed` and leaves state unchanged, so the listing shows its existing error state; no retry loop is added.
- [Effect re-runs on every `files` change] → The branch only fires when the selection is uncached; after a successful load `fetchedFoldersData[filePath]` is set, so it does not repeat.
- [Races with a root fetch] → Both paths go through `startRequest`; only the latest request writes `files`, so the later one wins.

## Open Questions

None.
