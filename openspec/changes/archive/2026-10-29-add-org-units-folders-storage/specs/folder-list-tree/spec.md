## MODIFIED Requirements

### Requirement: Folder list renders a read-only folder tree
`FolderList` SHALL render the folders held by its folder context as a tree using the FileManager
folders tree, showing folders only and including folders whose names start with a dot. Folders at a
file-root path SHALL NOT be listed. The tree SHALL offer no rename, create, delete or context-menu
actions. When the folder context exposes org units, a row whose folder is a unit SHALL carry a visible
unit marker that is hidden from assistive technology; a context without units SHALL render exactly as
before.

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

#### Scenario: Unit row is marked
- **WHEN** the context holds a unit whose folder equals a listed node's path
- **THEN** that row shows the unit marker and its sibling plain folders do not

#### Scenario: Unit icon is neutral and distinct
- **WHEN** a unit row is drawn
- **THEN** it uses the organisation-structure icon in the secondary text colour in place of the folder icon

#### Scenario: Content-page file manager marks units too
- **WHEN** a content-page file manager lists a unit folder in its tree or grid
- **THEN** that row carries the same unit icon

#### Scenario: Context without units is unchanged
- **WHEN** the context exposes no unit map (asset folder contexts, or units switched off)
- **THEN** no row shows a unit marker
