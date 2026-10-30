## MODIFIED Requirements

### Requirement: Project list offers delete, bulk delete, folder and project creation; no import, export or move
The system SHALL offer row delete and multi-select bulk delete, and a `Create` toolbar action with the options
`Folder` and `Project`. The system SHALL offer a context menu on every grouping-folder row and folder-tree node
with `Add sibling`, `Add child`, `Manage permissions` and `Delete`, and SHALL hide it for read-only admins. The
system SHALL NOT offer import, export, or a row-level move action. Deleting a
grouping-folder row SHALL recursively delete every project and nested folder it contains through Projects' own
Core endpoints, bottom-up, stopping at the first failure.

#### Scenario: Create offers exactly Folder and Project
- **WHEN** a user opens the toolbar's `Create` action
- **THEN** exactly `Folder` and `Project` are offered

#### Scenario: Row and bulk delete remove projects
- **WHEN** a user confirms deleting one or several selected projects
- **THEN** each is deleted with its etag and the list refreshes without them

#### Scenario: Deleting a folder deletes its contents first
- **WHEN** a user confirms deleting a grouping folder that contains projects and nested folders
- **THEN** every project and nested folder is deleted before the folder itself

#### Scenario: A failed delete stops the folder delete
- **WHEN** deleting a project or nested folder fails partway through a folder delete
- **THEN** the operation reports failure and attempts no further deletes

#### Scenario: No import, export or move is offered
- **WHEN** a user opens the toolbar and row actions
- **THEN** no import, export, or move-to-folder action is present

#### Scenario: A folder has a context menu
- **WHEN** a user hovers a grouping-folder row or opens a folder's menu in the folder tree
- **THEN** the menu offers `Add sibling`, `Add child`, `Manage permissions` and `Delete`, and no rename or move

#### Scenario: Add child creates a folder inside the chosen folder
- **WHEN** a user chooses `Add child` on a folder, enters a valid name and confirms
- **THEN** an empty grouping folder is created inside that folder and the list shows it

#### Scenario: Add sibling creates a folder next to the chosen folder
- **WHEN** a user chooses `Add sibling` on a folder, enters a valid name and confirms
- **THEN** an empty grouping folder is created in the same parent as the chosen folder

#### Scenario: Manage permissions opens Folders Storage on the folder
- **WHEN** a user chooses `Manage permissions` on a folder
- **THEN** Folders Storage opens in a new tab with that folder selected

#### Scenario: Read-only admins get no folder menu
- **WHEN** a read-only admin hovers a folder row
- **THEN** no folder context menu is offered
