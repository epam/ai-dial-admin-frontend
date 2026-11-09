## MODIFIED Requirements

### Requirement: Analytics view rows open the global audit detail page

For every resource type in the Analytics view, `/activity-audit/{activityId}` SHALL be reachable from
a row by two entry points, and **both SHALL open it in a new browser tab**, leaving the list in the
tab it is in: the row action menu's `Open in a new tab` item, and the row's Activity ID link (the first column
after the row expander). A click elsewhere on the row body SHALL NOT navigate. Opening in a new tab is the shared, pre-existing
behaviour of this list, which the `Config` and `Deployments` views already have; this capability
changes only which resource types are navigable at all, never the tab a row opens in. No analytics
resource type SHALL remain a no-op row, and no entity-namespaced audit detail route
(`/tables/{name}/{activityId}` and its siblings) SHALL be introduced by this capability.

#### Scenario: Row body click opens the detail page in a new tab

- **WHEN** the user clicks the Activity ID link of an Analytics view row whose `activityId` is `abc-123`
- **THEN** a new browser tab opens at `/activity-audit/abc-123`
- **AND** the tab holding the list stays on `/activity-audit`

#### Scenario: The row menu's Open in a new tab item opens the detail page

- **WHEN** the user clicks `Open in a new tab` in the action menu of an Analytics view row whose
  `activityId` is `abc-123`
- **THEN** a new browser tab opens at `/activity-audit/abc-123`
