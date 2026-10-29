# project-publications Specification

## Purpose
The Approvals-facing Project publications — how Project publications appear in the shared Approvals list, are
enriched from Core folder metadata, and open in the dedicated Skill/Project publication view with Description,
Instructions and Context, approving, rejecting and deleting through the generic actions. Created by archiving change
`add-projects-entity`.

## Requirements

### Requirement: Approvals list shows Project publications
The system SHALL show pending Project publications in the existing Approvals list, labelled with the type `Project`,
and SHALL open one in the Project publication detail view. No separate menu item is added: Approvals remains a
single entry listing every publication type.

#### Scenario: A Project publication is listed with its type
- **WHEN** a pending publication whose resolved resource type is `PROJECT` exists
- **THEN** the Approvals list shows it with the type label `Project`

#### Scenario: Opening a Project publication shows the Project view
- **WHEN** a reviewer opens a Project publication from the list
- **THEN** the dedicated Project publication detail view is rendered

#### Scenario: The Approvals menu is unchanged
- **WHEN** a user opens the menu
- **THEN** Approvals is a single entry and no `Project Publications` item exists

### Requirement: Project publication is enriched from Core folder metadata
The system SHALL resolve a pending Project publication's resource through the shared complex-resource client's
metadata read, using the status-driven URL (source for pending add, review for review, target for delete), and
SHALL report a missing resource as a `Project not found` issue and an add whose target already exists as a
`Target project already exists` issue, rather than failing. Updating a Project publication SHALL recalculate the
target URL and SHALL NOT queue a JSON asset write.

#### Scenario: A missing project surfaces as an issue
- **WHEN** the project referenced by a pending publication cannot be found
- **THEN** the detail view shows a `Project not found` issue instead of failing to render

#### Scenario: An existing target surfaces as an issue
- **WHEN** a pending add publication's target project already exists
- **THEN** the detail view shows a `Target project already exists` issue

#### Scenario: Update recalculates the target and writes no asset
- **WHEN** a reviewer saves a Project publication with a changed target folder
- **THEN** the target URL is recalculated and no JSON asset PUT is issued

### Requirement: Project publication detail uses the Project Properties layout
The system SHALL render a Project publication in the dedicated complex-resource publication view with a
`Properties` tab and a `Permissions` tab. `Properties` SHALL show the standard publication fields (name, folder,
comment) followed by the same `Description`, `Instructions` and `Context` sections, with the same limits and
validation, as the Project detail view, staged locally and written to the project only when the reviewer saves
the publication. `PROJECT.md` and files outside `context/` SHALL NOT be shown.

#### Scenario: Tabs are Properties and Permissions
- **WHEN** a reviewer opens a pending Project publication
- **THEN** the tab bar shows `Properties` followed by `Permissions`

#### Scenario: Staged project edits are written on save
- **WHEN** a reviewer edits Description, Instructions or Context and saves the publication
- **THEN** `PROJECT.md` and the `context/` files are updated in the project's bundle in Core

#### Scenario: Discard clears staged changes without contacting Core
- **WHEN** a reviewer stages changes and discards them
- **THEN** the sections revert to the saved state and no request is sent

### Requirement: Project publication approve, reject and delete reuse the generic actions
The system SHALL approve, reject (with comment) and delete a Project publication through the same generic
publication actions as every other type, with Project-specific modal titles and descriptions.

#### Scenario: Approve a pending Project publication
- **WHEN** a reviewer approves a pending Project publication
- **THEN** the generic approve action runs with the publication's path and it leaves the pending queue

#### Scenario: Reject with a comment
- **WHEN** a reviewer rejects a pending Project publication with a comment
- **THEN** the generic reject action runs with the publication's path and the sanitized comment
