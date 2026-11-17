## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Picking a table opens a new draft on it

**Reason**: The draft's table is no longer part of the address, so a table row no longer links to
`/queries?table=<name>`.

**Migration**: See "Picking a table rebuilds the draft on it".

### Requirement: The Queries tab lists the saved queries

**Reason**: The list is no longer flat; queries are grouped by tag.

**Migration**: See "The Queries tab lists the saved queries by tag".
