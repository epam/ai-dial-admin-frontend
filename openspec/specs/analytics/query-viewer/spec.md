# Analytics Query Viewer

## Purpose

What a run produces: execution of the current query, the result grid, the stat tiles, and the table and chart views over the returned rows. How the query was authored is `analytics/query-builder`.

## Requirements

### Requirement: Run query and result

The toolbar Run action SHALL execute the current query and render the result in the main results area. In the Builder view the query is the serialized `StructuredQuery` from the builder state; in the JSON view it is the query as written in the editor — both executed via a server action delegating to `analyticsDataApi.executeAction` (`/v1/queries/execute`). The result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified. A cell SHALL make its value readable whatever its size: up to a
bounded length the value SHALL be reachable as a tooltip carrying that rendered text — including for an
object, which the grid's shared tooltip otherwise drops for not being a string — and beyond that length the
cell SHALL instead show a bounded preview and a named control that opens the value in a dialog. The dialog
SHALL present the value in a read-only editor that scrolls, folds and searches, SHALL indent a value that is
JSON — including one that arrives as JSON text, which is the shape the heavy columns take — and SHALL offer
copying it and closing. No tooltip SHALL be offered past that length, where one could not show the value
anyway. The cell SHALL carry only the preview, not the whole document. A result column that names a schema field SHALL be headed by that field's display name, resolved through the same executed-query column-label map the chart views use; a column produced by a computed output column SHALL be headed by its alias, which is already human-readable. A SQL-view run, whose columns the builder cannot attribute to schema fields, SHALL head every column by its returned name. Before any run, the results area SHALL show an empty state inviting the user to run the query. An empty result SHALL show an empty-state message. A failed run SHALL surface an error via the app's notification convention and SHALL NOT replace a previously shown result with a broken grid. Run SHALL be disabled until a schema is loaded and while the JSON view contains invalid (unparseable) JSON.

#### Scenario: Successful run renders a result grid

- **WHEN** the user runs a valid query that returns rows
- **THEN** the rows are shown in a grid in the main results area with a column per result column

#### Scenario: Empty state before the first run

- **WHEN** the page is open and no query has been run yet
- **THEN** the results area shows an empty state inviting the user to run the query

#### Scenario: Empty result

- **WHEN** a run returns no rows
- **THEN** an empty-state message is shown instead of a grid

#### Scenario: Failed run surfaces an error

- **WHEN** a run fails
- **THEN** an error notification is shown
- **AND** the previous result (if any) is not replaced by a broken grid

#### Scenario: Result grid heads schema columns by display name

- **WHEN** a row-mode run projects `total_tokens`, whose schema display name is "Total tokens"
- **THEN** the grid column is headed "Total tokens"
- **AND** the row data is still keyed by the raw column name `total_tokens`

#### Scenario: Aggregate result heads columns consistently

- **WHEN** an aggregate run groups by `deployment` (display name "Deployment") and sums `total_tokens` under the derived alias `Total tokens (sum)`
- **THEN** the grid heads the two columns "Deployment" and "Total tokens (sum)"

#### Scenario: SQL-view result keeps returned column names

- **WHEN** the user runs a query from the SQL view
- **THEN** each grid column is headed by the name the result returned

#### Scenario: A short value is reachable as a tooltip, an object included

- **WHEN** a result cell holds a value short enough to show in a tooltip
- **THEN** hovering it shows that value as rendered text
- **AND** this holds for an object value, not only a string one

#### Scenario: A value too large for a tooltip opens in a viewer

- **WHEN** a result cell holds a value past the tooltip length
- **THEN** the cell shows a preview of it and a control naming the column it belongs to
- **AND** no tooltip is offered for that cell
- **AND** activating the control opens the value in a dialog named by that column

#### Scenario: A value that is JSON text is shown indented

- **WHEN** the opened value is JSON, whether it arrived as an object or as JSON text
- **THEN** the dialog shows it indented rather than as one line

#### Scenario: The opened value can be copied

- **WHEN** the user activates the dialog's copy action
- **THEN** the value as shown is placed on the clipboard
- **AND** a confirmation names the column it came from

### Requirement: Result stat tiles

When a result is shown, the results area SHALL display a stat-tile row above the result with: the number of returned rows, the number of result columns (Fields), and — when the response includes a total count — the Total. The service computes `totalCount` only for row-mode offset paging with `include_total=true`, so the Include total toggle SHALL be offered only in row mode with offset paging, and aggregate/SQL results never show a Total tile. No timing tile SHALL be shown (the backend does not report query timing).

#### Scenario: Tiles reflect the result

- **WHEN** a run returns 12 rows with 5 columns and no total
- **THEN** the stat tiles show Rows 12 and Fields 5
- **AND** no Total tile is shown

#### Scenario: Total appears when reported

- **WHEN** a row-mode offset-paged run requested a total and the response includes one
- **THEN** a Total tile shows the reported total

#### Scenario: Include total is offered only where the service supports it

- **WHEN** the builder is in aggregate mode (or cursor paging is selected)
- **THEN** the Include total toggle is not shown

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
