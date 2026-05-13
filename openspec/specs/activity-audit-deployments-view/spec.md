# activity-audit-deployments-view Specification

## Purpose

Defines the `Deployments` view of the Activity Audit page: how it sources activities from the deployment-manager backend (`POST /api/v1/activities` at `DIAL_DEPLOYMENTS_API_URL`), the dedicated column set and singular resource-type labels it renders, the rollback / row-action / parent-child differences from the existing `Config` view, per-view AG Grid column-state persistence, filter handling, and the i18n keys required to localize the new labels.

## Requirements

### Requirement: View selector exposes a Deployments option

The Activity Audit page SHALL render a `Deployments` option in the `View` dropdown alongside the existing `Config` and disabled `Asset` options. The default selection on initial page load SHALL remain `Config`. Selecting `Deployments` SHALL be available to all users including read-only admins.

#### Scenario: Deployments option visible on initial render
- **WHEN** the user opens `/activity-audit` for the first time
- **THEN** the `View` dropdown shows the options `Config`, `Deployments`, and `Asset` (Asset disabled)
- **AND** the dropdown value is `Config`

#### Scenario: Read-only admin can switch to Deployments view
- **WHEN** a read-only admin opens the View dropdown
- **THEN** the `Deployments` option is enabled and selectable

### Requirement: Deployments view fetches activities from the deployment-manager backend

When the selected view is `Deployments`, the grid datasource SHALL call the `getDeploymentActivities` server action, which forwards the request to `POST /api/v1/activities` at `DIAL_DEPLOYMENTS_API_URL`. Pagination, sorting, and filter request shape SHALL mirror the existing `getActivities` action so the AG Grid infinite row model is reused unchanged. Results SHALL render in the same grid component used by the Config view.

#### Scenario: Selecting Deployments view triggers the deployment-manager backend
- **WHEN** the user switches the View dropdown from `Config` to `Deployments`
- **THEN** the next datasource call invokes `getDeploymentActivities` (not `getActivities`)
- **AND** the request payload includes `pageNumber`, `pageSize`, `sorts`, and `filters` in the same shape sent to the admin backend

#### Scenario: Pagination on Deployments view requests subsequent pages
- **GIVEN** the Deployments view is active and the user scrolls past the first page boundary
- **WHEN** AG Grid requests the next page
- **THEN** `getDeploymentActivities` is called with the incremented `pageNumber` and the same sort/filter state

### Requirement: Deployments view uses a dedicated column set

When the selected view is `Deployments`, the grid SHALL display the columns `Activity type`, `Resource type`, `Resource identifier`, `Version`, `Time`, `Initiated`, `Activity ID`, `Parent ID` in that order. The row-expander column from the Config view SHALL NOT be rendered. The `Parent ID` column is included for visual consistency with the Config view but is always rendered empty in this change — the deployment-manager backend emits flat activities and does not populate `parentActivityId`. The `Time` column SHALL retain its default `desc` sort and the same datetime formatter used by the Config view.

#### Scenario: Deployments columns rendered in correct order
- **WHEN** the user is on the Deployments view
- **THEN** the grid header reads `Activity type`, `Resource type`, `Resource identifier`, `Version`, `Time`, `Initiated`, `Activity ID`, `Parent ID` from left to right
- **AND** no row-expander column is rendered

#### Scenario: Parent ID column renders empty
- **WHEN** the grid receives any deployment activity row (which has no `parentActivityId`)
- **THEN** the `Parent ID` cell renders empty

### Requirement: Resource type column shows localized singular labels

The `Resource type` column SHALL display flattened, localized singular labels for the deployment-manager resource types. The mapping SHALL be: `AdapterDeployment` → `Adapter container`; `ApplicationDeployment` → `Application container`; `InterceptorDeployment` → `Interceptor container`; `McpDeployment` → `MCP container`; `NimDeployment` and `InferenceDeployment` → `Model serving`; `AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition` → `Image`; `ImageBuildDomainWhitelist` → `Global firewall`. The Config view's existing labels SHALL remain unchanged.

#### Scenario: Adapter deployment row displays singular label
- **WHEN** the grid receives an activity with `resourceType: "AdapterDeployment"`
- **THEN** the `Resource type` cell renders `Adapter container`

#### Scenario: Image definition rows flatten to "Image"
- **WHEN** the grid receives activities with `resourceType` values of `AdapterImageDefinition`, `McpImageDefinition`, `ApplicationImageDefinition`, or `InterceptorImageDefinition`
- **THEN** each row's `Resource type` cell renders `Image`

#### Scenario: NIM and Inference deployments both flatten to "Model serving"
- **WHEN** the grid receives activities with `resourceType` of `NimDeployment` or `InferenceDeployment`
- **THEN** each row's `Resource type` cell renders `Model serving`

#### Scenario: Image-build domain whitelist row displays "Global firewall"
- **WHEN** the grid receives an activity with `resourceType: "ImageBuildDomainWhitelist"`
- **THEN** the `Resource type` cell renders `Global firewall`

### Requirement: Version column is populated only for image-definition rows

The `Version` column SHALL render the activity record's `version` field (a nullable string supplied by the deployment-manager backend). When `version` is absent or empty the cell SHALL render as an empty string. The column SHALL only be visible in the Deployments view.

#### Scenario: Image activity with a version
- **WHEN** the grid receives an activity with `resourceType: "McpImageDefinition"` and `version: "1.2.0"`
- **THEN** the `Version` cell renders `1.2.0`

#### Scenario: Deployment activity has no version
- **WHEN** the grid receives an activity with `resourceType: "AdapterDeployment"` and no `version` field
- **THEN** the `Version` cell renders an empty string

#### Scenario: Version column hidden in Config view
- **WHEN** the View dropdown is set to `Config`
- **THEN** the grid does not render the `Version` column

### Requirement: Rollback affordances hidden in Deployments view

The system-level `Rollback` button in the page header SHALL NOT render when the active view is `Deployments`. The per-row action menu SHALL NOT include the `Rollback` action when the active view is `Deployments`. The existing rollback flow in the Config view SHALL remain unchanged.

#### Scenario: System rollback hidden
- **WHEN** the user switches to the Deployments view
- **THEN** the page-level `Rollback` button is not rendered

#### Scenario: Per-row rollback action hidden
- **WHEN** the user opens the action menu on any row in the Deployments view
- **THEN** the menu does not list a `Rollback` option

#### Scenario: Config view rollback preserved
- **WHEN** the user is on the Config view
- **THEN** the page-level `Rollback` button is rendered (unless the user is a read-only admin) and the per-row rollback action is available on each row

### Requirement: Deployments view row action menu shows Open-in-new-tab; click behavior depends on resource type

The per-row action menu in the Deployments view SHALL render exactly one item: `Open in new tab`. Click behavior depends on the row's `resourceType`:

- For `*ImageDefinition` activities (`AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`) and `ImageBuildDomainWhitelist` activities: clicking `Open in new tab` SHALL open `/activity-audit/{activityId}` in a new browser tab, and a row-body click anywhere outside the action menu SHALL navigate to the same URL in the current tab.
- For the six container subtypes (`AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`): clicking `Open in new tab` and a row-body click SHALL both remain no-ops, until a follow-up change ships container detail rendering.

#### Scenario: Only Open-in-new-tab is present in the menu
- **WHEN** the user opens the action menu on a Deployments view row
- **THEN** the only item is `Open in new tab`

#### Scenario: Image row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is one of the four `*ImageDefinition` types
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Image row body click navigates in the current tab
- **WHEN** the user clicks anywhere on an image-definition row outside the action menu
- **THEN** the current tab navigates to `/activity-audit/{activityId}`

#### Scenario: Global firewall row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is `ImageBuildDomainWhitelist`
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Container row clicks remain no-ops
- **WHEN** the user clicks `Open in new tab` or the row body on any of the six `*Deployment` rows
- **THEN** no navigation occurs in either the current tab or a new tab
- **AND** no audit detail page request is issued

#### Scenario: Audit detail route resolves deployment-manager activities for image and firewall types
- **WHEN** the user opens `/activity-audit/{activityId}` for an activity whose `resourceType` is one of the four `*ImageDefinition` types or `ImageBuildDomainWhitelist`
- **THEN** the detail page resolves the activity from the deployment-manager backend (falling back from the admin-backend lookup)
- **AND** renders the full diff view through `AuditView`

#### Scenario: Audit detail route still resolves admin-backend activities unchanged
- **WHEN** the user opens `/activity-audit/{activityId}` for an admin-backend activity
- **THEN** the detail page renders the full diff view as it does today, with the deployment-manager fallback not invoked

### Requirement: View switch clears AG Grid filters

When the user toggles the View dropdown between `Config` and `Deployments` (in either direction), the AG Grid filter model SHALL be cleared for every column. The time-period selector value SHALL be preserved across the switch. The grid sort SHALL also be preserved (the new column set reapplies the default `epochTimestampMs desc` sort).

#### Scenario: Switching from Config to Deployments resets filters
- **GIVEN** the user has typed `john` in the `Initiated` filter and `Application` in the `Resource type` filter
- **WHEN** the user changes the View dropdown to `Deployments`
- **THEN** both filters are empty before the new datasource is invoked
- **AND** the next request sent to `getDeploymentActivities` carries no filter for `initiatedEmail` or `resourceType`

#### Scenario: Time period preserved on view switch
- **GIVEN** the user has selected `Last 7 days` in the time-period selector
- **WHEN** the user switches between `Config` and `Deployments`
- **THEN** the time-period selector still shows `Last 7 days`
- **AND** the request issued after the switch includes the corresponding `epochTimestampMs ge` and `le` filters

### Requirement: AG Grid column state persists separately per view

Saved column state (widths, visibility) SHALL be persisted to localStorage under a key that includes the active view (for example `activity-audit:config` and `activity-audit:deployments`). Toggling the view SHALL load the column state for that view and SHALL NOT overwrite the other view's state.

#### Scenario: Resize a column on Deployments view does not affect Config view
- **GIVEN** the user has resized the `Resource identifier` column on the Deployments view
- **WHEN** the user switches to the Config view
- **THEN** the `Resource identifier` column on the Config view retains its previously saved width (or default width if none was saved)

### Requirement: Free-text filter on Resource type uses raw backend values

The `Resource type` column filter SHALL remain a free-text `contains` filter (consistent with the Config view). The filter value SHALL be sent unchanged to the backend in the existing `FilterDto` format (`column: "resourceType"`, `operator: "co"`, `value: <user input>`). Users may filter using raw backend values (e.g. `Adapter`, `Deployment`, `Image`); typing the localized singular label is not guaranteed to match because the backend stores the raw enum values.

#### Scenario: User types "Adapter" and matches deployments
- **WHEN** the user types `Adapter` in the `Resource type` filter
- **THEN** the request sent to `getDeploymentActivities` includes a filter `{ column: "resourceType", operator: "co", value: "Adapter" }`
- **AND** rows with `resourceType` values `AdapterDeployment` and `AdapterImageDefinition` are returned

### Requirement: Parent/child aggregation is bypassed in Deployments view

The Deployments view SHALL NOT apply the client-side parent/child grouping logic that the Config view applies (the deployment-manager backend emits flat activities). The grid SHALL pass the raw response rows straight to `params.successCallback` without computing an `activityMap` or attaching `children` arrays. The row-expander cell SHALL NOT appear in the column set. The `Parent ID` column is present for visual consistency with the Config view but always renders empty.

#### Scenario: Deployment response renders flat
- **GIVEN** `getDeploymentActivities` returns ten activity records, none with a `parentActivityId`
- **WHEN** the grid renders the page
- **THEN** all ten rows appear at the top level
- **AND** no row-expander cell is rendered
- **AND** no row exposes a `children` collection
- **AND** every row's `Parent ID` cell is empty

### Requirement: i18n keys provided for Deployments labels

The locale dictionary SHALL include new keys for: the `Deployments` view option label, the seven singular resource-type labels (`Adapter container`, `Application container`, `Interceptor container`, `MCP container`, `Model serving`, `Image`, `Global firewall`), and the `Version` column header. New keys SHALL live under an existing i18n key enum where one fits (per the project rule to reuse shared enums for common labels) or under the existing `TelemetryI18nKey` / a feature-scoped enum if no shared key matches.

#### Scenario: Localized labels resolved through useI18n
- **WHEN** the grid renders a row with `resourceType: "AdapterDeployment"`
- **THEN** the displayed string is the value of the corresponding i18n key resolved through `useI18n`
- **AND** the key exists in `apps/ai-dial-admin/src/locales/en.ts`
