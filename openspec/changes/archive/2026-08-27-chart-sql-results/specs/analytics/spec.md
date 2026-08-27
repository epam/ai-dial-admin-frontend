## MODIFIED Requirements

### Requirement: Result table and chart views

The results area SHALL offer a Table ⇄ Chart switcher. The Table view SHALL render the result grid. Each result column SHALL render its row's actual value looked up by its exact column name, including a column name that itself contains a literal `.` (for example an enrichment projection's `table.column`) — such a name SHALL NOT be treated as a nested-path lookup. The Chart view SHALL render the result with ECharts and offer a chart-type control with four types — bar, line, pie, and scatter — plus two column selectors whose allowed columns and labels follow the selected type. The Chart view SHALL be available whenever the shown result has at least one dimension column and at least one aggregate column, as those are defined below for the run that produced it; otherwise the Chart view SHALL show a hint naming the reason it is unavailable. Chart colors SHALL come from the shared chart color tokens.

For a **structured run**, the dimension columns SHALL be the executed query's group-by/bucket columns and the aggregate columns SHALL be the remaining returned columns. A row-mode structured run has no group-by and therefore no dimension columns, so it is never chartable.

For a **SQL run**, the executed SQL SHALL be translated to the structured DSL through the backend translation endpoint, and the resulting query SHALL define the run's mode and dimension columns exactly as for a structured run, so that a grouped SQL query is as chartable as the equivalent builder query. Because that endpoint names a group-by entry by the underlying column while the result names it by the query's alias, each translated group-by entry SHALL be resolved to the result column name it corresponds to before use — an entry that already names a returned column is that column, an entry naming a plain column that the query selected under an alias resolves to that alias, and every other entry is already the result column name. An entry that resolves to no returned column SHALL NOT be offered as a dimension, so no axis is ever offered a column the rows do not carry. Schema display names SHALL be applied to a SQL run's columns only when the translated query's entity is the entity currently selected in the builder; otherwise the run's columns SHALL display by their returned names.

When the backend rejects the translation — the SQL view accepts constructs the DSL cannot express, so this is an expected outcome and SHALL NOT fail the run or discard the result — the run SHALL still be charted, with its columns classified from the returned rows instead: every returned column SHALL be offered as a dimension, since without the query's semantics the client cannot tell which column is a dimension, and only columns whose every value is a number SHALL be offered as an aggregate. A column that is numeric but semantically a dimension (a time bucket returned as an epoch number, a numeric code) will consequently appear in both selectors; the user's pick decides. Such a run SHALL NOT be reported as an aggregate-mode run.

For **bar** and **line**, the selectors SHALL be labeled X axis and Y axis: X over the executed query's group-by/bucket columns, Y over its aggregate columns (including the count column when present); defaults SHALL be the first dimension and the first aggregate. When every X value is numeric or date-like, the chart SHALL order the points along the X axis by that natural order (chronological/numeric ascending) regardless of the query's row order; mixed or plain-text X values keep row order. Long X-axis labels SHALL be truncated to a fixed label width with the full value available in the tooltip.

For **pie**, the same two selectors SHALL be labeled Category (group-by/bucket columns) and Value (aggregate columns). The chart SHALL show at most the top 10 categories by value as slices; any remaining categories SHALL be merged into a single "Other" slice.

For **scatter**, both selectors SHALL be labeled X axis and Y axis and SHALL offer the result's numeric columns — the group-by/bucket and aggregate columns whose every value is numeric or date-like, each counted once even where a run's dimension and aggregate lists overlap. Each result row (one group) SHALL render as one point, with the row's dimension values available in the point tooltip; scatter SHALL NOT re-order rows. The scatter type SHALL be offered only when the result has at least two numeric columns; otherwise it is hidden from the chart-type control.

Switching chart type SHALL keep a column pick that is valid for the new type's selector and SHALL fall back to that selector's first valid default otherwise.

Everywhere the chart names a column — selector options, in-chart axis titles, and point tooltips — a group-by/bucket column SHALL display by its schema display name when the executed entity defines one (raw name otherwise); aggregate and scalar-function columns display by their user-authored alias. The labels SHALL follow the executed query's entity, not the currently selected source.

Each reason the Chart view has nothing to render SHALL have its own hint text naming that reason, rather than one shared message: a result with no dimension column to plot against, a result with no column that can serve as a value, a result with no rows, and a chart whose axis selectors hold no valid pick are distinct causes and SHALL read as such.

#### Scenario: Chart columns display by their schema display name

- **WHEN** an aggregate result grouped by a column whose schema defines a display name is charted
- **THEN** the axis selector and the chart axis title show the display name instead of the raw column name
- **AND** aggregate columns keep their user-authored aliases

#### Scenario: Chart renders for an aggregate result

- **WHEN** the shown result came from an aggregate run grouped by one field and the user selects the Chart view
- **THEN** a chart renders with the group-by column on X and an aggregate column on Y
- **AND** the user can switch between bar, line, pie, and scatter types

#### Scenario: Pie buckets the long tail into Other

- **WHEN** an aggregate result has more than 10 category values and the user selects the pie type
- **THEN** the pie shows the top 10 categories by value as slices
- **AND** the remaining categories are merged into a single "Other" slice

#### Scenario: Scatter plots one point per group

- **WHEN** an aggregate result grouped by one field has two aggregate columns and the user selects the scatter type
- **THEN** each group renders as one point with one aggregate on X and the other on Y
- **AND** the point tooltip shows the group's dimension value

#### Scenario: Scatter requires two numeric columns

- **WHEN** the shown aggregate result has only one numeric column
- **THEN** the scatter type is not offered in the chart-type control

#### Scenario: Column picks survive a compatible type switch

- **WHEN** the user configured Category and Value on a pie and switches to the bar type
- **THEN** the same columns stay selected as X and Y

#### Scenario: Comparable X values are ordered on the axis

- **WHEN** a top-N-by-count aggregate result has time-bucket X values and the user opens the Chart view
- **THEN** the chart shows the buckets in chronological order along the X axis
- **AND** the table keeps the query's row order

#### Scenario: A grouped SQL run is chartable

- **WHEN** the user runs a grouped query in the SQL view and the backend translates it to an aggregate-mode structured query
- **THEN** the Chart view renders, offering the translated query's group-by columns as dimensions and the remaining result columns as aggregates

#### Scenario: An aliased group-by column resolves to its result column

- **WHEN** a SQL run groups by a plain column the query selected under an alias, and the translation names that group-by entry by the underlying column
- **THEN** the dimension offered on the axis selector is the alias the result rows are keyed by
- **AND** no column absent from the result rows is offered on either selector

#### Scenario: An untranslatable SQL run falls back to row classification

- **WHEN** the user runs SQL the DSL cannot express and the backend rejects the translation
- **THEN** the result is still shown and the Chart view offers every returned column as a dimension and every all-numeric column as an aggregate
- **AND** the run is not reported as an aggregate-mode run

#### Scenario: Chart hint for non-aggregate results

- **WHEN** the shown result came from a row-mode structured run and the user selects the Chart view
- **THEN** a hint explains that charts require a grouped result and names that as the reason
- **AND** the hint does not attribute the cause to a SQL run, which is charted on its own terms

#### Scenario: Chart hint for a SQL result with nothing to plot

- **WHEN** the shown result came from a SQL run whose returned columns include none that can serve as a value
- **THEN** the hint explains that the result has no numeric column to plot, rather than referring to group-by

#### Scenario: A dotted column name still shows its value

- **WHEN** a result row includes a column whose name contains a literal `.` (e.g. an enrichment projection) and the backend response carries a value for it
- **THEN** the Table view shows that value in the corresponding cell rather than leaving it blank

### Requirement: Backend-authoritative query translation

The Query Builder SHALL treat the Analytics data-access service as the single source of truth for translating between the structured query DSL and SQL, via two validation-only endpoints that never run against ClickHouse. The server API layer SHALL expose `translateAction(query)` for `POST /v1/queries/translate` (DSL → SQL, success body `{ "sql": <text> }`) and `translateSqlAction(sql)` for `POST /v1/queries/translate-sql` (SQL → DSL, success body `{ "query": <StructuredQuery> }`), each returning a `ServerActionResponse` envelope and reached through a server action injecting the user token. The frontend SHALL NOT generate SQL from the structured query on the client; the client-side generator is removed. When the backend rejects a translation with a `400` (a DSL the SQL subset cannot express, or SQL that is unparseable or uses an unsupported construct), the failure SHALL be handled per the consuming requirement (SQL-view seeding surfaces the error; the Builder switch falls back to the discard guard; a SQL run falls back to classifying its result columns from the returned rows) and SHALL NOT be presented as a successful translation.

Running a query from the SQL view SHALL translate the SQL alongside executing it, so the result can be described in the same terms as a structured run. The translation SHALL NOT delay or gate the result: a rejected translation SHALL neither fail the run, surface an error, nor discard the returned rows. A run that has already translated its SQL for another purpose SHALL reuse that translation rather than requesting it again.

#### Scenario: DSL is translated to SQL through the backend

- **WHEN** the SQL view needs to seed its editor from the current builder query
- **THEN** the structured query is sent to `POST /v1/queries/translate`
- **AND** the returned `{ sql }` text is used verbatim as the editor contents

#### Scenario: SQL is translated to a structured query through the backend

- **WHEN** SQL is translated for display in the visual builder
- **THEN** the SQL is sent to `POST /v1/queries/translate-sql`
- **AND** the returned `{ query }` is a structured query the `execute` endpoint would accept

#### Scenario: A DSL the SQL subset cannot express is rejected

- **WHEN** `POST /v1/queries/translate` is called for a query the SQL subset cannot express (for example `include_total`)
- **THEN** the backend responds `400`
- **AND** the frontend surfaces the failure rather than showing generated SQL

#### Scenario: A SQL run translates and executes together

- **WHEN** the user runs a query from the SQL view
- **THEN** the SQL is sent to both the execute-SQL endpoint and the translation endpoint
- **AND** a rejected translation leaves the executed result shown without an error notification
