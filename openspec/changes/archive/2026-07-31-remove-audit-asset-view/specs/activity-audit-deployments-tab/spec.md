## MODIFIED Requirements

### Requirement: View-type selector is hidden inside the entity Audit tab

The `Config / Deployments` view-type dropdown rendered above the global activity-audit grid SHALL NOT be visible when `ActivityAuditList` is rendered inside an entity's Audit tab. The fetcher selection is fixed by the caller via the `viewMode` prop and not user-toggleable from this surface.

#### Scenario: View selector not rendered in entity context

- **WHEN** a user opens the Audit tab on any container deployment edit page
- **THEN** the `View` dropdown showing `Config / Deployments` options is not rendered
- **AND** the user cannot switch the fetcher selection

### Requirement: `ActivityAuditList` accepts a `viewMode` prop that fixes the fetcher and hides the toggle

The `ActivityAuditList` component SHALL accept an optional `viewMode?: ActivityAuditView` prop. When the prop is provided, the component SHALL:

- Use the supplied mode for fetcher selection (`Deployments` → `getDeploymentActivities`, `Config` → `getActivities`) and for column-set selection.
- Hide the `Config / Deployments` view-type dropdown.
- Ignore any internal state transitions of the view-type radio.

When the prop is omitted, the component's behavior SHALL be unchanged from the existing global activity-audit page (local view-type state initialized to `Config`, dropdown rendered when no entity is present).

#### Scenario: viewMode forces deployment-manager fetcher

- **GIVEN** `ActivityAuditList` is rendered with `viewMode={ActivityAuditView.Deployments}`
- **WHEN** AG Grid requests a row block
- **THEN** the datasource invokes `getDeploymentActivities`
- **AND** the `View` dropdown is not rendered

#### Scenario: Omitting viewMode preserves global page behavior

- **GIVEN** `ActivityAuditList` is rendered on `/activity-audit` with no `viewMode` prop and no `entity` prop
- **WHEN** the page loads
- **THEN** the `View` dropdown is rendered with exactly `Config / Deployments`
- **AND** the initial fetcher is `getActivities` (Config view default)
