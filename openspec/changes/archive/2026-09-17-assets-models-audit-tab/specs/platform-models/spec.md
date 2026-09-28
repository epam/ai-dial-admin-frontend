## MODIFIED Requirements

### Requirement: Model asset detail view tab set

The system SHALL render a model asset's detail view with `Properties`, `Features`, `Roles`, and
`Interceptors`, in that order, and SHALL append `Audit` as a fifth and last tab when the
`dashboardEnabled` feature flag is set. When that flag is unset the tab set SHALL remain exactly the
first four tabs.

There SHALL be no revision link, no rollback control, and no Core-sync banner, because DIAL Core
exposes no audit, revision, history, or snapshot surface for config resources — the rationale that
previously excluded the whole Audit tab still holds for those three, and for the Activities sub-tab
(see the Audit requirement below). It no longer excludes the Dashboard and Traces sub-tabs, which
query the analytics service and depend on nothing Core stores. There SHALL be no Tools or
Dependencies tab.

`dashboardEnabled` is derived once per request in `apps/ai-dial-admin/src/app/[lang]/layout.tsx` from
`DISABLE_MENU_ITEMS` not containing `dashboard`, and is the same flag that already gates the
`Assets ▸ Toolsets` Audit tab. No new flag or environment variable is introduced.

Gating the tab's *presence* is a known and accepted divergence from `Entities ▸ Models`, which lists
`Audit` unconditionally and, with `dashboardEnabled` unset, still shows it carrying only its
`Activities` sub-tab. `Catalog ▸ Models` has no `Activities` sub-tab to fall back on (see the Audit
requirement below), so an unconditional tab would be empty here. Consistency with `Entities ▸ Models`
therefore holds wherever the dashboard feature is enabled — the default — and the flag-unset
four-tab state below is deliberate, not an oversight to be "fixed" by rendering the tab always.

Two scenario headings below are retained from the previous wording of this requirement, because a
scenario's name is the identity a delta rewrites content under: `Detail view renders exactly four
tabs` is now the `dashboardEnabled`-unset case rather than the only case, and `No Audit tab or sync
banner` now prohibits only the revision/rollback/Core-sync surface it used to bundle the tab with.

#### Scenario: Audit is the fifth tab when the dashboard feature is enabled

- **WHEN** a user opens a model asset's detail view (`/platform-models/[id]`) in a deployment whose
  `dashboardEnabled` flag is set
- **THEN** the tab list reads `Properties`, `Features`, `Roles`, `Interceptors`, `Audit`, in that
  order

#### Scenario: Detail view renders exactly four tabs

Rescoped: the four-tab set is what a deployment with the dashboard feature disabled shows.

- **WHEN** a user opens a model asset's detail view in a deployment whose `dashboardEnabled` flag is
  unset (`DISABLE_MENU_ITEMS` includes `dashboard`)
- **THEN** the tab list contains exactly `Properties`, `Features`, `Roles`, and `Interceptors`, in
  that order, and no `Audit` tab is shown

#### Scenario: No Audit tab or sync banner

Rescoped: the prohibition now covers the revision/rollback/Core-sync surface only. The `Audit` tab
itself is prohibited only while `dashboardEnabled` is unset, per the scenario above.

- **WHEN** a user opens a model asset's detail view, with the `Audit` tab present or absent
- **THEN** no revision link, rollback control, or Core-sync status banner is rendered

#### Scenario: Sibling platform asset detail views gain no Audit tab

- **WHEN** a user opens the detail view of a platform App Runner, Interceptor, Route, Key, or Role
  with `dashboardEnabled` set
- **THEN** no `Audit` tab is shown on any of them, unchanged from current behaviour — the new tab is
  scoped to `Catalog ▸ Models` alone

## ADDED Requirements

### Requirement: Model asset Audit tab exposes Dashboard and Traces only

The system SHALL render the model asset's `Audit` tab with the shared
`EntityTabs/Audit/EntityAudit` component addressed as `ApplicationRoute.PlatformModels`, offering
exactly two sub-tabs — `Dashboard` and `Traces`, in that order — and SHALL NOT offer the `Activities`
or `Conversations` sub-tabs that `Entities ▸ Models` offers. `Activities` is excluded because it reads
the admin backend's activity/revision trail, which has no rows for a DIAL Core config resource;
`Conversations` is excluded because this surface follows the `Assets ▸ Toolsets` Audit precedent,
which offers neither.

Both sub-tabs read from the analytics-data-access-service (`DIAL_ANALYTICS_API_URL`) through the
existing `Telemetry/Dashboard` and `UsageLog/UsageLog` components, unchanged. No admin-backend
request and no additional DIAL Core request is introduced by this tab, and no new user action is
added — so no new success or error notification is defined; a failed analytics read surfaces through
those components' existing error handling.

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

#### Scenario: The Entities > Models Audit tab is unchanged

- **WHEN** a user opens the `Audit` tab on an `Entities ▸ Models` detail view with `dashboardEnabled`
  set
- **THEN** its sub-tabs are `Dashboard`, `Traces`, `Conversations`, and `Activities`, unchanged from
  current behaviour
