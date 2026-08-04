## MODIFIED Requirements

### Requirement: View selector exposes a Deployments option

The Activity Audit page SHALL render a `Deployments` option in the `View` dropdown alongside the existing `Config` option. The dropdown SHALL offer exactly these two views — there SHALL be no disabled placeholder option for a view with no fetcher behind it. The default selection on initial page load SHALL remain `Config`. Selecting `Deployments` SHALL be available to all users including read-only admins.

#### Scenario: Deployments option visible on initial render
- **WHEN** the user opens `/activity-audit` for the first time
- **THEN** the `View` dropdown shows exactly the options `Config` and `Deployments`
- **AND** the dropdown value is `Config`

#### Scenario: Read-only admin can switch to Deployments view
- **WHEN** a read-only admin opens the View dropdown
- **THEN** the `Deployments` option is enabled and selectable
