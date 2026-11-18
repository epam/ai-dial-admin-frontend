# analytics/source-panel Specification

## Purpose
The Source panel beside the Query Builder: the queryable tables with their columns and the saved
queries, how picking one navigates, and how unsaved work is guarded when the user leaves through it.
## Requirements
### Requirement: The query pages share a collapsible Source panel

Both query pages — the draft builder at `/queries` and a saved query at `/queries/{id}` — SHALL show a
Source panel at the left of the content area. The panel SHALL belong to the pages' shared layout, so
moving between a draft and a saved query, or between two saved queries, SHALL NOT reset its search
text, its expanded tables, its scope filter, its selected tab or the scroll position of its lists.

The panel SHALL offer a control that collapses it to a narrow strip carrying its label, and the strip
SHALL offer a control that expands it again. The collapsed state SHALL be remembered in the browser
across reloads. Both controls SHALL carry an accessible name and expose whether the panel is expanded.
While collapsed, the panel's tabs, search and rows SHALL be neither reachable by keyboard nor exposed
to assistive technology.

On a viewport narrower than the tablet breakpoint the panel SHALL start collapsed whatever state is
remembered, and expanding it SHALL open it over the builder rather than beside it, so the builder keeps
its width. Opening or closing it there SHALL NOT change the remembered state, and picking a table or a
query SHALL close it.

The panel SHALL NOT be shown on a query page that resolved to an access-denied or not-found result.

#### Scenario: The panel is present on the draft builder

- **WHEN** the user opens `/queries`
- **THEN** the Source panel is shown to the left of the builder

#### Scenario: The panel is present on a saved query

- **WHEN** the user opens a saved query's page
- **THEN** the Source panel is shown to the left of the builder

#### Scenario: Panel state survives navigation between queries

- **WHEN** the user types a search text in the panel and then opens a saved query from it
- **THEN** the search text and the selected tab are unchanged on the new page

#### Scenario: The picked row stays in view

- **WHEN** the user scrolls the Queries list and picks a query near its end
- **THEN** the list is still scrolled to the same position on the query's page

#### Scenario: Collapsing leaves a strip

- **WHEN** the user collapses the panel
- **THEN** only a narrow strip with the panel's label and an expand control is shown
- **AND** the panel's rows are not reachable with the keyboard

#### Scenario: A narrow viewport opens the panel over the builder

- **WHEN** the viewport is narrower than the tablet breakpoint
- **THEN** the panel is collapsed on load
- **AND** expanding it shows it over the builder, which keeps its width

#### Scenario: Picking a row closes the overlaid panel

- **WHEN** the panel is open over the builder and the user picks a table or a query
- **THEN** the picked page opens and the panel is collapsed again

#### Scenario: The collapsed state is remembered

- **WHEN** the user collapses the panel and reloads the page
- **THEN** the panel is still collapsed

### Requirement: The Source panel has a Tables tab and a Queries tab

The panel SHALL offer two mutually exclusive tabs, **Tables** and **Queries**, and SHALL indicate the
selected one. Switching tabs SHALL NOT navigate and SHALL NOT change what the builder shows.

When a query page is first loaded, the selected tab SHALL match what the page shows: Tables on the
draft builder, Queries on a saved query. After that the tab SHALL change only when the user changes it.

Each tab SHALL keep its own search text.

#### Scenario: A draft opens on the Tables tab

- **WHEN** the user loads `/queries`
- **THEN** the Tables tab is selected

#### Scenario: A saved query opens on the Queries tab

- **WHEN** the user loads a saved query's page directly
- **THEN** the Queries tab is selected

#### Scenario: Switching tabs does not navigate

- **WHEN** the user selects the other tab
- **THEN** the builder and the address are unchanged

### Requirement: The Tables tab lists the queryable tables

The Tables tab SHALL list the tables the builder can query — the entities returned by
`GET /v1/queries/entities` — in the order the service returns them. The list SHALL be fetched on the
server together with the page. A table's description and its column-tag order SHALL be taken from the
table of the same name in `GET /v1/tables`; a queryable table with no such counterpart SHALL still be
listed, without a description.

The tab SHALL offer a search field that narrows the list to the tables whose name contains the text,
ignoring case. The search SHALL NOT match column names.

The table the open draft is built on SHALL be marked as the current one. While a saved query is open no
table SHALL be marked.

A table with a description SHALL show it in a tooltip reachable by pointer and by keyboard; a table
without one SHALL show no tooltip.

#### Scenario: Queryable tables are listed

- **WHEN** the Tables tab is shown
- **THEN** every queryable table is listed by name

#### Scenario: Search narrows by table name

- **WHEN** the user types part of a table's name in the Tables search
- **THEN** only the tables whose name contains that text are listed

#### Scenario: Search that matches nothing

- **WHEN** the search text matches no table name
- **THEN** the tab shows a no-results state instead of an empty list

#### Scenario: The draft's table is marked

- **WHEN** a draft on a table is open
- **THEN** that table's row is marked as current

#### Scenario: No table is marked on a saved query

- **WHEN** a saved query is open
- **THEN** no table row is marked as current

#### Scenario: A table's description is reachable

- **WHEN** the user hovers or focuses a table that has a description
- **THEN** a tooltip shows that description

#### Scenario: No tables are available

- **WHEN** the service returned no queryable tables
- **THEN** the Tables tab shows an empty state

### Requirement: A failed list read is reported by notification

When the queryable tables or the saved queries cannot be read, the panel SHALL report it by an error
notification, following the Analytics read-failure rule: this app's own title for the failed read, and the service's message and request
identifier where the response carried them. The affected
tab MAY still show its empty state, which states the absence and not its cause. A failed read of the
tables catalog, which only supplies descriptions and the tag order, SHALL NOT be reported.

#### Scenario: A failed table read is reported

- **WHEN** the queryable tables cannot be read
- **THEN** an error notification titled with this app's own string carries the service's message and request identifier
- **AND** the Tables tab shows its empty state

#### Scenario: A failed query read is reported

- **WHEN** the saved queries of either scope cannot be read
- **THEN** an error notification says the saved queries could not be loaded

#### Scenario: A failed catalog read is silent

- **WHEN** only the tables catalog cannot be read
- **THEN** no notification is shown and the tables are listed without descriptions

### Requirement: Expanding a table shows its columns grouped by tag

Each table row SHALL offer a control that expands and collapses it, separate from the control that
picks the table, and SHALL expose its expanded state. Expanding a table SHALL NOT pick it.

A table's columns SHALL be read from `GET /v1/queries/entities/schema/{name}` the first time the table
is expanded, and SHALL NOT be requested for a table that was never expanded. While the columns are
being read the table SHALL show a loading state; if the read fails the table SHALL show an inline
failure with a retry control, and the failure SHALL NOT affect the builder or the other tables. Columns
already read SHALL be reused when the table is collapsed and expanded again.

Under an expanded table the columns SHALL be grouped by their tag. Each group SHALL show the tag and
the number of columns it holds, SHALL be collapsible on its own and SHALL expose its expanded state;
groups SHALL start expanded. Groups SHALL follow the table's column-tag order when the table defines
one; a tag the order does not name, and every tag of a table without an order, SHALL follow in the
order the tags first appear among the columns.

Columns without a tag SHALL NOT be placed in a group: they SHALL be listed directly under the table,
after the groups.

#### Scenario: Expanding does not pick the table

- **WHEN** the user expands a table that is not the open draft's table
- **THEN** its columns are shown
- **AND** the builder and the address are unchanged

#### Scenario: Columns load on first expansion

- **WHEN** the user expands a table for the first time
- **THEN** a loading state is shown under it until its columns arrive
- **AND** no columns were requested for the tables left collapsed

#### Scenario: A failed column read is local

- **WHEN** reading a table's columns fails
- **THEN** an inline failure with a retry control is shown under that table
- **AND** the builder keeps working

#### Scenario: Columns are grouped by tag

- **WHEN** an expanded table has columns carrying two different tags
- **THEN** two groups are shown, each with its tag and its column count

#### Scenario: Groups follow the table's tag order

- **WHEN** the table defines a column-tag order
- **THEN** the groups appear in that order

#### Scenario: Untagged columns are listed flat

- **WHEN** an expanded table has columns with no tag
- **THEN** those columns are listed directly under the table after the groups, with no group header

#### Scenario: A group collapses on its own

- **WHEN** the user collapses one tag group
- **THEN** its columns are hidden and the other groups are unchanged

### Requirement: A column row shows its label, its type and what is known about it

A column row SHALL show the column's display name when it has one and its name otherwise, and the
column's type. A label too long for the row SHALL be truncated rather than wrapped.

A sensitive column SHALL carry a marker beside its label. The marker SHALL NOT be the only way that
fact is conveyed: the column's tooltip SHALL state it in text.

A column row SHALL offer a tooltip, reachable by pointer and by keyboard, made of whichever of these
apply: the full label, when it is truncated in the row; a statement that the column holds sensitive
data; and the column's description. The tooltip SHALL NOT repeat a label the row already shows in full.
A row to which none applies SHALL show no tooltip.

Activating a column row SHALL do nothing.

#### Scenario: A display name is shown in place of the name

- **WHEN** a column has a display name
- **THEN** the row shows the display name and the column's type

#### Scenario: A long name is truncated and reachable

- **WHEN** a column's label does not fit the row
- **THEN** the label is truncated
- **AND** the tooltip gives the full label

#### Scenario: A label that fits is not repeated

- **WHEN** a column's label fits the row and the column has a description
- **THEN** the tooltip shows the description without the label

#### Scenario: A sensitive column is marked and described

- **WHEN** a column is sensitive
- **THEN** the row carries a marker
- **AND** the tooltip states that the column holds sensitive data

#### Scenario: A description is shown in the tooltip

- **WHEN** a column has a description
- **THEN** the tooltip includes it

#### Scenario: Nothing to add means no tooltip

- **WHEN** a column is not sensitive, has no description, and its label fits the row
- **THEN** the row shows no tooltip

### Requirement: Picking a query opens it

Picking a query in the Queries tab SHALL navigate to that query's page at `/queries/{id}`. A query row
SHALL be a link to that page, so it can be opened in a new browser tab.

#### Scenario: Picking a query

- **WHEN** the user picks a query in the Queries tab
- **THEN** the browser navigates to that saved query's page

#### Scenario: A query opens in a new tab

- **WHEN** the user opens a query row in a new browser tab
- **THEN** the new tab shows that query and the current tab is unchanged

### Requirement: Leaving unsaved work through the panel asks for confirmation

When the open page holds unsaved work — a saved query with unsaved changes, or a draft that differs
from its starting state — picking a table or a query in the panel SHALL first ask for confirmation,
using the same confirmation the page's own Discard uses. Confirming SHALL discard the unsaved work and
complete the navigation; cancelling SHALL leave the page, its unsaved work and the panel as they were.

When the open page holds no unsaved work the navigation SHALL happen without a confirmation.

Opening a row in a new browser tab SHALL NOT ask for confirmation, because the current page is not
left.

#### Scenario: A changed draft is guarded

- **WHEN** the user has changed a draft and picks another table
- **THEN** a confirmation is shown before anything changes

#### Scenario: A saved query with unsaved changes is guarded

- **WHEN** a saved query holds unsaved changes and the user picks another query
- **THEN** a confirmation is shown before the navigation

#### Scenario: Confirming completes the navigation

- **WHEN** the user confirms
- **THEN** the unsaved work is discarded and the picked table or query opens

#### Scenario: Cancelling keeps the work

- **WHEN** the user cancels the confirmation
- **THEN** the page still shows its unsaved work and the address is unchanged

#### Scenario: Clean pages navigate directly

- **WHEN** the open page holds no unsaved work and the user picks a table or a query
- **THEN** the navigation happens without a confirmation

### Requirement: The Queries tab reflects saved-query writes

The Queries tab SHALL show the saved queries as they are after a write made from the query pages: a
query created by saving a draft or by Save as SHALL appear, a query whose name, tag, description or
scope was edited SHALL show the new values, and a deleted query SHALL disappear — each without a manual
reload.

#### Scenario: A newly saved query appears

- **WHEN** the user saves a draft as a new query
- **THEN** the new query is listed in the Queries tab and marked as current

#### Scenario: A renamed query shows its new name

- **WHEN** the user edits the open query's name
- **THEN** its row in the Queries tab shows the new name

#### Scenario: A deleted query disappears

- **WHEN** the user deletes the open query
- **THEN** it is no longer listed in the Queries tab

### Requirement: Picking a table rebuilds the draft on it

Picking a table in the Tables tab SHALL make it the draft's table and open the draft builder at
`/queries`, whatever is open at the time — another draft or a saved query. The table SHALL NOT be
written into the address. The new draft SHALL start from the builder's defaults for that table; nothing
SHALL be carried over from the page that was open. Picking a table SHALL NOT change the source of an
open saved query.

A table row SHALL be a link to the draft builder. Opened in a new browser tab, it SHALL show a draft on
the first queryable table, since the picked table is held by the page it was picked in.

Picking the table the open draft is already built on SHALL leave the draft as it is when it holds no
changes. When the page holds unsaved work, the table SHALL become the draft's table only once the user
confirms leaving that work.

#### Scenario: Picking a table from a draft

- **WHEN** a draft is open and the user picks another table
- **THEN** the builder shows a fresh draft on that table
- **AND** the address stays `/queries`

#### Scenario: Picking a table from a saved query

- **WHEN** a saved query is open and the user picks a table
- **THEN** the draft builder opens on that table
- **AND** the saved query is left unchanged

#### Scenario: Unsaved work is confirmed before the table changes

- **WHEN** the page holds unsaved work and the user picks a table
- **THEN** the draft keeps its table until the user confirms leaving
- **AND** on confirmation the builder shows a fresh draft on the picked table

#### Scenario: A table opened in a new tab

- **WHEN** the user opens a table row in a new browser tab
- **THEN** the new tab shows a draft on the first queryable table and the current tab is unchanged

### Requirement: The Queries tab lists the saved queries by tag

The Queries tab SHALL list the saved queries visible to the caller grouped by tag. The service lists
one scope per call, so both the caller's personal scope and the common scope SHALL be fetched — on the
server, together with the page — and merged.

Queries that carry a tag SHALL be listed under a group for that tag; the groups SHALL be ordered by tag
name, ignoring case, and the queries inside a group by name, ignoring case. Queries without a tag SHALL
be listed after every group, as flat rows at the level of the group headings, ordered by name. A group
heading SHALL show its tag and the number of queries listed under it, SHALL be a control that collapses
and expands the group, exposing that state, and SHALL start expanded. Which groups are collapsed SHALL
be kept while the user stays within the Queries pages.

The tab SHALL offer a search field that narrows the list to the queries whose name or tag contains the
text, ignoring case.

The tab SHALL offer a scope filter with three choices — all queries, personal, common — defaulting to
all. The filter's control SHALL carry an accessible name, and SHALL indicate, in a way that does not
rely on colour alone, when a choice other than all is in effect. The search and the scope filter SHALL
apply together.

The saved query that is open SHALL be marked as the current one. While a draft is open no query SHALL
be marked.

A query row SHALL offer a tooltip, reachable by pointer and by keyboard, showing the query's scope and,
when it has one, its description.

#### Scenario: Both scopes appear in one list

- **WHEN** the caller has personal saved queries and common saved queries exist
- **THEN** the Queries tab lists both

#### Scenario: Tagged queries are grouped

- **WHEN** two queries carry the same tag and a third carries another
- **THEN** the tab shows one group per tag, ordered by tag name, each stating how many queries it holds

#### Scenario: Untagged queries follow the groups

- **WHEN** some queries carry a tag and others do not
- **THEN** the untagged queries are listed as flat rows after the last group

#### Scenario: A group collapses

- **WHEN** the user activates a group heading
- **THEN** the queries of that group are hidden and the heading exposes the collapsed state

#### Scenario: Filtering empties a group

- **WHEN** the search or the scope filter leaves no query of a tag
- **THEN** that tag's group is not shown

#### Scenario: Search matches name and tag

- **WHEN** the user types a text that one query carries in its name and another in its tag
- **THEN** both queries are listed

#### Scenario: The scope filter narrows the list

- **WHEN** the user chooses the personal scope in the filter
- **THEN** only personal queries are listed
- **AND** the filter control indicates that a filter is in effect

#### Scenario: Search and scope combine

- **WHEN** a scope is chosen and a search text is entered
- **THEN** only the queries matching both are listed

#### Scenario: Filters that match nothing

- **WHEN** the search and the scope filter leave no query
- **THEN** the tab shows a no-results state

#### Scenario: Nothing is saved yet

- **WHEN** the caller has no visible saved queries
- **THEN** the tab shows an empty state

#### Scenario: The open query is marked

- **WHEN** a saved query is open
- **THEN** its row is marked as current

#### Scenario: A row shows scope and description on hover

- **WHEN** the user hovers or focuses a query that has a description
- **THEN** a tooltip shows the query's scope and that description

### Requirement: Saving a draft shows the new query in the Queries tab

When a draft is saved as a new query and the page opens that query, the Source panel SHALL turn to its
Queries tab, so the new query is shown marked as the current one in its place in the list. This is the
one navigation that changes the tab on the user's behalf: opening a saved query in any other way SHALL
leave the tab the user last chose, and saving a saved query as a new one, which stays on the source
query's page, SHALL leave it too.

#### Scenario: A saved draft is shown in the Queries tab

- **WHEN** the user has the Tables tab open, saves a draft as a new query, and the page opens it
- **THEN** the Queries tab is shown with the new query marked as current

#### Scenario: Saving as a new query keeps the tab

- **WHEN** the user saves a saved query as a new query with the Tables tab open
- **THEN** the Tables tab stays shown

