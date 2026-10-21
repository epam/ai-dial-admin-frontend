## MODIFIED Requirements

### Requirement: Model asset Audit tab exposes Dashboard and Traces only

The system SHALL render the model asset's `Audit` tab with the shared
`EntityTabs/Audit/EntityAudit` component addressed as `ApplicationRoute.PlatformModels`, offering
exactly two sub-tabs — `Dashboard` and `Traces`, in that order — and SHALL NOT offer the `Activities`
or `Conversations` sub-tabs that `Entities ▸ Models` offers. `Activities` is excluded because it reads
the admin backend's activity/revision trail, which has no rows for a DIAL Core config resource;
`Conversations` is excluded because this surface follows the `Assets ▸ Toolsets` Audit precedent,
which offers neither.

Both sub-tabs read from the analytics-data-access-service (`DIAL_ANALYTICS_API_URL`). While both
`ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED` resolve truthy, `Dashboard` renders the usage dashboard
(`analytics/dashboards`) and `Traces` renders the entity trace listing (`analytics/entity-trace-listing`);
with either flag falsy, they render the existing `Telemetry/Dashboard` and `UsageLog/UsageLog`
components, unchanged. No admin-backend request and no additional DIAL Core request is introduced by
this tab, and no new user action is added — so no new success or error notification is defined; a
failed analytics read surfaces through the rendered component's own error handling.

#### Scenario: Audit opens on Dashboard with Traces alongside

- **WHEN** a user selects the `Audit` tab on a model asset's detail view
- **THEN** the sub-tab list reads `Dashboard` and `Traces`, with `Dashboard` selected and its content
  rendered

#### Scenario: No Activities sub-tab

- **WHEN** a user views the model asset's `Audit` tab
- **THEN** no `Activities` sub-tab is offered, since a Core config resource has no admin-backend
  activity/revision trail to list

#### Scenario: No Conversations sub-tab

- **WHEN** a user views the model asset's `Audit` tab
- **THEN** no `Conversations` sub-tab is offered, unlike the `Entities ▸ Models` Audit tab

#### Scenario: Audit reads are keyed by the model's deployment name

- **WHEN** the `Dashboard` or `Traces` sub-tab builds its analytics query for a model asset
- **THEN** the query's entity filter is the model's bare name — the same deployment identifier the
  detail view already surfaces — with no `toolsets/`-style deployment prefix and no
  `models/platform/{name}` canonical id

#### Scenario: Traces follows the analytics flags

- **GIVEN** both `ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED` resolve truthy
- **WHEN** a user selects the `Traces` sub-tab on a model asset's `Audit` tab
- **THEN** the entity trace listing renders for the model
- **AND** with either flag falsy the telemetry usage-log grid renders instead

#### Scenario: The Entities > Models Audit tab is unchanged

- **WHEN** a user opens the `Audit` tab on an `Entities ▸ Models` detail view with `dashboardEnabled`
  set
- **THEN** its sub-tabs are `Dashboard`, `Traces`, `Conversations`, and `Activities`, unchanged from
  current behaviour
