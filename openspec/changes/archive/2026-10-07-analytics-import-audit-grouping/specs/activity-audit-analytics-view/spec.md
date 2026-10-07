## ADDED Requirements

### Requirement: An Analytics import is listed as one Import row with its activities beneath it

In the global Activity Audit list's `Analytics` view, activities that carry the same `importId` SHALL be listed as one
group: an **Import** row followed by every activity of that import. The Import row is built by the client — the
analytics backend writes no parent activity — and SHALL show activity type `Import`, the import's initiating author
and email, and the time of the import's latest activity. It SHALL render expanded, with the view's expander
indicator, and SHALL NOT be collapsible, matching the admin Import row. Each activity beneath it SHALL be marked as a
child row; an activity that already has a parent of its own (a table column under its table) SHALL keep it.

The group SHALL be placed where the list first meets one of its activities in the requested sort order, and SHALL be
complete regardless of page boundaries: on meeting an `importId` it has not grouped yet, the list SHALL request every
activity with that `importId` — combined with the reader's current filters, so a filtered list stays filtered inside
the group — reading all pages of that request, and SHALL NOT list an activity of an already grouped import again when
a later page returns it.

A request for a group's activities that fails — rejected, answered with an error, or missing any of its pages —
SHALL NOT fail the list and SHALL NOT hide a row: that import SHALL be listed flat, as without grouping, on this page
and on every later page of the same list pass, and SHALL NOT be requested again in that pass.

The Import row is not an activity of the feed, so a column filter on activity type `Import`, or on a `Parent ID` of
`import:<importId>`, matches no row. Activities with no `importId` SHALL be listed exactly as today. The single-entity audit tabs (a table's or a
pipeline's own Audit tab) SHALL list rows flat, without Import rows.

#### Scenario: An import is grouped under one row

- **WHEN** the feed returns two `Create` activities with `importId` `i-1` and one activity with no `importId`
- **THEN** the list shows an Import row followed by the two `Create` rows marked as its children
- **AND** the activity with no `importId` is listed on its own

#### Scenario: A group that spans a page boundary is complete

- **WHEN** the first page returns one activity of import `i-1` and the import has three activities
- **THEN** the list requests the activities filtered by `importId = i-1` and lists all three under the Import row
- **AND** when a later page returns another activity of `i-1`, it is not listed a second time

#### Scenario: The reader's filters apply inside the group

- **WHEN** the reader filters the list to resource type `Pipeline` and an import created a table and a pipeline
- **THEN** the Import row lists only the pipeline activity

#### Scenario: A rolled-back import shows its creates and deletes together

- **WHEN** an import created a table, failed, and deleted the table again
- **THEN** its Import row lists both the `Create` and the `Delete` activity of that table

#### Scenario: Column activities stay under their table

- **WHEN** an import created a table whose column activities point at the table activity as their parent
- **THEN** inside the group the column rows keep their parent and are marked as children

#### Scenario: Group request fails

- **WHEN** the request for an import's activities fails, and a later page returns another activity of that import
- **THEN** the list still renders, with every activity of that import listed flat and no Import row
- **AND** the import's activities are not requested again

#### Scenario: Entity Audit tab stays flat

- **WHEN** a table's Audit tab lists activities that carry an `importId`
- **THEN** no Import row is shown and the activities are listed as they are today

### Requirement: The Import row offers no navigation or row actions

The client-built Import row SHALL NOT be navigable — clicking it SHALL NOT open the audit detail page — and SHALL
offer no row actions, as the admin Import row does not. Its child rows SHALL keep their own behavior, including
opening the audit detail page.

#### Scenario: Clicking the Import row does nothing

- **WHEN** the user clicks the Import row
- **THEN** no detail page opens and no action menu is offered

#### Scenario: A child row still opens its detail

- **WHEN** the user clicks a child row of an Import group
- **THEN** the audit detail page for that activity opens, as it does outside a group

## MODIFIED Requirements

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
`Config` view's column set minus the `Deployments` view's `Version` column, i.e. `Activity type`, `Resource type`,
`Resource identifier`, `Time`, `Initiated`, `Activity ID`, `Parent ID`, with `Time` keeping its default descending
sort. The global page SHALL also render the row-expander column first, which marks the Import rows of *An Analytics
import is listed as one Import row with its activities beneath it*; an entity Audit tab builds no Import rows and
SHALL NOT render it.

In an entity Audit tab whose resource type owns no child activities, the feed carries exactly one
resource type and one resource identifier, so those two columns would repeat the same pair on every
row. There the view SHALL instead use the single-entity column set the `Config` and `Deployments`
entity Audit tabs already use — `Resource type` and `Resource identifier` absent, the rest as above —
while still offering no `Rollback` row action, which no other view's single-entity set can say. Which
of the two sets applies SHALL be decided from the tab's own resource type through one predicate over
`ActivityAuditResourceType`, not from the view and not from the presence of an entity: the view is the
same in both cases, and the presence of an entity is what the two cases have in common.

Apart from the import grouping, every row this view lists SHALL be rendered flat, at the top level: the
client-side `parentActivityId` aggregation the `Config` view applies SHALL NOT run, and a child activity's
`Parent ID` cell SHALL show the parent activity identifier the backend supplied. An activity listed inside an
Import group that has no parent of its own SHALL show the group's identifier (`import:<importId>`) there. Flat
rendering and the suppression of a deleted table's children are separate rules — a child that is listed is listed
flat, never nested under its parent.

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
- **AND** neither row renders a row-expander indicator
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
