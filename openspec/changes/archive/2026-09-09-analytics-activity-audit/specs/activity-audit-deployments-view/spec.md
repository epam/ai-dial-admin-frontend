## MODIFIED Requirements

### Requirement: View selector exposes a Deployments option

The Activity Audit page SHALL render a `Deployments` option in the `View` dropdown alongside the
existing `Config` option, and — when `featureFlags.analyticsEnabled` is true — an `Analytics` option
alongside both (see the `activity-audit-analytics-view` capability for that view's own behavior). The
dropdown SHALL offer exactly the views that have a fetcher behind them: `Config` and `Deployments`
always, `Analytics` when the analytics feature is enabled — there SHALL be no disabled placeholder
option for a view with no fetcher behind it. The default selection on initial page load SHALL remain
`Config`. Selecting any offered option SHALL be available to all users including read-only admins.

#### Scenario: Deployments option visible on initial render
- **WHEN** the user opens `/activity-audit` for the first time with the analytics feature disabled
- **THEN** the `View` dropdown shows exactly the options `Config` and `Deployments`
- **AND** the dropdown value is `Config`

#### Scenario: Analytics option joins the list when the analytics feature is enabled
- **WHEN** the user opens `/activity-audit` for the first time with `featureFlags.analyticsEnabled` true
- **THEN** the `View` dropdown shows exactly the options `Config`, `Deployments`, and `Analytics`
- **AND** the dropdown value is `Config`

#### Scenario: Read-only admin can switch to Deployments view
- **WHEN** a read-only admin opens the View dropdown
- **THEN** the `Deployments` option is enabled and selectable
- **AND** the `Analytics` option, when offered, is likewise enabled and selectable
