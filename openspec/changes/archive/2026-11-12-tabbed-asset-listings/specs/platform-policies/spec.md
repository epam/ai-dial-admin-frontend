## ADDED Requirements

### Requirement: Policy list is a flat grid with a cost-object column

The system SHALL render the policy list as the Platform tab's flat grid: every policy is one row, global policies
have an empty **Cost object** cell, and each project policy shows its cost object in the Cost object cell. Core keeps a
cost-object folder only while it holds a record, so the list SHALL NOT render cost-object folders as rows or tree
nodes, and SHALL NOT offer create-folder, rename-folder, move-to-folder or delete-folder.

#### Scenario: Global and project policies are shown as rows
- **WHEN** a user opens `/platform-policies` and Core holds `daily-cap` and `team-a/team-cap`
- **THEN** two rows are shown, `daily-cap` with an empty Cost object cell and `team-cap` with `team-a` in its Cost object cell

#### Scenario: Folder actions are not offered
- **WHEN** a user opens the header or row actions
- **THEN** no create-folder, rename-folder, move or delete-folder action is offered

#### Scenario: Read-only admin sees no mutating actions
- **WHEN** a read-only admin opens the policy list
- **THEN** no create, delete, or duplicate action is offered

## MODIFIED Requirements

### Requirement: Policy list columns are metadata-only
The system SHALL show name, cost object, author, created-at, and updated-at columns for policies, sourced
from Core's resource metadata and the policy's path, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the policy list loads
- **THEN** only metadata requests are issued, with no content request per row

### Requirement: Policy create modal
The system SHALL open a create modal from the header Create button requesting the policy name, an optional
**Cost object**, and the budget fields Core requires on every write (priority, what the policy applies to,
and a cost limit). A blank cost object SHALL create a global policy; a value SHALL create a project policy in
the folder of that cost object. The name and the cost object SHALL follow Core's entity-name rule. After success the system
SHALL show the existing success notification and navigate to the policy detail view.

#### Scenario: Blank cost object makes a global policy
- **WHEN** a user submits a valid name with the cost object left blank
- **THEN** the policy is written to `policies/platform/<name>` and the detail view opens

#### Scenario: A cost object makes a project policy
- **WHEN** a user submits a valid name with cost object `team-a`
- **THEN** the policy is written to `policies/platform/team-a/<name>`

#### Scenario: Create waits for a valid budget
- **WHEN** the priority is empty or no cost window is set in the create modal
- **THEN** Create is unavailable and the field shows its inline error

#### Scenario: Cost object starts blank
- **WHEN** a user opens the create modal from the header
- **THEN** Cost object is empty and editable

#### Scenario: Invalid name blocks create
- **WHEN** the name is empty or contains a character Core's entity-name rule rejects
- **THEN** an inline validation error is shown and Create is unavailable

## REMOVED Requirements

### Requirement: Policy list is a one-level folder tree of cost objects
**Reason**: Platform entities list as flat grids; the cost object is a column.
**Migration**: Replaced by "Policy list is a flat grid with a cost-object column".

### Requirement: Deleting a cost object folder deletes its policies
**Reason**: Cost-object folders are no longer rows, so there is nothing to delete as a folder. A cost-object folder still disappears in Core when its last policy is deleted.
**Migration**: Delete the policies themselves, one at a time; refusals stop the deletion per "Policy list offers duplicate and bulk delete".
