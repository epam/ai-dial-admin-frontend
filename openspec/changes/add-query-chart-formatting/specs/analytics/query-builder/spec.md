## MODIFIED Requirements

### Requirement: The builder opens as a draft on a table held by the page

The Analytics group SHALL provide the Query Builder at `/queries` as a **draft**: a builder on one
queryable table with no stored query behind it. The page SHALL be an `async` server component gated by
the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is
denied. A draft SHALL be runnable, and its result exportable, without being saved.

The draft's table SHALL be the table last picked in the Source panel, as specified in
`analytics/source-panel`, and the **default table** when none was picked: `dial_usage_log` when it is
queryable, otherwise the first queryable table. The address SHALL stay
`/queries` whatever the table: the table is not part of the address. The picked table SHALL be held for
as long as the user stays within the Queries pages, so returning to the draft from a saved query SHALL
show the table picked before; reloading the page SHALL return the draft to the default table.
The page heading SHALL show the draft's table name.

The default table's schema SHALL be read on the server with the page. The schema of a table
picked afterwards SHALL be read when it is picked; while it is being read the builder SHALL show a
loading indicator in place of the draft, and a schema that cannot be read SHALL leave the draft on that
table with the schema-load failure state.

A draft SHALL start from the builder's defaults for its table. Its state SHALL live in the page only:
reloading the page, or leaving and returning, SHALL start the draft again from those defaults.

In place of the saved query's own actions, a draft's heading row SHALL offer **Save as query**, and
SHALL offer **Reset** while the draft differs from its starting state. Reset SHALL ask for confirmation
and, on confirmation, SHALL return the draft to its starting state for the same table. A draft SHALL
NOT offer Edit, Save, Discard or Delete, because there is no stored query for them to act on. Saving a
draft is specified in `analytics/saved-queries`.

#### Scenario: The menu item opens a draft

- **WHEN** the user opens `/queries` without having picked a table
- **THEN** the builder is shown on `dial_usage_log`
- **AND** the heading shows that table's name

#### Scenario: Without the usage log the first table is the default

- **WHEN** `dial_usage_log` is not among the queryable tables and the user opens `/queries` without having picked a table
- **THEN** the builder is shown on the first queryable table

#### Scenario: A picked table becomes the draft's table

- **WHEN** the user picks a table in the Source panel
- **THEN** the builder is shown on that table with its fields available
- **AND** the address is `/queries` with no query parameter

#### Scenario: The picked table is kept across a saved query

- **WHEN** the user picks a table, opens a saved query, and returns to `/queries`
- **THEN** the draft is shown on the table picked before

#### Scenario: A reload returns to the default table

- **WHEN** the user picks a table other than the default and reloads the page
- **THEN** the builder is shown on the default table

#### Scenario: A reload returns to the first table

- **WHEN** `dial_usage_log` is not among the queryable tables, and the user picks a table other than the first and reloads the page
- **THEN** the builder is shown on the first queryable table

#### Scenario: A draft runs without being saved

- **WHEN** the user runs a draft
- **THEN** the result is shown
- **AND** no saved query was created

#### Scenario: A draft does not survive a reload

- **WHEN** the user changes a draft and reloads the page
- **THEN** the draft is back at the builder's defaults

#### Scenario: A draft offers Save as query

- **WHEN** a draft is open
- **THEN** the heading row offers Save as query
- **AND** it offers neither Edit nor Delete

#### Scenario: Reset appears once the draft has changed

- **WHEN** the user changes anything a saved query would store — a filter, the time period, the result view
- **THEN** the heading row offers Reset

#### Scenario: Reset returns the draft to its starting state

- **WHEN** the user activates Reset and confirms
- **THEN** the draft shows the builder's defaults for the same table
- **AND** Reset is no longer offered

#### Scenario: Access denied

- **WHEN** a caller without Analytics access opens `/queries`
- **THEN** the page resolves to the 403 page
