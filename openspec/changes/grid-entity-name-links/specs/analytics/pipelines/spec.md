## MODIFIED Requirements

### Requirement: Pipelines listing grid presents both kinds

The Pipelines page SHALL render the fetched pipelines as one grid holding both kinds, seeded in the order
the service returned them — that order is total, so no client-side sort is applied by default. Narrowing and
reordering are the grid's own affordances: every data column SHALL remain sortable and filterable through the
grid's standard column controls, and the page SHALL NOT carry a separate filter toolbar. Because the listing
is unpaged, those controls act on the whole registry.

Columns SHALL be: **name**, **kind**, **trigger**, **transform**, **enabled**, **runtime**, **generation**,
**target**, **inputs**, and **updated at**. The first seven — **name**, **kind**, **trigger**,
**transform**, **enabled**, **runtime**, **generation**, in that order — SHALL be visible by default;
**target**, **inputs** and **updated at** SHALL be hidden by default and remain available to show.

The grain key and the version column are **not** among them. The service resolves those only for a listing
narrowed to the enrichment kind that also asks for the compiled projection, and it refuses that projection
in a cross-kind listing outright rather than leaving it unresolved — so a listing holding both kinds cannot
carry them at all. A column that could only ever be empty here is not offered; both are read on the pipeline
itself.

- The **name** cell SHALL render the name as a link to that pipeline's detail route, `/pipelines/{name}`,
  and SHALL be the only cell that navigates; a click elsewhere in the row SHALL NOT navigate.
- The **kind** cell SHALL present the kind as a badge. Kind SHALL NOT be carried by colour alone.
- The **trigger** cell SHALL show the trigger kind as a badge and nothing else. A raw six-field cron says
  nothing at a glance, and the schedule and the grouping key are both stated on the pipeline's own page.
- The **transform** cell SHALL show the transform's type as a badge — the fact the declaration itself
  carries, now that the transform is on it. It SHALL NOT name an evaluator or a version, and the grid SHALL
  NOT issue a per-row request of any kind to fill it.
- The **inputs** cell SHALL render the read source the pipeline declared. An enrichment pipeline that
  declared none — inheriting the source from its target's parent — SHALL state that it **follows its
  target** rather than rendering an em dash: an em dash here reads as "no source", where the truth is a
  source this listing cannot resolve. The resolved table SHALL be read on the pipeline's own detail
  page, which asks for the compiled projection.
- A column belonging to one kind SHALL render an em dash on a row of the other kind, which is an ordinary
  state rather than a failure: the service omits such a member rather than sending it empty.
- The **enabled** cell SHALL render as a badge distinguishing an enabled from a disabled pipeline; colour
  alone SHALL NOT be the only carrier of that distinction.
- The **runtime** cell SHALL state whether the pipeline's enqueue is running or paused, as a badge, with
  colour not the only carrier. It SHALL render an em dash for a disabled pipeline, whose enqueue the runner
  is not driving at all — configuration and runtime are separate axes, and a disabled pipeline has no
  runtime answer rather than a negative one.

The **runtime** column SHALL be filled from a **single** read of the runtime service for the whole page.
The service answers with the paused pipelines as one list, so a pipeline's runtime is decided by whether
its name is in that list; a request per row would be a request per pipeline for an answer already given
whole.

The **runtime** column SHALL be omitted entirely — rather than rendered with empty or error cells — when
the runtime service is not configured, did not answer, or the caller is not a full admin. A column of
identical failures states nothing about any row and implies a per-row fact the page does not have.

The page header SHALL carry a **Columns** button that opens the grid's standard columns panel, the same
panel the other listings offer, in which every column above is listed under its header name and can be
shown, hidden or reordered, and the defaults restored. The choice SHALL persist in the browser under the
listing's own grid storage key, alongside the grid's saved sort and filter state, so it survives a reload
and is not shared with any other listing. A listing without the runtime column SHALL keep its choice under a separate key from one
that carries it: the grid appends a column its saved state does not know, so a choice saved before the
runtime service answered would otherwise move **runtime** to the end for good. The button SHALL expose whether the panel is open, and SHALL NOT
be offered over an empty listing, where the grid shows its empty state rather than columns.

Each row SHALL offer an action menu with a **delete** entry, whose confirmation dialog SHALL use the danger
(red confirm) variant and SHALL identify the pipeline by name. After a successful delete the listing SHALL
refresh client-side, preserving the filters currently applied.

#### Scenario: Both kinds appear in one listing

- **WHEN** the registry holds pipelines of both kinds and the listing renders
- **THEN** every pipeline is presented in the same grid
- **AND** each row carries a badge naming its kind

#### Scenario: Listing names the transform's type from the declaration

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its transform cell carries that transform's type as a badge and names no evaluator
- **AND** no additional request is issued for that row

#### Scenario: The type badge needs no resolved listing

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its transform cell carries the type badge without a compiled projection, because the type is on
  the declaration rather than resolved

#### Scenario: No version pin is marked, there being none to mark

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its transform cell marks no version pin at all, there being no evaluator version to pin

#### Scenario: A resolved input is presented

- **WHEN** the listing renders an enrichment pipeline that declared no input of its own
- **THEN** its inputs cell states that the pipeline follows its target, rather than showing an em dash
- **AND** the source resolved from its target is presented on that pipeline's detail page

#### Scenario: An aggregate row leaves the enrichment column empty

- **WHEN** the listing renders an aggregate pipeline
- **THEN** its transform cell shows an em dash
- **AND** the row is presented as an ordinary pipeline, not as a failure

#### Scenario: The resolved-only columns are not offered

- **WHEN** the listing renders
- **THEN** it carries no grain key column and no version column

#### Scenario: Trigger cell carries the kind alone

- **WHEN** the listing renders a `schedule` pipeline and a `group` pipeline
- **THEN** each row shows its trigger kind as a badge
- **AND** neither shows the cron expression or the grouping key

#### Scenario: A paused pipeline is stated as paused in the listing

- **GIVEN** the runtime service reports one pipeline as paused, and has taken on the rest
- **WHEN** a full admin opens the listing
- **THEN** that pipeline's runtime cell states that it is paused
- **AND** every other enabled pipeline's runtime cell states that it is running

#### Scenario: A pipeline the runner has not taken on is marked in the listing

- **GIVEN** an enabled `enrich` pipeline the runtime service does not report among the ones it has taken
  on
- **WHEN** a full admin opens the listing
- **THEN** that pipeline's runtime cell states that it is not running

#### Scenario: One runtime read serves the whole page

- **WHEN** a full admin opens a listing of many pipelines
- **THEN** each of the runtime service's two listings is read once
- **AND** no request is issued per row

#### Scenario: A disabled pipeline has no runtime answer

- **WHEN** the listing renders a pipeline whose `enabled` is false
- **THEN** its runtime cell shows an em dash rather than `running` or `paused`

#### Scenario: The runtime column is omitted when the runtime service cannot be read

- **GIVEN** the runtime service is not configured or does not answer
- **WHEN** the listing renders
- **THEN** no runtime column is presented
- **AND** every other column renders as it otherwise would

#### Scenario: Navigating to a pipeline

- **WHEN** the user activates a pipeline's name link
- **THEN** the browser navigates to `/pipelines/{name}` for that pipeline

#### Scenario: The name is presented as text rather than as a link

- **WHEN** the listing renders a pipeline
- **THEN** its name is presented as a link

#### Scenario: A row click outside the name does not navigate

- **WHEN** the user clicks a pipeline row outside its name link
- **THEN** no navigation occurs

#### Scenario: Data columns stay sortable and filterable

- **WHEN** the listing renders
- **THEN** no data column disables sorting or filtering
- **AND** no separate filter toolbar is rendered above the grid

#### Scenario: Default columns

- **WHEN** the listing renders for a browser with no saved column choice
- **THEN** the visible columns are name, kind, trigger, transform, enabled, runtime and generation, in that
  order
- **AND** target, inputs and updated at are hidden but listed in the columns panel

#### Scenario: Showing a hidden column from the columns panel

- **WHEN** the user activates the Columns button and checks a hidden column such as target
- **THEN** that column is shown in the grid
- **AND** the panel offers to restore the defaults

#### Scenario: The column choice survives a reload

- **GIVEN** the user has hidden a default column through the columns panel
- **WHEN** the Pipelines page is reloaded in the same browser
- **THEN** that column stays hidden

#### Scenario: No columns button over an empty listing

- **WHEN** the registry holds no pipeline
- **THEN** the empty state is shown and no Columns button is offered

#### Scenario: Delete a pipeline

- **WHEN** the user activates a row's delete action and confirms in the red confirmation dialog
- **THEN** the pipeline is deleted, a success notification is shown, and the listing is re-read
- **AND** a failure surfaces an error notification without removing the row

### Requirement: Pipeline Audit tab lists the pipeline's own activities

The global Activity Audit page's own `Analytics` view — the third option in its `View` selector, its
fetcher, its rollback absence, and how one of its rows resolves and renders on the audit detail page — is
specified by the `activity-audit-analytics-view` capability. This requirement covers only the tab on the
pipeline detail view.

The **Audit** tab SHALL render the shared entity audit surface with the Activities list as its only sub-tab
— no Dashboard, Traces, or Conversations sub-tab, which report DIAL request telemetry keyed by a deployment
name and have no meaning for a pipeline — and with no view-type selector.

The list SHALL be sourced from the analytics backend (`POST /v1/activities` at `DIAL_ANALYTICS_API_URL`) and
SHALL be narrowed to the pipeline being viewed by an **exact** pair: a `resourceType` filter with the `eq`
operator and the value `Pipeline`, and a `resourceId` filter with the `eq` operator and the pipeline's name.
A `Pipeline` resource identifier is the pipeline's name and is never compound — the analytics backend
records no child resource type under a pipeline, unlike a table and its columns — so the tab SHALL NOT
widen the query to a substring match and SHALL NOT narrow the answer client-side. Every activity the feed
answers with belongs to this pipeline and SHALL be displayed.

Because the list carries exactly one resource type and one resource identifier, the tab SHALL present the
single-entity column set the `Config` and `Deployments` entity Audit tabs already present: `Resource type`
and `Resource identifier` SHALL NOT be rendered — two columns whose value is the same on every row of this
list — and neither SHALL a row-expander column nor the `Version` column. `Activity type`, `Time`,
`Initiated`, `Activity ID` and `Parent ID` SHALL be rendered, with `Time` keeping its default descending
sort, and rows SHALL be listed flat, newest first.

The activities the tab lists are the ones the analytics backend records against the pipeline: its own
`Create`, `Update` and `Delete`; the `Update` produced when a bulk generation bump repoints its read source,
which carries the source table's `Table` `Update` activity as its `parentActivityId`; and the `Delete`
recorded when the pipeline's target table is deleted, which carries no parent at all. A parent identifier
SHALL be shown in the `Parent ID` cell as the backend supplied it and SHALL NOT be resolved or expanded
here.

The suppression the `Analytics` view applies to a deleted table's children
(`activity-audit-analytics-view`, *A child activity of a deleted table is not listed*) SHALL NOT remove any
row from this tab, and SHALL NOT be widened to make it do so. A pipeline activity's only parent is a `Table`
`Update`, never a `Table` `Delete`; the `Delete` recorded by its target table's deletion carries no parent,
so it is never a candidate; and the rule leaves a row listed when its parent cannot be resolved.

The tab SHALL offer the same time-period filter the shared entity audit surface already renders for other
entities, initialized to the default period, and changing it SHALL re-request the list for the new range.
The row action menu SHALL offer `Open in a new tab` and SHALL NOT offer `Rollback` — the analytics backend
exposes no endpoint that writes an audit record, revision, or snapshot. A failed request SHALL leave the
grid in its existing error/empty state and SHALL NOT raise a toast notification; this surface is read-only
and performs no action a success or error notification would describe.

#### Scenario: Request is narrowed to the pipeline by an exact resource pair

- **WHEN** the Audit tab is opened on the pipeline named `daily_rollup` and the grid requests its first
  row block
- **THEN** the analytics activity feed is requested with a `resourceType` filter
  `{ operator: "eq", value: "Pipeline" }` and a `resourceId` filter
  `{ operator: "eq", value: "daily_rollup" }`
- **AND** no `co` (substring) filter and no `in` filter over resource types is sent
- **AND** the request is not sent to the admin backend or the deployment-manager backend

#### Scenario: Every activity the feed answers with is listed

- **GIVEN** the Audit tab is open on the pipeline named `daily_rollup`
- **AND** the feed answers with several `Pipeline` activities
- **WHEN** the grid renders the block
- **THEN** every one of them is displayed
- **AND** no row is dropped by a client-side resource-identifier check

#### Scenario: A newly registered pipeline lists its Create activity

- **GIVEN** a pipeline registered through `POST /v1/pipelines` and not edited since
- **WHEN** the user opens its Audit tab
- **THEN** a row whose activity type is `Create` is displayed for it

#### Scenario: The tab presents no resource-type or resource-identifier column

- **WHEN** the user selects the `Audit` tab on a pipeline
- **THEN** the grid renders neither a `Resource type` nor a `Resource identifier` column
- **AND** it renders neither a row-expander column nor a `Version` column
- **AND** it renders the `Activity type`, `Time`, `Initiated`, `Activity ID` and `Parent ID` columns

#### Scenario: A bulk-bumped update states the parent activity the backend supplied

- **GIVEN** the Audit tab is open on a pipeline whose read source was repointed by a bulk generation bump
- **AND** the feed answers that `Update` activity with the source table's activity identifier as its
  `parentActivityId`
- **WHEN** the grid renders the block
- **THEN** that row is displayed at the top level
- **AND** its `Parent ID` cell shows the identifier the backend supplied

#### Scenario: A pipeline delete recorded by its target table's deletion is listed

- **GIVEN** the feed answers with a `Pipeline` `Delete` activity carrying no `parentActivityId`
- **WHEN** the grid renders the block
- **THEN** that row is displayed
- **AND** the deleted-table child suppression drops no row of this tab

#### Scenario: Pipeline Audit tab renders only the Activities sub-tab

- **WHEN** the user selects the `Audit` tab on a pipeline
- **THEN** the sub-tab rail lists `Activities` and nothing else
- **AND** no `Config / Deployments / Analytics` view-type dropdown is rendered

#### Scenario: No rollback action is offered on a pipeline activity

- **WHEN** the user opens the row action menu on any row in the pipeline Audit tab
- **THEN** the menu offers `Open in a new tab`
- **AND** the menu does not offer `Rollback`

#### Scenario: Pipeline activity row click opens the global audit detail page

- **GIVEN** the pipeline Audit tab lists an activity whose `activityId` is `abc-123`
- **WHEN** the user clicks that row's Activity ID link
- **THEN** the browser opens `/activity-audit/abc-123` in a new tab, as the shared audit list already does
  for every other view
- **AND** no `/pipelines/{name}/{activityId}` URL is requested

#### Scenario: Pipeline with no recorded history

- **GIVEN** a pipeline for which the analytics activity feed returns zero rows
- **WHEN** the user opens the Audit tab
- **THEN** the grid shows its existing empty state, with no error and no notification
- **AND** the tab remains usable and the user can navigate away normally

#### Scenario: Changing the time period re-requests the pipeline's list

- **GIVEN** the pipeline Audit tab is open
- **WHEN** the user changes the time-period filter
- **THEN** the next request to the analytics activity feed carries the updated `epochTimestampMs` `ge` and
  `le` filters
