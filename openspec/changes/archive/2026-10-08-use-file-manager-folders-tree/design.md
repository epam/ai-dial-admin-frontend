## Context

`FolderList` is a context-bound, read-only folder tree used by Folders Storage (`useRuleFolder`), the
Publications rules-structure popup (`useRuleFolder`, `disableAutoFetch`) and Create Asset
(assets contexts, `rootPaths`). It hand-renders the tree. `@epam/ai-dial-react-file-manager`
(`0.3.0-dev.25`, already a dependency, styles already imported in `app/[lang]/layout.tsx`) exports
`DialFoldersTree`, the same tree the FileManager sidebar uses.

The contexts own all tree state: `files`, `expandedFolders`, `filePath`, `fetchedFoldersData`, and
`toggleFolder(node)` (which selects, toggles expansion and fetches children). Hierarchy fetches with
`initialPath` also expand folders programmatically.

## Goals / Non-Goals

**Goals:**
- Render the tree through `DialFoldersTree`, with the library's look and keyboard/ARIA behavior.
- Keep `FolderList`'s props, call sites, fetch effects, scroll-to-selected, loader and empty states.

**Non-Goals:**
- Editing (rename/create/context menu), per-node spinners, context changes, library changes.

## Decisions

### 1. `FolderList` stays as the adapter; the tree replaces only `renderTree`

Fetch effects, `scrollToFolder`, root-path filtering, loader and the `NoFolders` state stay in
`FolderList`. `DialFoldersTree` is rendered only when there is data, so its own empty state is never
shown. *Alternative:* expose `DialFoldersTree` at each call site — rejected, it would duplicate the
context wiring three times.

### 2. Controlled expansion with the context as the single owner

The tree's `togglePath` runs after `onItemClick`. Mapping is:

| Context | `DialFoldersTree` |
|---|---|
| `expandedFolders` | `expandedPaths` |
| `filePath` | `selectedPath` |
| `Object.keys(fetchedFoldersData)` | `loadedPaths` |
| `toggleFolder(node)` | `onItemClick` |
| no-op | `onExpandedPathsChange` |

The library decides "controlled" by the presence of `onExpandedPathsChange`. Omitting it makes the
tree keep its own state, which never sees the context's programmatic expansion
(`fetchFolderHierarchy`) and can disagree with `toggleFolder`, which may collapse a folder again
after a fetch. Passing a real handler would toggle twice (once in `toggleFolder`, once via the
tree). So the handler is a deliberate no-op, with a comment saying why. *Alternative:* diff the new
set and call `toggleFolder` — rejected, `toggleFolder` already fires from `onItemClick` and would
double-run.

`loadedPaths` reproduces the old rule (caret hidden once a folder is fetched and has no
subfolders), which the library implements as `isLoaded && !hasValidItems`.

### 3. Dot-folders stay visible

`areHiddenFilesVisible` is set, since the library hides names starting with `.` by default and
`FolderList` has always listed them. `showFiles` stays off (folders only).

### 4. Type bridge: one cast at the boundary

Admin `DialFile` has optional `nodeType`/`name`/`folderId` and its own `DialFileNodeType`; the
library's are required and a distinct enum type (same runtime values `'folder'`/`'item'`, which is
all the tree compares). The admin `FileManager` wrapper already hands admin nodes to the library
with a cast (`items={filteredFiles as []}`), and context folders always carry `name` and
`nodeType`. So `FolderList` casts `folderData` once, at the `items` prop. *Alternative:* a mapping
helper that clones nodes and fills defaults — rejected: it adds a clone per render, breaks object
identity and needs a path lookup to get back to the original node.

### 5. Click handler typing

The tree returns the same node objects it was given, so `onItemClick` casts the node back to
`Asset` and calls the context's `toggleFolder` through the existing `unknown`-typed accessor (the
context types do not expose `toggleFolder`; see the comment in `FolderList`).

### 6. Loading and empty states stay full-pane

The contexts expose one boolean (`isFetchingFiles` / `isLoading`), not per-path loading, so
`loadingPaths` is not used. Empty state uses the existing `DialNoDataContent` with
`EntitiesI18nKey.NoFolders`.

### 7. Scroll-to-selected unchanged

`scrollToFolder` polls for `[aria-selected="true"]`; library rows render `aria-selected` on each
`treeitem`, so the selector keeps working. The tree's `autoFocus` stays off — focus must not jump
into the sidebar on page load.

### 8. Accessibility

Tree semantics (`role="tree"`, roving tabindex, arrows/Home/End, `aria-level`) come from the
library. `ariaLabel` is `t(FoldersI18nKey.Folders)` instead of the English default. No Escape
handler (`onEscape` unused), so the Publications popup's own close behavior is unaffected.

## Risks / Trade-offs

- **[Dot-folders vanish]** if `areHiddenFilesVisible` is forgotten → set it and cover with a test.
- **[Double/zero toggle]** if the controlled-mode contract changes in a library release → the spec
  asserts one `toggleFolder` call per click and expansion following the context; a library bump
  fails there first.
- **[Library API is `0.x-dev`]** → pinned by the existing dependency; the adapter touches a small
  prop surface.
- **[Visual change]** accent border and pill style differ → intended; affects three screens.
- **[Row wrapped in a ui-kit `Dropdown`]** the library wraps each row in a `Dropdown` even with no
  menu items; with no `getContextMenuItems` it registers no triggers, so no behavior change is
  expected.

## Migration Plan

Single PR, no data or config migration. Rollback is a revert of `FolderList.tsx`, its helper and
spec.

## Open Questions

None.
