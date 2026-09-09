## MODIFIED Requirements

### Requirement: The detail page is one frame with a transform section chosen by kind

Both kinds share an identity, a target, a read scope, a trigger, an enabled state and a runtime state; they
differ only in what they compute. The detail page SHALL therefore present **one** frame — the identity row,
the read-only facts, the read scope, the trigger, the runtime state, the JSON editor toggle and the save
bar — and SHALL choose the transform section by the pipeline's kind.

There is one frame per page and not one per kind. Everything the frame presents **below the identity row**
is the content of the **Properties** tab (see *Pipeline detail view is organized into Properties and Audit
tabs*), which is the tab the page opens on; the identity row itself stays above the tab strip and is
presented whichever tab is selected.

The kind SHALL be read from the pipeline and SHALL NOT be selectable on the detail page: it is fixed at
registration and the service refuses to change it.

The choice of section SHALL be the page's only branch on kind. A control that belongs to one kind SHALL live
inside that kind's section rather than being conditionally rendered among the shared ones, so the shared
frame stays kind-independent.

The enrichment section SHALL present the evaluator and its version, the variable bindings, and the execution
knobs. The aggregate section SHALL present the group keys, the measures and the freshness mode.

The **trigger** SHALL be stated above the collapsible sections rather than filed inside one. It belongs to
neither transform — an enrichment pipeline's trigger and an aggregate one's schedule are the same member —
and burying it under a heading would make when a pipeline runs the one fact the page hides.

The detail page SHALL present **every** editable member of a pipeline, so that a pipeline registered through
the API can be inspected and corrected in the console. Controls that the create modal already provides SHALL
be the same controls here, differing only in width and layout.

#### Scenario: An enrichment pipeline presents the enrichment section

- **WHEN** an enrichment pipeline is opened
- **THEN** its evaluator, variable bindings and execution knobs are presented
- **AND** no group keys, measures or freshness control is presented

#### Scenario: An aggregate pipeline presents the aggregate section

- **WHEN** an aggregate pipeline is opened
- **THEN** its group keys, measures and freshness mode are presented
- **AND** no evaluator, variable bindings or execution knobs are presented

#### Scenario: The shared frame is the same for both kinds

- **WHEN** a pipeline of either kind is opened
- **THEN** the identity row, read-only facts, read scope, trigger, runtime state and save bar are presented

#### Scenario: Kind is not selectable

- **WHEN** a pipeline is opened
- **THEN** no control offers to change its kind

#### Scenario: A member set only through the API is visible

- **WHEN** a pipeline carrying a member the create modal does not collect is opened
- **THEN** that member is presented with its current value

#### Scenario: The trigger branch follows the selected kind

- **WHEN** the trigger kind is changed
- **THEN** only the members that kind admits are presented
- **AND** the members belonging to the previous kind are no longer presented

## ADDED Requirements

### Requirement: Pipeline detail view is organized into Properties and Audit tabs

The pipeline detail view (`/pipelines/{name}`) SHALL present its content under a horizontal tab strip with
exactly two tabs, **Properties** and **Audit**, in that order. `Properties` SHALL be the selected tab when
the view is first opened.

The identity row — the enabled-state badge, the pipeline name, its copy control, the `Discard` / `Save`
change bar, the enable/disable control and the JSON editor toggle — SHALL render **above** the tab strip
and SHALL be unchanged by this reorganization: the same controls, in the same order, under the same
permission and pending-edit conditions the "The pipeline detail header states the pipeline's status before
its name" requirement already states, presented whichever tab is selected. Everything the frame presents
below that row — the read-only facts, the read scope, the trigger, the kind's transform section and the
runtime state — SHALL render inside the **Properties** tab where a tab strip is rendered, and directly
beneath the identity row where it is not.

Selecting the `Audit` tab SHALL NOT discard a pending edit. The draft the fields and the document share
SHALL survive a tab switch, and the change bar SHALL stay offered from either tab, so a caller who reads
the history mid-edit does not lose the edit by reading it.

The JSON editor and the tab strip SHALL NOT be presented together. Enabling the editor withdraws the tab
strip along with everything else below the identity row, as "The pipeline JSON editor takes the whole view,
and an unsaved change closes the way out" already requires, and leaving the editor SHALL restore the strip
with `Properties` selected. The toggle itself is unchanged and stays offered to every caller.

The tab strip SHALL be rendered only when `featureFlags.analyticsEnabled` is true. With analytics disabled
the detail view SHALL render the Properties content directly, with no tab strip and no Audit tab, and SHALL
issue no request to the analytics activity feed. The route itself is not guarded on that flag —
`/pipelines/{name}` guards only on `isAnalyticsForbidden()`, which is an authorization check against the
analytics service and not the client feature flag, so a bookmarked or pasted link still opens this view on
an analytics-disabled installation and the tab condition is what keeps it from issuing an activity request.

There SHALL be **no** pipeline-status condition on the tab, unlike the table detail view's, which
additionally requires an `ACTIVE` table. A pipeline has no registration lifecycle to mirror one: the service
creates it whole in a single `POST /v1/pipelines`, so every registered pipeline already carries at least a
`Create` activity. `enabled` is a pipeline's runtime toggle and not a registration state — a disabled
pipeline is fully registered, and disabling or enabling it is itself an audited `Update` — so the Audit tab
SHALL be offered on a disabled pipeline exactly as on an enabled one.

The Audit tab SHALL require no permission beyond the one that already allows reading the pipeline. It SHALL
NOT be gated on full-admin rights, which the save and the enable/disable control are.

#### Scenario: Properties is the selected tab when the pipeline detail view opens

- **WHEN** the user opens the detail view of a registered pipeline
- **THEN** a tab strip showing `Properties` and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only facts, the trigger, the kind's transform section and the runtime state are shown
  beneath it

#### Scenario: The identity row and its actions stay above the tab strip

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the enabled-state badge, the pipeline name, its copy control and the enable/disable control
  remain rendered above the tab strip, unchanged

#### Scenario: The Audit tab is offered on a disabled pipeline

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** the user opens its detail view
- **THEN** the tab strip is rendered and the `Audit` tab is present and selectable

#### Scenario: The Audit tab needs no permission beyond reading the pipeline

- **GIVEN** a caller who is not a full admin, and who is therefore offered no save and no
  enable/disable control
- **WHEN** the user opens the pipeline detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: A pending field edit survives a switch to the Audit tab

- **GIVEN** the detail view of a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** the user selects `Audit` and then `Properties` again
- **THEN** the edited value is still presented
- **AND** the `Discard` / `Save` bar is still offered

#### Scenario: The JSON editor and the tab strip are not presented together

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the caller enables the JSON editor
- **THEN** the pipeline is presented as one JSON document
- **AND** no tab strip is rendered
- **AND** turning the editor off again renders the tab strip with `Properties` selected

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **WHEN** the user reaches `/pipelines/{name}` by a direct link
- **THEN** no tab strip and no `Audit` tab are rendered
- **AND** the read-only facts, the trigger, the transform section and the runtime state are shown directly
- **AND** no request is issued to the analytics activity feed

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
- **WHEN** the user clicks that row outside the action menu
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
