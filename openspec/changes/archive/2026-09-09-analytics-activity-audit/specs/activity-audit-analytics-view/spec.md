## Purpose

Defines the `Analytics` view of the Activity Audit page and the analytics half of the audit detail
page: how activities are sourced from the analytics backend (`POST /v1/activities` at
`DIAL_ANALYTICS_API_URL`), which resource types it shows and how they are labelled, how the option is
gated on the analytics feature flag, why no rollback affordance exists for it — in the list, in the
row menu, and on the detail page — how a row resolves to a snapshot on the detail page, what the
detail page's header offers for an analytics resource, how a revision snapshot is grouped and marked
in the diff, the one activity the view does not list — a child of a deleted table, whose parent's own
row and detail view already carry it — and the guard that keeps the shared resource-type filter of the
`Config` and `Deployments` views unchanged.

## ADDED Requirements

### Requirement: Analytics view fetches activities from the analytics backend

When the selected view is `Analytics`, the grid datasource SHALL call a `getAnalyticsActivities`
server action, which forwards the request to `POST /v1/activities` at `DIAL_ANALYTICS_API_URL`. The
request body SHALL carry `pageNumber`, `pageSize`, `sorts`, and `filters` in the same shape already
sent to the admin and deployment-manager backends, and the response SHALL be read as
`{ total, totalPages, data }` — the analytics backend already answers in exactly those shapes, with
the same `{column, operator, value}` filter vocabulary (`eq`, `ne`, `co`, `nc`, `lt`, `gt`, `le`,
`ge`, `in`), the same `{column, direction}` sorts, and the same activity fields (`activityId`,
`activityType`, `resourceType`, `resourceId`, `epochTimestampMs`, `initiatedAuthor`,
`initiatedEmail`, `revision`, `parentActivityId`).

The selection of the fetcher SHALL be made from a single per-view lookup keyed by the active view
rather than from a boolean condition, so that no view is reachable without an explicitly declared
fetcher. The `Config` and `Deployments` views SHALL keep the exact fetchers they use today.

A failed request SHALL leave the grid in its existing failure state and SHALL NOT raise a toast
notification: the audit list is read-only and performs no action a success or error notification
would describe.

#### Scenario: Selecting the Analytics view triggers the analytics backend

- **WHEN** the user switches the `View` dropdown to `Analytics`
- **THEN** the next datasource call invokes `getAnalyticsActivities`
- **AND** it does not invoke `getActivities` or `getDeploymentActivities`
- **AND** the request payload carries `pageNumber`, `pageSize`, `sorts`, and `filters`

#### Scenario: Existing views keep their fetchers

- **WHEN** the active view is `Config`, and then `Deployments`
- **THEN** the datasource invokes `getActivities`, and then `getDeploymentActivities`, respectively

#### Scenario: Pagination on the Analytics view requests subsequent pages

- **GIVEN** the Analytics view is active and the user scrolls past the first page boundary
- **WHEN** AG Grid requests the next block
- **THEN** `getAnalyticsActivities` is called with the incremented `pageNumber` and the same
  sort/filter state

### Requirement: Analytics option is gated on the analytics feature flag

The `Analytics` option SHALL be present in the `View` dropdown only when `featureFlags.analyticsEnabled`
is true — the same flag, set from `ANALYTICS_ENABLED`, that already removes the whole Analytics menu
group. The gate SHALL be on the option itself, not on a filter applied to fetched rows, so that with
analytics disabled no request is issued to the analytics backend at all.

#### Scenario: Option absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **WHEN** the user opens the `View` dropdown on `/activity-audit`
- **THEN** the dropdown lists `Config` and `Deployments` only
- **AND** no request is issued to the analytics activity feed

#### Scenario: Option present when analytics is enabled

- **GIVEN** `featureFlags.analyticsEnabled` is true
- **WHEN** the user opens the `View` dropdown on `/activity-audit`
- **THEN** the dropdown lists `Config`, `Deployments`, and `Analytics`

### Requirement: Analytics view shows every resource type the feed returns

The Analytics view SHALL display every activity the feed returns, whatever its `resourceType` —
`Table`, `TableColumn`, `Pipeline`, and `SavedQuery`. It SHALL NOT narrow the feed by `resourceType`:
a reader cannot tell an audit surface that hides rows from one that is empty, and the existing
`Resource type` column filter already narrows it in one interaction.

The one activity this view does not list is a child of a table `Delete` — see *A child activity of a
deleted table is not listed*. That suppression is keyed on the **parent** activity and never on the
child's own resource type, so a `TableColumn` activity remains a first-class row of this view whenever
its parent is anything other than a table `Delete`.

Wherever this view lists more than one resource type — the global page, and an entity Audit tab whose
resource type owns child activities of another type, as `Table` owns `TableColumn` — it SHALL use the
`Config` view's column set minus its row-expander column and minus the `Deployments` view's `Version`
column, i.e. `Activity type`, `Resource type`, `Resource identifier`, `Time`, `Initiated`,
`Activity ID`, `Parent ID`, with `Time` keeping its default descending sort.

In an entity Audit tab whose resource type owns no child activities, the feed carries exactly one
resource type and one resource identifier, so those two columns would repeat the same pair on every
row. There the view SHALL instead use the single-entity column set the `Config` and `Deployments`
entity Audit tabs already use — `Resource type` and `Resource identifier` absent, the rest as above —
while still offering no `Rollback` row action, which no other view's single-entity set can say. Which
of the two sets applies SHALL be decided from the tab's own resource type through one predicate over
`ActivityAuditResourceType`, not from the view and not from the presence of an entity: the view is the
same in both cases, and the presence of an entity is what the two cases have in common.

Every row this view lists SHALL be rendered flat, at the top level: the client-side parent/child
aggregation the `Config` view applies SHALL NOT run, and a child activity's `Parent ID` cell SHALL
show the parent activity identifier the backend supplied. Flat rendering and the suppression of a
deleted table's children are separate rules — a child that is listed is listed flat, never nested
under its parent.

Saved column state SHALL be persisted under a key that names this view (`activity-audit:analytics`),
so resizing a column here does not disturb the `Config` or `Deployments` column state.

#### Scenario: Pipeline and saved-query rows are shown

- **GIVEN** the feed returns activities with `resourceType` values `Table`, `TableColumn`,
  `Pipeline`, and `SavedQuery`
- **WHEN** the Analytics view renders the block
- **THEN** a row is displayed for each of them

#### Scenario: Rows render flat with their parent identifier

- **GIVEN** the feed returns a `Table` activity whose `activityType` is `Update` — a table that still
  exists — and a `TableColumn` activity that names it as its parent
- **WHEN** the Analytics view renders the block
- **THEN** both rows appear at the top level
- **AND** no row-expander cell is rendered
- **AND** the `TableColumn` row's `Parent ID` cell shows the `Table` row's activity identifier

#### Scenario: Version column is not rendered

- **WHEN** the Analytics view renders
- **THEN** the grid does not render the `Version` column

#### Scenario: The column set follows the entity's resource type in an Audit tab

- **GIVEN** an entity Audit tab rendering this view for a resource type that owns child activities of
  another type
- **WHEN** the grid renders
- **THEN** the `Resource type` and `Resource identifier` columns are rendered
- **AND** for a tab whose resource type owns no child activities neither of those two columns is
  rendered
- **AND** neither tab offers a `Rollback` row action

#### Scenario: Column state is kept apart from the other views

- **GIVEN** the user has resized the `Resource identifier` column on the Analytics view
- **WHEN** the user switches to the `Config` view
- **THEN** the `Config` view's `Resource identifier` column keeps its own previously saved width

### Requirement: A child activity of a deleted table is not listed

Deleting a table records, in one revision, a `Delete` activity for the table definition and a `Delete`
activity for **each** of its columns, every column activity carrying the table activity's identifier as
its `parentActivityId`. Listing those children floods the audit list with one row per column and tells
a reader nothing the parent does not: the deleting revision has no snapshot for the table, the
previous revision holds the table with all of its columns, so the parent activity's own detail view
already renders every column of it as removed. Each child's detail view renders that same whole-table
diff, reached from a row that says only which column it was about.

The Analytics view SHALL therefore NOT list an activity whose parent activity is a `Table` activity
whose `activityType` is `Delete`. The parent `Delete` activity itself SHALL be listed. No other
activity SHALL be suppressed on account of a parent:

- an activity with no `parentActivityId` SHALL be listed;
- an activity whose parent activity is a `Table` activity of any other activity type — a single column
  dropped from, added to, or changed on a table that still exists — SHALL be listed, with its
  `Parent ID` cell showing the parent identifier the backend supplied. "Who dropped a column" is one of
  the questions this capability exists to answer, and those rows are the answer;
- an activity whose parent activity cannot be resolved SHALL be listed. A row is hidden only on
  positive evidence about its parent: an audit surface that hides a row it cannot account for is worse
  than one that shows a redundant row.

Parent activities SHALL be resolved from the same activity feed, by activity identifier, and that
request SHALL NOT carry the grid's own column or time filters — it asks for named activities, not for a
filtered page, and a column filter the reader applied would otherwise hide the very parent being
resolved. A parent already resolved SHALL be reused for the rest of the same list pass rather than
requested again, and a page carrying no unresolved parent identifier SHALL issue no resolution request
at all.

Suppression SHALL be applied to a page's rows before they enter the list's row buffer, so the buffer,
the page boundaries and the end-of-list signal count only rows that are shown. A failure of the parent
resolution SHALL leave that page's rows listed, SHALL NOT put the grid into its failure state, and
SHALL NOT raise a notification.

This is declared per view. The `Config` view — which aggregates children under their parent instead —
and the `Deployments` view SHALL be unchanged: neither resolves parents, and neither suppresses a row.

#### Scenario: Child column activities of a deleted table are absent while its Delete row is shown

- **GIVEN** a revision in which a table with several columns was deleted
- **AND** the feed answers it as one `Table` `Delete` activity and one `TableColumn` `Delete` activity
  per column, each naming the table activity as its parent
- **WHEN** the Analytics view renders the block
- **THEN** the `Table` `Delete` row is displayed
- **AND** no `TableColumn` row of that revision is displayed

#### Scenario: A column dropped from a living table is still listed

- **GIVEN** a revision in which one column was dropped from a table that still exists
- **AND** the feed answers it as a `Table` `Update` activity and a `TableColumn` `Delete` activity
  naming that table activity as its parent
- **WHEN** the Analytics view renders the block
- **THEN** both rows are displayed at the top level
- **AND** the `TableColumn` row's `Parent ID` cell shows the `Table` row's activity identifier

#### Scenario: The deleted table's own detail view still shows every removed column

- **GIVEN** the `Table` `Delete` activity of a table that had several columns
- **AND** the analytics backend answers the deleting revision's snapshot as not found and the previous
  revision's snapshot with every column the table had
- **WHEN** the user opens that activity's detail page
- **THEN** the diff renders one column group per column of the previous revision
- **AND** each of those groups states `Removed`
- **AND** no column the table had is absent from the diff

#### Scenario: A child whose parent cannot be resolved stays listed

- **GIVEN** the feed returns a `TableColumn` activity carrying a `parentActivityId` that the parent
  resolution does not answer for
- **WHEN** the Analytics view renders the block
- **THEN** that row is displayed

#### Scenario: A page whose rows have no parent issues no resolution request

- **GIVEN** a page of activities none of which carries a `parentActivityId`
- **WHEN** the Analytics view renders the block
- **THEN** no parent-resolution request is issued
- **AND** every row of the page is displayed

#### Scenario: The Config and Deployments views resolve no parents and suppress no rows

- **WHEN** the active view is `Config`, and then `Deployments`
- **THEN** no parent-resolution request is issued for either
- **AND** each view lists exactly the rows it lists today

### Requirement: Analytics resource types are labelled and localized

`ActivityAuditResourceType` SHALL gain the members the analytics backend emits — `Table`,
`TableColumn`, `Pipeline`, `SavedQuery` — and a predicate that answers whether a resource type is an
analytics one, colocated with the existing resource-set predicates beside that enum. The
`Resource type` column SHALL render each through the shared formatter as a localized singular label:
`Table`, `Table column`, `Pipeline`, `Saved query`. Every label SHALL resolve through an i18n key
present in the locale dictionary; the `Analytics` view-option label SHALL likewise be a new key
alongside the existing `Config` and `Deployments` option labels.

#### Scenario: Table column row displays its singular label

- **WHEN** the grid receives an activity with `resourceType: "TableColumn"`
- **THEN** the `Resource type` cell renders the localized `Table column` label
- **AND** the key backing it exists in `apps/ai-dial-admin/src/locales/en.ts`

#### Scenario: Saved query row displays its singular label

- **WHEN** the grid receives an activity with `resourceType: "SavedQuery"`
- **THEN** the `Resource type` cell renders the localized `Saved query` label

#### Scenario: Analytics resource predicate answers for the four types and nothing else

- **WHEN** the predicate is asked about `Table`, `TableColumn`, `Pipeline`, and `SavedQuery`
- **THEN** it answers true for each
- **AND** it answers false for `Model`, `McpDeployment`, `ImageBuildDomainWhitelist`, and for an
  undefined resource type

### Requirement: Adding analytics resource types does not change the Config or Deployments resource-type filter

The `Resource type` free-text filter is expanded through a map built by iterating every member of
`ActivityAuditResourceType` and keying by the lowercased formatted label, and it narrows a `contains`
filter to an `equals` filter only when exactly one enum member matches. Adding the analytics members
SHALL NOT change which enum member any label that resolved to a single member before this change
resolves to, and SHALL NOT introduce a label that collides with an existing one.

#### Scenario: Existing single-match label resolutions are unchanged

- **WHEN** the resource-type label map is built after the analytics members are added
- **THEN** the label `global firewall` still resolves to exactly `ImageBuildDomainWhitelist`
- **AND** the image label resolves to exactly the set `AdapterImageDefinition`,
  `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`
- **AND** the model-serving label resolves to exactly the set `NimDeployment`, `InferenceDeployment`
- **AND** each of the four container labels resolves to exactly one member — respectively
  `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`
- **AND** no analytics label is equal to any pre-existing label

#### Scenario: Global Firewall audit shortcut still narrows to one type

- **GIVEN** the Global Firewall popup's `View in Activity Audit` link has applied its
  `Resource type` `contains` filter
- **WHEN** the request filters are built
- **THEN** the filter is still narrowed to `{ column: "resourceType", operator: "eq", value: "ImageBuildDomainWhitelist" }`

### Requirement: Rollback affordances are absent for analytics activities

The analytics backend exposes no endpoint that creates, edits, or deletes an audit record, revision,
or snapshot, and no table-, pipeline-, or saved-query-rollback route. There are three rollback
affordances in the audit capability and all three SHALL be absent for an analytics activity:

- the page-level `Rollback` button on the list SHALL not render while the Analytics view is active
  (it is already restricted to the `Config` view);
- the per-row action menu SHALL NOT offer a `Rollback` action for any Analytics view row, on the
  global page or in an entity Audit tab;
- the `Rollback resource` button on the audit **detail** page (`/activity-audit/{activityId}`) SHALL
  NOT render when the activity's resource type is an analytics one. Today that button is conditional
  only on the viewer not being a read-only admin, and its handler falls through to the admin
  backend's per-revision rollback — a write aimed at a backend that does not own the resource.

No disabled rollback control SHALL be rendered in place of any of them. The detail page's rollback
button SHALL be unchanged for admin and deployment-manager activities, including its read-only-admin
condition and its deployment lifecycle block reason.

#### Scenario: No page-level rollback button

- **WHEN** the user switches to the Analytics view
- **THEN** the page-level `Rollback` button is not rendered

#### Scenario: No per-row rollback action

- **WHEN** the user opens the row action menu on any Analytics view row
- **THEN** the menu offers `Open in a new tab`
- **AND** the menu does not offer `Rollback`, enabled or disabled

#### Scenario: No rollback button on an analytics activity's detail page

- **GIVEN** a viewer who is not a read-only admin
- **WHEN** the user opens `/activity-audit/{activityId}` for an activity whose `resourceType` is
  `Table`, `TableColumn`, `Pipeline`, or `SavedQuery`
- **THEN** the `Rollback resource` button is not rendered
- **AND** no disabled rollback control is rendered in its place

#### Scenario: The detail page's rollback button is unchanged for an admin activity

- **GIVEN** a viewer who is not a read-only admin
- **WHEN** the user opens the detail page for an activity whose `resourceType` is `Model`
- **THEN** the `Rollback resource` button is rendered as it is today

### Requirement: Analytics view rows open the global audit detail page

For every resource type in the Analytics view, `/activity-audit/{activityId}` SHALL be reachable from
a row by two entry points, and **both SHALL open it in a new browser tab**, leaving the list in the
tab it is in: the row action menu's `Open in a new tab` item, and a click on the row body — anywhere
outside the action menu and the row-expander cell. Opening in a new tab is the shared, pre-existing
behaviour of this list, which the `Config` and `Deployments` views already have; this capability
changes only which resource types are navigable at all, never the tab a row opens in. No analytics
resource type SHALL remain a no-op row, and no entity-namespaced audit detail route
(`/tables/{name}/{activityId}` and its siblings) SHALL be introduced by this capability.

#### Scenario: Row body click opens the detail page in a new tab

- **WHEN** the user clicks the row body — outside the action menu — on an Analytics view row whose
  `activityId` is `abc-123`
- **THEN** a new browser tab opens at `/activity-audit/abc-123`
- **AND** the tab holding the list stays on `/activity-audit`

#### Scenario: The row menu's Open in a new tab item opens the detail page

- **WHEN** the user clicks `Open in a new tab` in the action menu of an Analytics view row whose
  `activityId` is `abc-123`
- **THEN** a new browser tab opens at `/activity-audit/abc-123`

### Requirement: Audit detail page resolves analytics activities

The unified audit-detail resolver SHALL resolve an activity that neither the admin backend nor the
deployment-manager backend knows by asking the analytics backend
(`GET /v1/activities/{activityId}`), as a third and last step of the existing fallback chain. That
third request SHALL be issued only when the analytics feature is enabled in the environment the
resolver runs in, so an installation without analytics pays no extra request on the detail page's
critical path.

The environment value SHALL be read through the same truthiness helper every other feature flag in
this app is read through (`isValueTruthy`, `apps/ai-dial-admin/src/utils/types.ts`, which answers true
only for the exact string `true`), not through a bare truthiness check on `process.env` — an
installation that sets `ANALYTICS_ENABLED=false` explicitly is a disabled installation, and a bare
check reads that string as enabled.

When the activity resolves as an analytics one, the resolver SHALL fetch the current revision, the
previous revision, and the latest-revision entity snapshot in parallel, as it already does for the
other two backends, and return the same `{ activity, activityRevision, previousRevision, entity }`
shape, which `AuditView` renders through the generic diff engine.

#### Scenario: Analytics activity resolves after both existing lookups miss

- **GIVEN** an `activityId` that the admin backend and the deployment-manager backend both answer as
  unknown
- **WHEN** the user opens `/activity-audit/{activityId}` and the analytics feature is enabled
- **THEN** the resolver asks the analytics backend for that activity
- **AND** the detail page renders the diff view for it

#### Scenario: Admin and deployment activities are unaffected

- **WHEN** the user opens the detail page for an activity the admin backend resolves
- **THEN** neither the deployment-manager nor the analytics lookup is issued

#### Scenario: No analytics lookup when the feature is disabled

- **GIVEN** the analytics feature is disabled in the environment — `ANALYTICS_ENABLED` unset, or set
  to the string `false`
- **WHEN** the user opens the detail page for an activity neither existing backend resolves
- **THEN** no request is issued to the analytics backend in either case
- **AND** the page renders its existing not-found state

### Requirement: Analytics snapshots are resolved per resource type

The revision-route table SHALL resolve an analytics snapshot URL per resource type:
`Table` → `v1/tables/{name}/revision/{revision}`; `Pipeline` →
`v1/pipelines/{name}/revision/{revision}`; `SavedQuery` →
`v1/saved-queries/{id}/revision/{revision}`. A `TableColumn` has no snapshot endpoint of its own; its
resource identifier is `<table>:<column>`, so its snapshot SHALL be the owning table's snapshot at
the same revision, resolved by taking the identifier's table half.

A snapshot the backend answers as absent — the analytics backend answers `404`
`revision_not_found` for a revision before the resource existed, at or after its deletion, or for a
resource whose creation predates the audit trail — SHALL be treated as "no snapshot" and SHALL render
the detail page without an error page and without a notification, exactly as the existing
negative-revision case does.

#### Scenario: Table snapshot route

- **WHEN** a snapshot is requested for an activity with `resourceType: "Table"`, `resourceId: "orders"`,
  and revision `7`
- **THEN** the analytics backend is asked for `v1/tables/orders/revision/7`

#### Scenario: Table column snapshot resolves through its table

- **WHEN** a snapshot is requested for an activity with `resourceType: "TableColumn"`,
  `resourceId: "orders:total"`, and revision `7`
- **THEN** the analytics backend is asked for `v1/tables/orders/revision/7`

#### Scenario: Pipeline and saved query snapshot routes

- **WHEN** a snapshot is requested for an activity with `resourceType: "Pipeline"` and
  `resourceId: "daily_rollup"`, and for one with `resourceType: "SavedQuery"` and `resourceId: "q1"`,
  each at revision `3`
- **THEN** the analytics backend is asked for `v1/pipelines/daily_rollup/revision/3` and
  `v1/saved-queries/q1/revision/3` respectively

#### Scenario: Missing snapshot renders without an error

- **GIVEN** an analytics activity whose snapshot the backend answers as not found
- **WHEN** the user opens its detail page
- **THEN** the page renders with an empty side of the comparison
- **AND** no error page and no error notification is shown

### Requirement: The detail page header links an analytics resource to its own detail page

The audit detail page's header renders an external-link control beside the resource identifier. Its
target SHALL be resolved per resource type: `Table` and `TableColumn` to `/{locale}/tables/{table}` —
a `TableColumn` identifier being `<table>:<column>`, its table half — `Pipeline` to
`/{locale}/pipelines/{name}`, and `SavedQuery` to `/{locale}/queries/{id}`. The control SHALL render
only when a target resolves; for a resource type with no known route it SHALL NOT render, rather than
producing today's `/{locale}/undefined/{resourceId}`.

This resolution SHALL NOT be implemented by adding analytics entries to the shared
resource-type → route map that the audit list's `Open in a new tab` href also reads
(`auditResourceRoute`, `apps/ai-dial-admin/src/constants/activity-audit.ts`). An entry there would
make an analytics row's href `/tables/{name}/{activityId}` — an entity-namespaced audit detail route
this change deliberately does not create, so every analytics row click would 404. The href builder
SHALL keep returning an empty href for every analytics resource type, and a test SHALL pin that,
naming the coupling, so a later fix to the header cannot silently reintroduce the broken route.

#### Scenario: Header links a table activity to its table

- **WHEN** the user opens the detail page for an `Update` activity with `resourceType: "Table"` and
  `resourceId: "orders"`
- **THEN** the header's external-link control opens `/en/tables/orders`

#### Scenario: Header links a column activity to its table

- **WHEN** the user opens the detail page for an activity with `resourceType: "TableColumn"` and
  `resourceId: "orders:total"`
- **THEN** the header's external-link control opens `/en/tables/orders`

#### Scenario: Header omits the link when no target resolves

- **WHEN** the user opens the detail page for an activity whose resource type has no route registered
- **THEN** no external-link control is rendered beside the resource identifier
- **AND** no link to a `/en/undefined/...` URL exists on the page

#### Scenario: No entity-namespaced audit route is produced for an analytics resource type

- **WHEN** the audit list builds a row href for an activity whose `resourceType` is `Table`
- **THEN** the entity-namespaced href builder returns an empty href
- **AND** no `/tables/{name}/{activityId}` URL is produced anywhere in the change

### Requirement: An analytics revision diff shows every field of the snapshot

The detail page renders an analytics revision through the shared diff engine. For an analytics
resource type the engine SHALL emit a diff row for **every** field the snapshot carries, on both
sides of the comparison, so a reader sees the full state of the resource with the changes located
inside it. There SHALL be no hidden-key list for analytics resources — unlike the container and image
resource types, which suppress `$type`, `id`, `createdAt` and `updatedAt` — and no field SHALL be
dropped because the engine has no dedicated handler registered for its shape:

- a scalar field renders as one row: its parameter and its value;
- an object-valued field renders as one row per leaf, its parameter naming the path to that leaf
  (`grain.grain_key`, `partition_by.granularity`);
- an array of scalars renders as a single row whose value joins the elements **in the order the
  snapshot lists them**. `ordering_key` and `tag_order` are ordered fields whose order is their
  meaning; sorting them would render a reordering as no change at all.

Each parameter SHALL be labelled through the localized field labels the tables feature already
defines; a field with no label defined SHALL fall back to the snapshot's own field name rather than
being hidden.

#### Scenario: Every field of a table snapshot appears in the diff

- **WHEN** the detail page renders a table revision whose snapshot carries `name`, `description`,
  `type`, `source_table`, `status`, `ordering_key`, `partition_by`, `identity_column`,
  `version_column` and `tag_order`
- **THEN** the table-definition group displays a row for each of those fields
- **AND** no field present in either snapshot is absent from the rendered diff

#### Scenario: An ordered list field keeps the snapshot's order

- **GIVEN** a table snapshot whose `ordering_key` lists `created_at` and then `id`
- **WHEN** the detail page renders it
- **THEN** the `ordering_key` row's value reads `created_at, id`
- **AND** it is not re-sorted alphabetically

#### Scenario: A pipeline or saved-query snapshot is rendered field by field

- **WHEN** the detail page renders a `Pipeline` or a `SavedQuery` revision
- **THEN** every field of that snapshot is displayed as a row in the definition group
- **AND** no column group is rendered for it

### Requirement: An analytics revision diff groups the definition and each column separately

A table snapshot's fields SHALL be grouped: the table-definition fields — every field other than
`columns` — under a single group, and the columns under a `Columns` section holding **one group per
column**. A column group SHALL exist for every column name present in either revision, the groups
SHALL be ordered by column name, and each SHALL list every attribute that column carries (`name`,
`type`, `element_type`, `enum_values`, `nullable`, `tag`, `display_name`, `description`,
`sensitive`).

Each column group SHALL be headed by the name of the column it describes, so a reader can tell which
column a group is about without reading its rows.

#### Scenario: Each column is its own group headed by its name

- **GIVEN** a table revision whose snapshot carries the columns `amount` and `total`
- **WHEN** the detail page renders it
- **THEN** the diff shows one group headed `Column amount` and one headed `Column total`
- **AND** each lists that column's own attributes
- **AND** the table-definition fields are shown in a separate group above them

#### Scenario: Column groups are ordered by column name

- **GIVEN** a table revision whose snapshot lists the columns `total`, `amount`, `id` in that order
- **WHEN** the detail page renders it
- **THEN** the column groups appear in the order `amount`, `id`, `total`

### Requirement: Added and removed columns stay visible and are marked as such

A column present in one revision and absent from the other SHALL remain visible on **both** sides of
the comparison: the side that carries it shows its attribute rows marked as added or removed, and the
opposite side shows the same group with placeholder rows. Both revisions therefore show the full
column set and the difference is carried by the marker, not by an absence — a removed column is not
simply missing from the newer revision's side.

A column present in both revisions whose attributes differ SHALL have the differing rows marked as
changed, and its unchanged rows SHALL still be displayed.

The marker SHALL NOT be carried by colour alone. Each column group SHALL state its status in text
beside the column name — `Added`, `Removed`, or `Changed` — and SHALL be exposed as a group whose
accessible name carries both the column name and its status.

The existing `All parameters` / `Changes only` control SHALL keep working over these groups: with
`Changes only` selected, a group with no marked row SHALL not be rendered. (`Changes only` is the
shipped label of that option — `ActivityAudit.Differences` in
`apps/ai-dial-admin/src/locales/en.ts`; the control itself is pre-existing and this change does not
rename or move it.)

#### Scenario: A column added in this revision is marked as added

- **GIVEN** a revision that adds the column `total` to the table `orders`
- **WHEN** the user opens that activity's detail page
- **THEN** the `Column total` group is shown on both sides of the comparison
- **AND** on the side that carries the column its rows are marked as added
- **AND** the group states `Added` beside the column name

#### Scenario: A column removed in this revision stays visible and is marked as removed

- **GIVEN** a revision that drops the column `legacy_id` from the table `orders`
- **WHEN** the user opens that activity's detail page
- **THEN** the `Column legacy_id` group is still shown on both sides of the comparison
- **AND** it states `Removed` beside the column name
- **AND** the group is not omitted from the side where the column no longer exists

#### Scenario: A changed column attribute is marked as changed

- **GIVEN** a revision that marks the column `email` of the table `orders` sensitive
- **WHEN** the user opens that activity's detail page
- **THEN** the `Column email` group states `Changed` beside the column name
- **AND** its `sensitive` row is marked as changed
- **AND** its unchanged rows are still displayed

#### Scenario: The status of a column group is readable without colour

- **GIVEN** the detail page of a revision that adds one column and drops another
- **WHEN** the groups are inspected by accessible name
- **THEN** each column group's accessible name carries the column's name and its status
- **AND** the status is also shown as text, not only as a row colour

#### Scenario: Changes only hides column groups with no change

- **GIVEN** the detail page of a revision that changes one column of a table with several columns
- **WHEN** the user selects `Changes only`
- **THEN** only the changed column's group is rendered
- **AND** selecting `All parameters` again renders every column group
