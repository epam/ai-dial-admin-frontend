# folder-list-tree Specification

## Purpose
TBD - created by archiving change use-file-manager-folders-tree. Update Purpose after archive.
## Requirements
### Requirement: Folder list renders a read-only folder tree
`FolderList` SHALL render the folders held by its folder context as a tree using the FileManager
folders tree, showing folders only and including folders whose names start with a dot. Folders at a
file-root path SHALL NOT be listed. The tree SHALL offer no rename, create, delete or context-menu
actions.

#### Scenario: Folders are listed, files are not
- **WHEN** the context holds folders and items
- **THEN** only folders appear as tree rows

#### Scenario: Dot-prefixed folder is shown
- **WHEN** the context holds a folder named `.config`
- **THEN** it appears in the tree

#### Scenario: Root path is excluded
- **WHEN** the context holds a node whose path is a file-root path
- **THEN** that node is not rendered

#### Scenario: No folder actions
- **WHEN** a user right-clicks or hovers a row
- **THEN** no context menu and no row action button appears

### Requirement: Selection and expansion follow the folder context
The tree SHALL mark the folder at `filePath` as selected and expand exactly the folders in
`expandedFolders`. Activating a folder row SHALL call the context's `toggleFolder` once with that
folder, and the tree SHALL NOT keep expansion state of its own.

#### Scenario: Click toggles through the context
- **WHEN** a user clicks a folder row
- **THEN** `toggleFolder` is called once with that folder and the row's expansion follows the
  context's `expandedFolders`

#### Scenario: Programmatic expansion is reflected
- **WHEN** the context expands folders (for example loading the hierarchy for `initialPath`)
- **THEN** those folders render expanded and the folder at `filePath` is marked selected

#### Scenario: Context collapses a folder after fetch
- **WHEN** `toggleFolder` removes a folder from `expandedFolders` after fetching it
- **THEN** the folder renders collapsed

#### Scenario: Fetched leaf folder shows no expander
- **WHEN** a folder has been fetched and has no subfolders
- **THEN** its expand caret is not visible

### Requirement: Folder list keeps its loading, empty and fetch behavior
`FolderList` SHALL show a loader while the context is fetching, a "no folders" message when
nothing is loaded, and SHALL auto-fetch roots or the `initialPath` hierarchy as before. When the
selected folder is rendered after an `initialPath` fetch, it SHALL be scrolled into view.

#### Scenario: Loader while fetching
- **WHEN** the context is fetching
- **THEN** a loader is shown and no tree is rendered

#### Scenario: Empty state
- **WHEN** fetching is done and there are no folders
- **THEN** the `NoFolders` message is shown

#### Scenario: Auto-fetch when empty
- **WHEN** the context has no files, `disableAutoFetch` is not set and there is no `initialPath`
- **THEN** the root path(s) are fetched

#### Scenario: Selected folder scrolled into view
- **WHEN** `initialPath` is given and the hierarchy loads
- **THEN** the row with `aria-selected="true"` is scrolled into view

### Requirement: Folder tree is keyboard and screen-reader accessible
The tree SHALL expose `role="tree"` with a localized accessible name, rows as `treeitem` with level
and expanded state, and SHALL support Arrow, Home and End keyboard navigation. It SHALL NOT take
focus on mount.

#### Scenario: Tree semantics
- **WHEN** the tree renders with nested expanded folders
- **THEN** it is queryable as a tree named by the localized "Folders" label and each folder as a
  treeitem

#### Scenario: Keyboard activation
- **WHEN** a user focuses a folder row and presses Enter
- **THEN** `toggleFolder` is called once with that folder

#### Scenario: No focus steal
- **WHEN** the tree mounts
- **THEN** no row receives focus automatically

