## MODIFIED Requirements

### Requirement: Audit row click opens detail in new tab (standalone)
In the standalone audit activities list (no `entity` prop) the Activity ID column SHALL be the first column after the row expander and SHALL render the id as a link that opens the activity detail page in a new browser tab; a click elsewhere in the row SHALL NOT navigate. The current browser tab SHALL remain on the audit list page.

#### Scenario: Row click on standalone list
- **WHEN** the user clicks a row's Activity ID link on the standalone activity audit page (`/activity-audit`)
- **THEN** a new browser tab opens with the activity detail URL (`/activity-audit/{activityId}`)
- **THEN** the standalone list page remains open in the original tab

#### Scenario: Row click on parent row with children (standalone)
- **WHEN** a parent activity row has child activities
- **THEN** its Activity ID is plain text and clicking the row does not navigate

#### Scenario: Row click on deployments view with non-deployment resource
- **WHEN** the user is in deployments view on a row whose `resourceType` is not a deployment manager resource
- **THEN** its Activity ID is plain text and clicking the row does not navigate

### Requirement: Audit row click opens detail in new tab (entity tab)
In the entity audit tab (rendered inside `EntityAudit` with an `entity` prop) the Activity ID column SHALL be the first column after the row expander and SHALL render the id as a link that opens the activity detail page in a new browser tab; a click elsewhere in the row SHALL NOT navigate. The entity page SHALL remain open in the original tab.

#### Scenario: Row click on entity audit tab
- **WHEN** the user clicks a row's Activity ID link in the entity audit tab (e.g., on a Model entity page)
- **THEN** a new browser tab opens with the entity-scoped activity detail URL (e.g., `/models/{modelName}/{activityId}`)
- **THEN** the entity page remains open in the original tab with the Audit tab still active

#### Scenario: Row click for activity with no resolvable entity route
- **WHEN** a row's `entityType` has no corresponding route in `auditResourceRoute`
- **THEN** its Activity ID is plain text and no navigation occurs
