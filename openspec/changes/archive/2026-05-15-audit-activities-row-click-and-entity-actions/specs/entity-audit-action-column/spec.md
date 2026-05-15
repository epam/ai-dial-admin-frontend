## ADDED Requirements

### Requirement: Entity audit tab grid has action column
The audit activities grid rendered inside the entity audit tab SHALL include an action column with the same operations as the standalone list.

#### Scenario: Action column visible on entity audit tab
- **WHEN** the user views the Activities sub-tab in an entity's Audit tab
- **THEN** the grid displays an action column as the last column
- **THEN** the action column contains an "open in new tab" button for each row

#### Scenario: Rollback action visible for non-read-only admin
- **WHEN** the current user is not a read-only admin
- **THEN** the action column also contains a "rollback" button for each row

#### Scenario: Rollback action hidden for read-only admin
- **WHEN** the current user is a read-only admin
- **THEN** the action column does not contain a "rollback" button

### Requirement: Entity audit tab "open in new tab" action uses entity-scoped URL
The "open in new tab" action in the entity audit tab SHALL open the activity detail using the entity-scoped URL, not the standalone audit URL.

#### Scenario: Open in new tab from entity audit tab
- **WHEN** the user clicks "open in new tab" for a row in the entity audit tab
- **THEN** a new browser tab opens with the entity-scoped detail URL (e.g., `/models/{modelName}/{activityId}`)

#### Scenario: Open in new tab for activity with no resolvable route
- **WHEN** the user clicks "open in new tab" for a row whose `entityType` has no route in `auditResourceRoute`
- **THEN** no navigation occurs

### Requirement: Entity audit tab "rollback" action uses existing rollback modal
The "rollback" action in the entity audit tab SHALL open the same confirmation modal used by the standalone list.

#### Scenario: Rollback action triggers confirmation modal
- **WHEN** the user clicks "rollback" for a row in the entity audit tab
- **THEN** the rollback confirmation modal opens with the activity details displayed
- **THEN** confirming the modal executes `rollbackEntityPerType` and shows a success or error notification

#### Scenario: Rollback action on parent row (entity tab)
- **WHEN** the user views a parent activity row that has children
- **THEN** the rollback button is hidden for that row (consistent with standalone list behavior)
