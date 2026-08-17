## MODIFIED Requirements

### Requirement: App-runner asset detail view tab set

The system SHALL render an app-runner asset's detail view with exactly five tabs — `Properties`, `Features`,
`Parameters`, `AppRoutes`, and `Interceptors` — and SHALL NOT include an `Applications` tab, an `Audit` tab, or a
Core-sync status banner.

The detail header SHALL offer one outbound create action, `Create Assets Application`, which opens the shared
asset-application create modal with the runner being viewed pre-selected as the new application's source. It SHALL
NOT offer an equivalent action for `Entities > Applications`: that reference is a foreign key into the admin
backend's own runner table, so an asset runner has no row to point at and the created application could only reopen
with an unresolvable source. Because a single valid target does not warrant a menu, the action SHALL be a single
button rather than the two-item dropdown `Entities > Application Runners` offers.

#### Scenario: Detail view renders exactly five tabs

- **WHEN** a user opens an app-runner asset's detail view
- **THEN** the tab list contains exactly `Properties`, `Features`, `Parameters`, `AppRoutes`, and `Interceptors`

#### Scenario: No Applications tab

- **WHEN** a user opens an app-runner asset's detail view
- **THEN** there is no `Applications` tab, unlike `Entities > Application Runners`

#### Scenario: No Audit tab or sync banner

- **WHEN** a user opens an app-runner asset's detail view
- **THEN** no `Audit` tab is present and no Core-sync status banner is rendered in the header

#### Scenario: No outbound create-application actions

Scoped to the entity variant. This scenario once prohibited both outbound create actions; the asset variant became
valid once asset runners were selectable from `Assets > Applications`, and is required by the scenarios below. The
heading is retained because a scenario's name is the identity a delta rewrites content under.

- **WHEN** a user opens an app-runner asset's detail view header
- **THEN** no action creating an entity `Application` is offered, since an asset runner is not addressable as an
  entity application's `application_type_schema_id`
- **AND** no `Create` dropdown is present offering an `Application` item, as `Entities > Application Runners` has

#### Scenario: The header offers a create-asset-application action

- **WHEN** a user opens an app-runner asset's detail view header
- **THEN** a `Create Assets Application` action is offered alongside `Delete`
- **AND** it is a single button, not a dropdown

#### Scenario: The create modal opens with the runner as a fixed source

- **WHEN** a user activates `Create Assets Application`
- **THEN** the shared asset-application create modal opens, requesting name, display name, version, and description
- **AND** no source field is offered, since the source is the runner the action was started from

#### Scenario: The new application references the runner by its Core resource name

- **WHEN** a user creates an asset application from a runner whose `$id` is `http://asdqwe`
- **THEN** the application's `application_type_schema_id` is `schemas/platform/http%3A%2F%2Fasdqwe`, the same
  reference form the `Assets > Applications` picker writes for an asset runner
- **AND** reopening that application shows the runner as its selected App Runner rather than a blank field

#### Scenario: Parameter defaults come from Core's resolved schema

- **WHEN** the create action seeds the new application's `applicationProperties`
- **THEN** the defaults are derived from DIAL Core's resolved-schema read for that runner, not the admin backend's
- **AND** if that read fails, the defaults are derived from the runner resource as loaded, so the modal still opens

#### Scenario: Creation reports its outcome and navigates to the new application

- **WHEN** the create request succeeds
- **THEN** a success notification naming the created asset application is shown and the browser navigates to that
  application's detail view
- **AND** when the request fails, an error notification carrying the server's message is shown and the modal stays
  open

#### Scenario: The action follows the header's existing gating

- **WHEN** the viewer is a read-only admin, or the runner has unsaved changes, or the JSON editor is open
- **THEN** the create action is not offered, exactly as `Delete` is not, rather than being offered in a disabled state
