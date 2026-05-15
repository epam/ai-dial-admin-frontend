## ADDED Requirements

### Requirement: Audit row click opens detail in new tab (standalone)
When the user clicks a row in the standalone audit activities list (no `entity` prop), the system SHALL open the activity detail page in a new browser tab using `window.open`. The current browser tab SHALL remain on the audit list page.

#### Scenario: Row click on standalone list
- **WHEN** the user clicks a data row on the standalone activity audit page (`/activity-audit`)
- **THEN** a new browser tab opens with the activity detail URL (`/activity-audit/{activityId}`)
- **THEN** the standalone list page remains open in the original tab

#### Scenario: Row click on parent row with children (standalone)
- **WHEN** the user clicks a parent activity row that has child activities
- **THEN** no navigation occurs (existing guard preserved)

#### Scenario: Row click on deployments view with non-deployment resource
- **WHEN** the user is in deployments view and clicks a row whose `resourceType` is not a deployment manager resource
- **THEN** no navigation occurs (existing guard preserved)

### Requirement: Audit row click opens detail in new tab (entity tab)
When the user clicks a row in the entity audit tab (rendered inside `EntityAudit` with an `entity` prop), the system SHALL open the activity detail page in a new browser tab using `window.open`. The entity page SHALL remain open in the original tab.

#### Scenario: Row click on entity audit tab
- **WHEN** the user clicks a data row in the entity audit tab (e.g., on a Model entity page)
- **THEN** a new browser tab opens with the entity-scoped activity detail URL (e.g., `/models/{modelName}/{activityId}`)
- **THEN** the entity page remains open in the original tab with the Audit tab still active

#### Scenario: Row click for activity with no resolvable entity route
- **WHEN** the user clicks a row whose `entityType` has no corresponding route in `auditResourceRoute`
- **THEN** no navigation occurs (empty href guard)

### Requirement: Audit tab return mechanism removed
The session-storage-based `audit-tab-return` mechanism (introduced in PR #3306) SHALL be removed. Entity page tabs SHALL initialize to their default state (`EntityViewTab.Properties`) regardless of prior navigation.

#### Scenario: Entity page loaded after navigating from activity detail
- **WHEN** the user opens an activity detail from the entity audit tab (now opens in new tab)
- **THEN** the entity page tab state is not affected (user never left the entity page)

#### Scenario: Entity View.tsx initializes active tab
- **WHEN** an entity view page loads
- **THEN** the active tab initializes to `EntityViewTab.Properties` (default, no session storage read)
