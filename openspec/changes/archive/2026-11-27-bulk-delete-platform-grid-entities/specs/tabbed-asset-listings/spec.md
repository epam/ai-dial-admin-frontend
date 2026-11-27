## MODIFIED Requirements

### Requirement: Platform tab is a flat grid

The system SHALL render the Platform tab as a flat grid of entities with no folder tree, no folder-create,
rename-folder or move-to-folder control, and the row actions the entity already offers on the platform bucket
(create, duplicate where supported, delete, open in new tab). Writable listings SHALL offer a selection column and
bulk delete. Policies and Policy Assignments SHALL list every record as a row with a **Cost object** column, and SHALL
NOT render cost-object folders as rows or offer to delete a folder.

#### Scenario: Entities are direct rows

- **WHEN** a user opens the Platform tab of `/platform-routes`
- **THEN** all routes are shown as direct grid rows with no folder-expand affordance

#### Scenario: Policy rows show their cost object

- **WHEN** Core holds `daily-cap` and `team-a/team-cap` and a user opens the Platform tab of `/platform-policies`
- **THEN** two rows are shown, and `team-cap` has `team-a` in its Cost object column while `daily-cap` has an empty Cost object cell

## ADDED Requirements

### Requirement: Writable flat listings support selection

The system SHALL show a leading checkbox column on writable Platform grids and the Public Aliases grid. The header checkbox SHALL select the filtered rows. Existing selections SHALL survive filtering, and switching listing tabs SHALL clear them. Read-only administrators and config.json listings SHALL NOT be offered bulk-delete selection controls.

#### Scenario: Selection column and select-all

- **WHEN** a writable Platform grid has a filter matching two of its rows and the admin selects the header checkbox
- **THEN** both matching rows are selected, nonmatching rows are not newly selected, and the checkbox column appears before the data columns

#### Scenario: Filter hides an existing selection

- **WHEN** an admin selects a row and changes a filter so the row is hidden
- **THEN** that row remains selected and remains included in the bulk-delete confirmation

#### Scenario: Switching listing tabs clears selection

- **WHEN** an admin selects rows and switches to another listing tab
- **THEN** no prior listing selection carries to the new tab or back to the original tab

#### Scenario: Read-only surfaces have no mutation selection

- **WHEN** a read-only admin opens a Platform or Public Aliases grid, or any admin opens a config.json grid
- **THEN** no bulk-delete selection column or Delete button is offered

#### Scenario: Entity picker selection is unchanged

- **WHEN** an admin uses a single- or multi-select entity picker
- **THEN** its selection and cross-tab behavior remain as specified for the picker, with no bulk-delete action

### Requirement: Selection controls match the file manager

The system SHALL style listing selection checkboxes, hover states, and row and header selection icons consistently with the file manager. When no rows are selected, row checkboxes SHALL appear on row hover or keyboard focus; when at least one row is selected, row checkboxes SHALL remain visible.

#### Scenario: No row is selected

- **WHEN** no rows are selected and the user hovers or focuses a row or its selection control
- **THEN** that row's checkbox is visible with the file-manager interaction styling

#### Scenario: A row is selected

- **WHEN** at least one row is selected
- **THEN** row selection checkboxes remain visible without hovering and their checked and mixed-state icons follow the file-manager styling

### Requirement: Bulk delete requires confirmation of selected entities

The system SHALL show a bottom actions panel with the selected count, a clear-selection control, and Delete when a writable listing has at least one selected entity, and SHALL hide it when none are selected. Activating Delete SHALL open a confirmation listing every selected entity; cancellation SHALL make no delete request. Confirmation SHALL delete only those listed entities from their actual source paths.

#### Scenario: Bottom actions panel appears for selected entities

- **WHEN** an admin selects one or more rows on a writable Platform or Public Aliases grid
- **THEN** a bottom panel shows the selected count and Delete, including on a listing without a tab row, and no bulk Delete appears beside Create

#### Scenario: Bottom actions panel disappears when selection is cleared

- **WHEN** the admin clears the selection from the bottom actions panel
- **THEN** all rows are deselected and the bottom actions panel disappears

#### Scenario: Confirmation lists all selected entities

- **WHEN** an admin selects multiple entities, including one hidden by a later filter, and activates Delete
- **THEN** the confirmation lists every selected entity before the admin can confirm

#### Scenario: Cancel deletion

- **WHEN** an admin cancels the confirmation
- **THEN** no entity is deleted and the selection remains available

#### Scenario: Confirm deletion

- **WHEN** an admin confirms deletion of the listed entities
- **THEN** the system sends delete requests for those entities' resource paths and does not request deletion of unselected rows

### Requirement: Bulk deletion reports outcomes and refreshes the source

The system SHALL show success notifications after successful deletion. If deletion fails, it SHALL show the returned error and refresh the affected source even if some deletions already succeeded. After either outcome, the list and counts SHALL reflect the refreshed source; the system SHALL NOT report a full success on failure.

#### Scenario: All selected entities are deleted

- **WHEN** deletion of every selected entity succeeds
- **THEN** a success notification is shown, the source list and counts refresh, deleted rows disappear, and the completed selection is cleared

#### Scenario: Delete stops after a partial failure

- **WHEN** some selected entities are deleted and a later Core deletion fails
- **THEN** the returned error is shown, no full-success notification is shown, and the source list and counts refresh to show the entities that remain

#### Scenario: Refresh fails after deletion

- **WHEN** the deletion finishes but refreshing the affected source fails
- **THEN** the list-load error is reported and the source count is not presented as a successful refreshed count
