## ADDED Requirements

### Requirement: Table detail view is organized into Properties and Audit tabs

The table detail view (`/tables/{name}`) SHALL, for a table whose `status` is `ACTIVE`, present its
content under a horizontal tab strip with exactly two tabs, **Properties** and **Audit**, in that
order. `Properties` SHALL be the selected tab when the view is first opened.

The view header — the table name, the lifecycle status badge, the kind tag, the system tag, the
description row, and the whole header action row (Manage access, Delete table, Add columns, Add rows,
Connect, and the draft **Save** action) — SHALL render **above** the tab strip and SHALL be unchanged
by this reorganization: the same controls, in the same order, under the same permission and status
conditions as before, visible whichever tab is selected. Every other element the "Table detail column
schema management", "Define and materialize a table schema", and "Table detail row writes"
requirements describe as being on the detail page — the read-only schema-metadata summary, the
columns grid or the draft schema editor, and the modals those actions open — SHALL render inside the
**Properties** tab where a tab strip is rendered, and directly beneath the header where it is not
(see the status and feature-flag conditions below). Whichever of the two applies, that content SHALL
be the same content, in the same order, as before this change.

The Audit tab SHALL be offered **only** on a table whose `status` is `ACTIVE`. On a table at any other
status — `PENDING` (Draft), `FAILED`, or a table whose status the backend does not report — the detail
view SHALL render no tab strip and no Audit tab, SHALL render the Properties content directly, and
SHALL issue no request to the analytics activity feed. A table that has not been materialized has no
audit history for the tab to show: it has no columns, and the analytics activity feed returns zero
activities for its name, so the tab could only ever be empty. On an `ACTIVE` table the Audit tab SHALL
require no permission beyond the one that already allows reading the table, and SHALL NOT consult the
per-table `write` / `modify` permissions.

The tab strip SHALL therefore be rendered only when `featureFlags.analyticsEnabled` is true **and**
the table's status is `ACTIVE`. With analytics disabled the detail view SHALL render the Properties
content directly, with no tab strip and no Audit tab, and SHALL issue no request to the analytics
activity feed — the same rendering as the non-`ACTIVE` case above. The route itself is not guarded —
`/tables/{name}` renders whenever it is reached, today and after this change; hiding the Analytics
menu group is not a route guard, so a bookmarked or pasted link still opens this view and the tab
condition is what keeps an analytics-disabled installation from issuing an activity request. Guarding
the route is a separate concern about the whole tables feature and is out of scope here.

#### Scenario: Properties is the selected tab when the detail view opens

- **WHEN** the user opens the detail view of a table whose `status` is `ACTIVE`
- **THEN** a tab strip showing `Properties` and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only schema-metadata summary and the columns grid are shown beneath it

#### Scenario: Header and its actions stay above the tab strip

- **GIVEN** the detail view of a table whose `status` is `ACTIVE`
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the table name, status badge, kind tag, description row, and every header action button
  the user's permissions allow remain rendered above the tab strip, unchanged

#### Scenario: Audit tab is hidden on a draft table

- **GIVEN** a table whose `status` is `PENDING`
- **WHEN** the user opens its detail view
- **THEN** no tab strip and no `Audit` tab are rendered
- **AND** the schema-metadata summary and the draft schema editor are shown directly, as they are
  before this change
- **AND** no request is issued to the analytics activity feed

#### Scenario: Audit tab needs no permission beyond reading the table

- **GIVEN** a table whose `status` is `ACTIVE`
- **AND** a viewer whose per-table permissions report `write: false` and `modify: false`
- **WHEN** the user opens the table detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **AND** a table whose `status` is `ACTIVE` — so the flag alone decides
- **WHEN** the user reaches `/tables/{name}` by a direct link
- **THEN** no tab strip and no `Audit` tab are rendered
- **AND** the schema-metadata summary and the columns grid or draft schema editor are shown directly
- **AND** no request is issued to the analytics activity feed

### Requirement: Table Audit tab lists the table's own and its columns' activities

The global Activity Audit page's own `Analytics` view — the third option in its `View` selector, its
fetcher, its rollback absence, and how one of its rows resolves and renders on the audit detail page —
is specified by the `activity-audit-analytics-view` capability. This requirement covers only the tab
on the table detail view.

The **Audit** tab SHALL render the shared entity audit surface with the Activities list as its only
sub-tab — no Dashboard, Traces, or Conversations sub-tab, which report DIAL request telemetry keyed
by a deployment name and have no meaning for a catalog table — and with no view-type selector.

The list SHALL be sourced from the analytics backend (`POST /v1/activities` at
`DIAL_ANALYTICS_API_URL`) and SHALL be narrowed to the table being viewed **and its columns**. The
request SHALL carry a `resourceType` filter with the `in` operator and the value `Table,TableColumn`,
and a `resourceId` filter with the `co` operator and the table's name. Because `co` is a substring
match and the analytics backend names a column activity `<table>:<column>`, rows SHALL be narrowed
client-side to those whose `resourceId` is exactly the table's name or begins with the table's name
followed by `:`; a row belonging to any other table SHALL NOT be displayed.

Because the list carries two resource types, the grid SHALL show the `Resource type` and
`Resource identifier` columns, so a column activity states which column it refers to. Rows SHALL be
listed flat, newest first, with no row-expander column.

The tab renders the same `Analytics` view as the global page, so the suppression of a deleted table's
child column activities (`activity-audit-analytics-view`, *A child activity of a deleted table is not
listed*) applies here too. It is inert in practice — a deleted table has no detail view from which to
open this tab — and it never touches a column dropped from the table being viewed, whose parent is a
`Table` `Update`.

The tab SHALL offer the same time-period filter `EntityAudit` already renders for other entities,
initialized to the default period, and changing it SHALL re-request the list for the new range. The
row action menu SHALL offer `Open in a new tab` and SHALL NOT offer `Rollback` — the analytics backend
exposes no endpoint that writes an audit record, revision, or snapshot. A failed request SHALL leave
the grid in its existing error/empty state and SHALL NOT raise a toast notification; this surface is
read-only and performs no action a success or error notification would describe.

#### Scenario: Request is narrowed to the table and its columns

- **WHEN** the Audit tab is opened on the table named `conversations` and the grid requests its first
  row block
- **THEN** the analytics activity feed is requested with a `resourceType` filter
  `{ operator: "in", value: "Table,TableColumn" }` and a `resourceId` filter
  `{ operator: "co", value: "conversations" }`
- **AND** the request is not sent to the admin backend or the deployment-manager backend

#### Scenario: An activity belonging to a similarly named table is excluded

- **GIVEN** the Audit tab is open on the table named `orders`
- **AND** the feed response contains an activity with `resourceType: "TableColumn"` and
  `resourceId: "my_orders:total"`
- **WHEN** the grid renders the block
- **THEN** that row is not displayed
- **AND** a row with `resourceId: "orders"` and a row with `resourceId: "orders:total"` are both
  displayed

#### Scenario: A column activity states which column it refers to

- **GIVEN** the Audit tab is open on the table named `orders`
- **WHEN** the list contains an activity with `resourceType: "TableColumn"` and
  `resourceId: "orders:total"`
- **THEN** that row's `Resource type` cell reads the localized `Table column` label
- **AND** its `Resource identifier` cell reads `orders:total`

#### Scenario: Audit tab renders only the Activities sub-tab

- **WHEN** the user selects the `Audit` tab
- **THEN** the sub-tab rail lists `Activities` and nothing else
- **AND** no `Config / Deployments / Analytics` view-type dropdown is rendered

#### Scenario: Row click opens the global audit detail page

- **GIVEN** the Audit tab lists an activity whose `activityId` is `abc-123`
- **WHEN** the user clicks that row outside the action menu
- **THEN** the browser opens `/activity-audit/abc-123` in a new tab, as the shared audit list already
  does for every other view
- **AND** no `/tables/{name}/{activityId}` URL is requested

#### Scenario: No rollback action is offered

- **WHEN** the user opens the row action menu on any row in the Audit tab
- **THEN** the menu offers `Open in a new tab`
- **AND** the menu does not offer `Rollback`

#### Scenario: Table with no recorded history

- **GIVEN** a table for which the analytics activity feed returns zero rows
- **WHEN** the user opens the Audit tab
- **THEN** the grid shows its existing empty state, with no error and no notification
- **AND** the tab remains usable and the user can navigate away normally

#### Scenario: Changing the time period re-requests the list

- **GIVEN** the Audit tab is open
- **WHEN** the user changes the time-period filter
- **THEN** the next request to the analytics activity feed carries the updated
  `epochTimestampMs` `ge` and `le` filters
