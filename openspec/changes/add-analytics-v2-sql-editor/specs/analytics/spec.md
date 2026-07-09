## ADDED Requirements

### Requirement: Query Builder view switcher includes a SQL view

The Query Builder page SHALL provide a whole-page view switcher offering three mutually exclusive views — Form, JSON, and SQL — rendered as a segmented control from the DIAL UI Kit (replacing the prior two-state JSON toggle). The switcher SHALL be available only once a schema is loaded. Selecting a view SHALL change the page body to that view without a page reload; the currently selected view SHALL be visually indicated.

#### Scenario: Three views are offered once a schema is loaded

- **WHEN** the page has loaded an entity schema
- **THEN** a view switcher offers Form, JSON, and SQL
- **AND** the current view is indicated

#### Scenario: Switcher hidden before a schema loads

- **WHEN** no schema has been loaded yet
- **THEN** the view switcher is not shown

### Requirement: SQL view shows only the source selector and a SQL editor

In the SQL view the page SHALL render the Source section (entity selector, and — for complex entities — the instance-id controls) and a SQL code editor filling the remaining area, and SHALL NOT render the Mode, Filter, Select, Group by, Time bucket, Aggregate, Having, Sort, or Page sections. The editor SHALL provide SQL syntax highlighting. The Copy and Run actions SHALL remain available; Copy SHALL copy the SQL editor text.

#### Scenario: SQL view hides the builder sections

- **WHEN** the user selects the SQL view
- **THEN** the Source selector is shown
- **AND** a SQL editor is shown
- **AND** none of the Mode, Filter, Select, aggregate, Sort, or Page sections are shown

#### Scenario: SQL text is highlighted

- **WHEN** the user types a SQL statement in the SQL editor
- **THEN** the statement is rendered with SQL syntax highlighting

### Requirement: Schema-aware SQL autocomplete

The SQL editor SHALL offer completion suggestions derived from the loaded schema and a fixed SQL catalog: the loaded schema's field names (each annotated with its field type), the selected entity name (as the query's source/`FROM` target), and the supported SQL keywords and functions. Suggestions SHALL reflect the schema currently loaded, so changing the selected entity SHALL change the suggested field names and source name. The autocomplete SHALL NOT perform SQL validation.

#### Scenario: Schema fields are suggested

- **WHEN** the user triggers completion in the SQL editor with a schema loaded
- **THEN** the loaded schema's field names are offered as suggestions
- **AND** each field suggestion shows its field type
- **AND** the selected entity name is offered as the source

#### Scenario: Suggestions follow the selected entity

- **WHEN** the user selects a different entity and triggers completion
- **THEN** the suggested field names are those of the newly selected entity's schema

### Requirement: SQL execution via the SQL endpoint

Running a query in the SQL view SHALL execute the editor's SQL text against `POST /v1/queries/execute-sql` through a server action delegating to the analytics data-access client, sending the statement as `{ "sql": <text> }`. On success the returned rows SHALL be shown in the same result grid used by the structured Run (columns derived from the result, object/array cells stringified, a row-count meta line). Because the SQL endpoint never returns a total count, no total SHALL be shown for SQL results. Run SHALL be disabled until a schema is loaded and while the SQL editor is empty. The client and server action SHALL be exercised such that the request URL and body shape are covered by tests.

#### Scenario: SQL run renders a result grid

- **WHEN** the user runs a valid SQL SELECT that returns rows
- **THEN** the request is sent to `/v1/queries/execute-sql` with body `{ "sql": <the editor text> }`
- **AND** the returned rows are shown in the result grid with a row-count meta line

#### Scenario: Run disabled for empty SQL

- **WHEN** the SQL editor is empty
- **THEN** the Run action is disabled

### Requirement: SQL validation is backend-authoritative

The SQL view SHALL NOT perform client-side SQL parsing or validation. When the backend rejects the SQL (a `400` — parse/validation failure or an unsupported construct such as a join, CTE, subquery, arithmetic, `CAST`, or a `LIMIT` above the maximum), the failure SHALL surface via the app's notification convention (error header/message), and a previously shown result SHALL NOT be replaced by a broken grid.

#### Scenario: Rejected SQL surfaces an error

- **WHEN** the user runs SQL that the backend rejects with a `400`
- **THEN** an error notification is shown with the backend's message
- **AND** any previously shown result is not replaced by a broken grid

### Requirement: SQL view state is an independent buffer

The Query Builder SHALL keep the SQL editor text as its own buffer, independent of the Form and JSON views. Switching away from and back to the SQL view SHALL restore the SQL text unchanged. Switching to the SQL view MAY seed the buffer once from the current query when the buffer is empty, but the SQL text SHALL NEVER be parsed back into the builder form state. The Form and JSON views SHALL continue to round-trip through the shared builder state as before, unaffected by any SQL text.

#### Scenario: SQL text persists across view switches

- **WHEN** the user edits SQL, switches to the Form view, and switches back to the SQL view
- **THEN** the SQL editor shows the previously edited text unchanged

#### Scenario: SQL does not rewrite the form

- **WHEN** the user has a built form, switches to SQL, edits the SQL, and switches back to Form
- **THEN** the form is unchanged from before entering the SQL view

#### Scenario: Form and JSON still round-trip

- **WHEN** the user edits the form, switches to JSON, and switches back to Form
- **THEN** the JSON reflected the form edits
- **AND** the form is preserved — independent of any SQL buffer content
