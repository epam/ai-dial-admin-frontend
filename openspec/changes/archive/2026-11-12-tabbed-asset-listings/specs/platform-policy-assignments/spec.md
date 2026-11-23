## ADDED Requirements

### Requirement: Assignment list is a flat grid with a cost-object column

The system SHALL render the assignment list as the Platform tab's flat grid: every assignment is one row and shows
its cost object in the **Cost object** column. Every assignment has a cost object, so the Cost object cell SHALL never be
empty. The list SHALL NOT render cost-object folders as rows or tree nodes, and SHALL NOT offer create-folder,
rename-folder, move-to-folder or delete-folder.

#### Scenario: Entries are rows with their cost object
- **WHEN** Core holds `team-a/grant-1`
- **THEN** one row `grant-1` is shown with `team-a` in its Cost object cell

#### Scenario: Read-only admin sees no mutating actions
- **WHEN** a read-only admin opens the assignment list
- **THEN** no create, delete, or duplicate action is offered

## MODIFIED Requirements

### Requirement: Assignment list columns are metadata-only
The system SHALL show name, cost object, author, created-at, and updated-at columns, sourced from Core's
resource metadata and the assignment's path, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the assignment list loads
- **THEN** only metadata requests are issued, with no content request per row

### Requirement: Assignment create modal derives the cost object from the folder
The system SHALL open a create modal requesting **Cost object**, **ID**, **Policy**, and optionally
the subject rules, because Core needs a subject pinned by the policy or by the assignment. The cost object
SHALL name the folder the assignment is written to, and the saved body SHALL carry the same value as
`costObject`. The cost object is always entered in the modal and never pre-filled from the list. The ID SHALL
follow Core's entity-name rule.

#### Scenario: Cost object is entered, not inherited
- **WHEN** a user opens the create modal from the header
- **THEN** Cost object is empty and editable

#### Scenario: The folder and the body agree
- **WHEN** a user submits cost object `team-a` and ID `grant-1`
- **THEN** the write goes to `policy_assignments/platform/team-a/grant-1` and its body has `costObject` equal to `team-a`

#### Scenario: Missing required value blocks create
- **WHEN** the cost object, ID, or policy is empty or invalid
- **THEN** an inline validation error is shown and Create is unavailable

## REMOVED Requirements

### Requirement: Assignment list is grouped by cost object
**Reason**: Platform entities list as flat grids; the cost object is a column.
**Migration**: Replaced by "Assignment list is a flat grid with a cost-object column".

### Requirement: Deleting a cost object folder deletes its assignments
**Reason**: Cost-object folders are no longer rows, so there is nothing to delete as a folder. A cost-object folder still disappears in Core when its last assignment is deleted.
**Migration**: Delete the assignments themselves, one at a time.
