## Why

Issue #5500: after opening an entity from a folder and returning to the listing through the menu item (or the first breadcrumb, the section crumb), the last selected folder is still selected but its content is empty until a page refresh. Folder crumbs on the details page work because `Breadcrumbs.onOpenFolder` loads the whole folder chain through `fetchFolderHierarchy`; the menu item and the section crumb are plain `router.push` calls and the listing's mount effect only knows how to load the roots. It is the unfinished edge of issue #4901 (folder path in the details breadcrumb).

## What Changes

- On mount, the shared `FileManager` restores a selected nested folder that the tree does not hold: when `filePath` is below the root and `fetchedFoldersData[filePath]` is missing, it loads the folder chain with `fetchFolderHierarchy(filePath, true)` instead of the root fetch.
- When `filePath` is empty, a root, or already cached, behavior is unchanged (roots load only when `files` is empty).
- A context without `fetchFolderHierarchy` keeps the current root fetch.
- Applications and Toolsets keep two roots (`platform/`, `public/`); the hierarchy load builds a single-root tree, so the `platform` root is accepted as not restored on that path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `asset-folder-tree-expansion`: adds a requirement that the content-page FileManager restores the selected nested folder's chain when it mounts with a selection the tree does not hold.

## Impact

- `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx` (mount effect at the `files` check) and its colocated tests.
- Affects every listing that renders this wrapper through `BaseAssetList` (Applications, Toolsets, Prompts, Skills, Projects, Files, Conversations and the Platform listings). Contexts come from `createFolderContext`, which already exposes `fetchFolderHierarchy`; `RuleFolderContext` has its own implementation and is untouched.
- No backend API, dependency, or ui-kit change.

## Non-goals

- Preserving the `platform/` root on Applications and Toolsets after a hierarchy restore.
- Changing `RootsLoaded`/`HierarchyLoaded` reducer semantics or the Breadcrumbs `onOpenFolder` flow.
- Finding or removing whatever empties the tree on the way back from a details page; the restore makes the listing independent of it.
- Issue #4901's remaining checkbox: folder crumbs are already clickable through `onOpenFolder`.
