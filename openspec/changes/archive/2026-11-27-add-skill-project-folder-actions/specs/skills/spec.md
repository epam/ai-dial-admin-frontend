## MODIFIED Requirements

### Requirement: Skill asset list offers delete, bulk delete, folder creation, and skill creation; no import, export, or row-level move
The system SHALL offer row-level delete and multi-select bulk delete on the Skills asset list, and
SHALL offer a `Create` toolbar action with two options, `Folder` and `Skill`. The system SHALL offer a
context menu on every grouping-folder row and folder-tree node with `Add sibling`, `Add child`,
`Manage permissions` and `Delete`, and SHALL hide it for read-only admins. The system SHALL NOT
offer import, export, or a row-level move-to-folder action, since this surface's authoring is limited
to creating a skill and its containing folders, and Move is offered on the detail view instead (see
the Save/Discard requirement below).

#### Scenario: Row delete removes a single skill
- **WHEN** a user deletes a single skill row and confirms
- **THEN** that skill is deleted and the list refreshes without it

#### Scenario: Bulk delete removes the selected skills
- **WHEN** a user selects several skills and confirms bulk delete
- **THEN** each selected skill is deleted and the list refreshes without them

#### Scenario: Create offers exactly Folder and Skill
- **WHEN** a user opens the Skills asset list toolbar's `Create` action
- **THEN** exactly two options are offered: `Folder` and `Skill`

#### Scenario: No import, export, or row-level move action is present
- **WHEN** a user opens the Skills asset list toolbar and row actions
- **THEN** no import, export, or move-to-folder action is offered

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
