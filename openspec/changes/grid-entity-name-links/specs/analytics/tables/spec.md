## MODIFIED Requirements

### Requirement: Tables catalog page

The Tables page SHALL render the tables the page fetched as a grid with columns for name, type, the source table an enrichment enriches, description, column count, and lifecycle status. The source-table column SHALL be blank for a source table, which enriches nothing. The status SHALL be shown with the table status badge (Draft / Active / Failed). Clicking a row (other than the actions column) SHALL navigate to that table's detail page. Each row SHALL offer an action menu with **edit** and **delete** entries, mirroring the columns grid's own per-row action menu (one kebab icon; both entries hidden for system-owned tables); delete's confirmation dialog SHALL use the danger (red confirm) variant. The **edit** action SHALL open the table-metadata edit surface (see "Table metadata editing"). The header SHALL provide actions to create a source table and to create an enrichment table. After a successful create, edit, or delete the catalog SHALL refresh client-side.

#### Scenario: Catalog lists tables with navigation

- **WHEN** the catalog renders with tables
- **THEN** each table appears as a row with its name, type, source table, description, column count, and status badge
- **AND** clicking a table's name link navigates to that table's detail page
- **AND** clicking elsewhere in the row does not navigate

#### Scenario: Catalog names the source table an enrichment enriches

- **WHEN** the catalog lists an enrichment table alongside a source table
- **THEN** the enrichment's row shows the name of the table it enriches
- **AND** the source table's row leaves that cell blank

#### Scenario: Draft and active tables are visually distinct

- **WHEN** the catalog lists a `PENDING`/`FAILED` table and an `ACTIVE` table
- **THEN** the draft/failed table shows a non-active status badge and the active table shows the active badge

#### Scenario: Row action menu offers edit and delete

- **WHEN** a non-system row's action menu is opened
- **THEN** it offers an edit entry (table metadata) and a delete entry
- **AND** a system-owned table's row offers neither

#### Scenario: Delete a table

- **WHEN** the user activates a row's delete action and confirms in the red confirmation dialog
- **THEN** the table is deleted and the catalog refreshes
- **AND** a failure surfaces an error notification without navigating away

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
- **WHEN** the user clicks that row's Activity ID link
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
