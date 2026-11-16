## ADDED Requirements

### Requirement: The builder opens as a draft without a stored query

The Analytics group SHALL provide the Query Builder at `/queries` as a **draft**: a builder on one
queryable table with no stored query behind it. The page SHALL be an `async` server component gated by
the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is
denied. A draft SHALL be runnable, and its result exportable, without being saved.

The draft's table SHALL be named by the `table` query parameter. When the parameter is absent, or names
a table that is not among the queryable ones, the draft SHALL be built on the first queryable table.
The page heading SHALL show the draft's table name.

A draft SHALL start from the builder's defaults for its table. Its state SHALL live in the page only:
reloading the page, or leaving and returning, SHALL start the draft again from those defaults.

In place of the saved query's own actions, a draft's toolbar SHALL offer **Save as query**, and SHALL
offer **Reset** while the draft differs from its starting state. Reset SHALL ask for confirmation and,
on confirmation, SHALL return the draft to its starting state for the same table. A draft SHALL NOT
offer Edit, Save, Discard or Delete, because there is no stored query for them to act on. Saving a draft
is specified in `analytics/saved-queries`.

#### Scenario: The menu item opens a draft

- **WHEN** the user opens `/queries` with no query parameter
- **THEN** the builder is shown on the first queryable table
- **AND** the heading shows that table's name

#### Scenario: The table parameter picks the draft's table

- **WHEN** the user opens `/queries?table=<name>` for a queryable table
- **THEN** the builder is shown on that table with its fields available

#### Scenario: An unknown table falls back to the first one

- **WHEN** the user opens `/queries?table=<name>` and no queryable table has that name
- **THEN** the builder is shown on the first queryable table

#### Scenario: A draft runs without being saved

- **WHEN** the user runs a draft
- **THEN** the result is shown
- **AND** no saved query was created

#### Scenario: A draft does not survive a reload

- **WHEN** the user changes a draft and reloads the page
- **THEN** the draft is back at the builder's defaults for its table

#### Scenario: A draft offers Save as query

- **WHEN** a draft is open
- **THEN** the toolbar offers Save as query
- **AND** it offers neither Edit nor Delete

#### Scenario: Reset appears once the draft has changed

- **WHEN** the user changes anything a saved query would store — a filter, the time period, the result view
- **THEN** the toolbar offers Reset

#### Scenario: Reset returns the draft to its starting state

- **WHEN** the user activates Reset and confirms
- **THEN** the draft shows the builder's defaults for the same table
- **AND** Reset is no longer offered

#### Scenario: Access denied

- **WHEN** a caller without Analytics access opens `/queries`
- **THEN** the page resolves to the 403 page

## MODIFIED Requirements

### Requirement: Query Builder layout and view switcher

The Query Builder SHALL be rendered by two pages: the draft builder (`app/[lang]/queries/page.tsx`) and
a saved query's page (`app/[lang]/queries/[id]/page.tsx`). Each SHALL render a page heading — the saved
query's name, or the draft's table name — a toolbar, a main results area, and a query-builder rail on
the right side of the content area. Both SHALL be laid out to the right of the Source panel specified
in `analytics/source-panel`. The toolbar SHALL contain the shared time filter, the page's own actions,
and the Run action; it SHALL NOT contain a source selector. The rail header SHALL offer three mutually
exclusive views — **Builder** (form), **SQL**, and **JSON** — via a `SegmentedControl`; selecting a view
SHALL change the rail body without a page reload and the current view SHALL be indicated. The view
switcher SHALL NOT be shown before a schema is loaded. Base form controls SHALL come from the DIAL UI
Kit and tabular results SHALL be displayed with the app's grid stack.

The builder SHALL be reachable both through a saved query and as a draft with no stored query behind it.

On both pages the breadcrumbs SHALL show the Queries section only; a saved query's identifier SHALL NOT
appear as a breadcrumb.

#### Scenario: Results-first layout renders

- **WHEN** the user opens a saved query
- **THEN** the query's name is shown as the heading
- **AND** a toolbar with the time filter, the query's actions, and Run is shown
- **AND** the results area is the main content
- **AND** the query-builder rail is shown at the right

#### Scenario: A draft renders the same layout

- **WHEN** the user opens the draft builder
- **THEN** the draft's table name is shown as the heading
- **AND** the toolbar, the results area and the query-builder rail are shown as on a saved query

#### Scenario: The breadcrumbs omit the query id

- **WHEN** the user opens a saved query
- **THEN** the breadcrumbs show the Queries section and no identifier

#### Scenario: The toolbar has no source selector

- **WHEN** either query page is shown
- **THEN** the toolbar offers no control that switches the source

#### Scenario: Three views offered once a schema is loaded

- **WHEN** the page has loaded an entity schema
- **THEN** the rail header offers Builder, SQL, and JSON views
- **AND** one view is indicated as selected

#### Scenario: Switcher hidden before a schema loads

- **WHEN** no schema has been loaded yet
- **THEN** the view switcher is not shown

### Requirement: Query Builder initial data loading and state

A saved query's page SHALL prefetch, on the server, the queryable entities, the function catalog, the
stored saved query, and the schema of that query's primary source, passing them to the client builder.
The draft builder SHALL prefetch, on the server, the queryable entities, the function catalog, and the
schema of the draft's table. The client SHALL seed its `QueryBuilderState` (entity name + fields, and —
for a saved query — the mode/filter/select/sort/page the stored query specifies) from those props
without a mount-time fetch.

The page's source SHALL be fixed by what the page was opened on. Building on another table SHALL be a
navigation to a draft on that table, not an in-place switch, so no builder selection can outlive the
schema it referenced. When no entities were provided, the builder SHALL show the entities-load-failed
empty state.

#### Scenario: Builder is seeded from server-fetched props

- **WHEN** the page prefetched a non-empty entities list, the stored query, and that query's primary-source schema
- **THEN** the builder renders with the primary source's fields available and the stored query reflected
- **AND** no client-side entities/schema/query request is issued on mount

#### Scenario: A draft is seeded from server-fetched props

- **WHEN** the draft page prefetched a non-empty entities list and the schema of the draft's table
- **THEN** the builder renders with that table's fields available and the builder's defaults
- **AND** no client-side entities/schema request is issued on mount

#### Scenario: Changing entity reloads schema and resets selections

- **WHEN** the user picks a different table
- **THEN** a draft on that table opens with its schema loaded
- **AND** no selection made on the previous page is present

#### Scenario: No entities provided

- **WHEN** the page provides an empty entities list
- **THEN** the builder shows the entities-load-failed empty state and no builder sections

### Requirement: Query Builder toolbar

Each query page SHALL render an in-page toolbar containing, left to right: the shared time filter
(`TimeFilter` with the global preset options and a custom-range picker), then right-aligned the page's
own actions, followed by Copy and the Run primary action. The toolbar SHALL NOT contain a source
selector.

On a saved query the page's own actions SHALL be Edit, Delete, Discard, Save, and Save as. Discard and
Save SHALL be present only while the page holds unsaved changes; Edit and Delete SHALL be present
whenever the caller may write the query; Save as SHALL be present whether or not the page holds unsaved
changes.

On a draft the page's own actions SHALL be Reset and Save as query, as specified by the draft
requirement.

#### Scenario: Toolbar composition

- **WHEN** the user opens a saved query they may write, with entities loaded
- **THEN** the toolbar shows the time filter, the Edit, Delete and Save as actions, Copy, and the Run action
- **AND** it shows no source dropdown

#### Scenario: Save and Discard appear with unsaved changes

- **WHEN** the page holds unsaved changes
- **THEN** the toolbar also shows the Discard and Save actions

#### Scenario: A draft's toolbar

- **WHEN** the user opens the draft builder
- **THEN** the toolbar shows the time filter, Save as query, Copy, and the Run action

### Requirement: The SQL editor reads the selected source from the builder context

Every part of the query builder that needs the page's entity, its fields, or the served function
catalog SHALL read them from the shared query-builder context rather than receive them as props, so a
single value decides which source is in play. This SHALL include the SQL editor's schema-aware
autocomplete. The AI panel SHALL NOT be among them: it sends no source information, so it reads no
source at all and the table a page is built on SHALL NOT change what it sends.

#### Scenario: SQL autocomplete follows the selected source

- **WHEN** the user opens a draft on a table and opens the SQL view
- **THEN** the editor's completions offer that table's fields

#### Scenario: The assistant request is independent of the selected source

- **WHEN** the user sends the same request to the assistant from drafts on two different tables
- **THEN** the messages sent are the same
