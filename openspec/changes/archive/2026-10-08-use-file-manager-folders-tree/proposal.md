## Why

`FolderList` (Folders Storage, Publication rules popup, Create Asset) renders its own hand-rolled
tree, while the Files/Assets views already show the FileManager sidebar tree from
`@epam/ai-dial-react-file-manager`. The two trees look and behave differently, and the hand-rolled
one has no tree semantics (no `role="tree"`, no keyboard navigation). The library already exports
`DialFoldersTree` as a standalone, controlled component, so we can drop the duplicate rendering.

## What Changes

- `apps/ai-dial-admin/src/components/Common/FolderList/FolderList.tsx` keeps its name, props and
  role as the context-bound adapter (auto-fetch, `initialPath` hierarchy fetch, scroll-to-selected,
  loader and "no folders" states, root-path filtering) but renders its tree through `DialFoldersTree`
  instead of its own `renderTree`.
- The tree is used **read-only**: no rename, create-folder, context menu or per-row actions are wired.
- The tree is driven by the existing folder context: `expandedFolders` → `expandedPaths`,
  `filePath` → `selectedPath`, `fetchedFoldersData` keys → `loadedPaths`, click → `toggleFolder`.
  The context stays the single source of truth for expansion (no second, internal expand state).
- Dot-prefixed folders stay visible (the library hides them by default).
- Visual style changes to the library's (pill-shaped highlight, caret rotation, folder icons); the
  old left accent border and per-level `pl-*` padding go away.
- Keyboard and screen-reader semantics come with the library tree (`role="tree"`, arrow/Home/End
  navigation, `aria-level`); the tree's accessible name is localized.
- `FolderList.spec.tsx` is rewritten against the adapter's contract rather than the old DOM.

### Non-goals

- No change to `FolderList` props or to its three call sites (`CreateAsset`, `FoldersStorage`,
  `RulesStructure`).
- No change to `RuleFolderContext` / `AssetsFolderContext` fetching or expansion logic.
- No folder editing (rename/create/delete/move) and no context menus.
- No per-node loading spinners; the existing full-pane loader stays.
- No changes in `ai-dial-react-file-manager` or `ai-dial-ui-kit`.

## Capabilities

### New Capabilities
- `folder-list-tree`: the read-only folder tree shown by `FolderList` — what it displays (folders
  only, including dot-folders, root paths excluded), selection/expansion driven by the folder
  context, loading and empty states, and tree keyboard/ARIA behavior.

### Modified Capabilities

None. No existing spec describes `FolderList`; the `platform-*` "folder tree" requirements refer to
the FileManager tree.

## Impact

- Code: `Common/FolderList/FolderList.tsx` and its spec; possibly a small mapping helper (admin
  `DialFile` → library `DialFile`, whose `nodeType`/`name`/`folderId` are required and whose enums
  are distinct types) next to it, reusing the existing FileManager adapter if one fits.
- Shared component: affects Folders Storage, the Publications rules-structure popup and Create Asset
  (Applications/Toolsets) — all visually, none functionally.
- Tests: `test-setup.tsx` may need a `DialFoldersTree` mock; expand/select behavior is covered
  through the adapter.
- Dependencies: none new — `@epam/ai-dial-react-file-manager` `0.3.0-dev.25` already exports
  `DialFoldersTree`, and its styles are already loaded for FileManager.
