## MODIFIED Requirements

### Requirement: Queries list page

The Analytics group SHALL provide a `/queries` page listing the saved queries visible to the caller. The page SHALL be an `async` server component gated by the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is denied. Because the service returns every visible row unpaged and offers no server-side sorting or filtering, the page SHALL fetch the full list on the server and the grid SHALL sort and filter client-side.

The service lists one scope per call, so the page SHALL fetch both the caller's personal scope and the common scope and present them as one list. The grid SHALL show, at minimum, the query's name, description, sources, tag, scope, the editor its body opens in, the author's display email, and its created and updated timestamps. The Source column SHALL render **every** entity the query reads, comma-separated in the order the service returns them, and its sorting, text filtering, and tooltip SHALL all read that same rendered text so a multi-source row is filterable by any of its entity names. A row whose `source` is absent or empty SHALL render an empty Source cell rather than failing. The editor column SHALL be derived from the body — a SQL body is SQL, a structured body the visual builder can represent is Builder, and any other structured body is JSON — and SHALL NOT be read from a stored field. The author column SHALL tolerate an absent value, which the service reports whenever there is no email to record.

The query's name SHALL be a link to that query's page and SHALL be the only part of the row that navigates; a click elsewhere in the row SHALL NOT navigate. Each row SHALL offer an actions menu with Open in new tab, Edit, and Delete. The page SHALL offer a Create action. When the caller has no visible saved queries the grid SHALL show an empty state.

#### Scenario: Both scopes appear in one list

- **WHEN** the caller has personal saved queries and common saved queries exist
- **THEN** the grid lists both
- **AND** each row shows its scope

#### Scenario: A multi-source query lists every source

- **WHEN** a listed saved query reads from two entities
- **THEN** its Source cell shows both names, comma-separated
- **AND** filtering the Source column by either name keeps the row

#### Scenario: The editor column is derived from the body

- **WHEN** a listed saved query carries a structured body whose filter nesting the visual builder cannot represent
- **THEN** its editor column reads JSON

#### Scenario: A row opens its query

- **WHEN** the user activates a query's name link
- **THEN** the browser navigates to that saved query's page

#### Scenario: A row click outside the name does not navigate

- **WHEN** the user clicks a grid row outside the query's name link
- **THEN** no navigation occurs

#### Scenario: Row actions are offered

- **WHEN** the user opens a row's actions menu
- **THEN** Open in new tab, Edit, and Delete are offered

#### Scenario: Empty state when nothing is visible

- **WHEN** the caller has no visible saved queries
- **THEN** the grid shows an empty state rather than an empty table
