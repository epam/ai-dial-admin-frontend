# Analytics Query Viewer

## Purpose

What a run produces: execution of the current query, the result grid, the stat tiles, and the table and chart views over the returned rows. How the query was authored is `analytics/query-builder`.
## Requirements
### Requirement: Run query and result

The toolbar Run action SHALL execute the current query and render the result in the main results area. In the Builder view the query is the serialized `StructuredQuery` from the builder state; in the JSON view it is the query as written in the editor — both executed via a server action delegating to `analyticsDataApi.executeAction` (`/v1/queries/execute`). The result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified. A cell SHALL make its value readable whatever its size: up to a
bounded length the value SHALL be reachable as a tooltip — carrying that rendered text, or, where that
rendered text is a rounded or compacted rendering of a numeric value, the value as returned in full (see
"Numeric and temporal result-cell formatting") — including for an
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

### Requirement: Numeric and temporal result-cell formatting

The result grid SHALL render a numeric or temporal result cell through the formatter its column's resolved **value class** selects, and SHALL leave every other column rendering exactly as it does today. There are four resolved classes — compact, significant-digit, duration and date-time — and "no class", which means no change. Three of the four select a formatter. The **duration** class deliberately selects none: it is a recognition whose whole consequence is to withhold the compact formatter, so a duration column renders exactly as an unclassified one does.

The value class SHALL be resolved when the executed-query metadata is built, and carried on that metadata beside the column labels, so that what the grid renders follows the query that produced the shown result rather than the live builder state. Two sources resolve it, in this order:

1. **The declared schema type.** A returned column that names a field of the executed entity's schema takes its class from that field's `AnalyticsFieldType`: `Integer` and `Long` are compact, `Decimal` is significant-digit, `Timestamp` and `Date` are date-time, and every other type — `Uuid`, `Enum`, `Boolean`, `String`, `Object`, `Array` — resolves to no class and so to no formatting. This is the only source that can ever yield the date-time class: a temporal column SHALL NOT be inferred from a value that merely looks like epoch millis.

   A field this source resolves to a **numeric** class — compact or significant-digit — **which the catalog tags `performance`** SHALL take the **duration** class instead of that numeric class, and a duration column SHALL be left unformatted: its cells render the value exactly as returned, in the unit the column is measured in. The field's `tag` is the catalog's own classification of what a column measures, and it is the only machine-readable signal of a unit the schema carries that does not read the column's name: a field carries no unit attribute, its `description` states the unit only in prose ("in milliseconds", "in bytes"), and its `display_name` states it only sometimes and only as display text. The column's **name SHALL NOT be consulted**: a name is a naming convention rather than a declaration, and the same catalog that supplies the tag supplies the name, so keying on the name buys no stability while committing the grid to a spelling. The tag SHALL only ever narrow a class this source already resolved as numeric — a declared temporal, string, enum or boolean field keeps what its declared type resolves however it is tagged, so the tag can never create formatting where the declared type asked for none. A numeric column the catalog tags anything else — a `*_bucket` ordinal, a status code, a counter, a byte size — is therefore never a duration, whatever it is named.

   **Why a recognised duration is left unformatted rather than rendered as a duration.** The column's header is the catalog's `display_name`, and on a duration field that display name states the unit — "Duration (ms)". The grid heads a schema column by that display name (see "Result grid heads schema columns by display name"), and the frontend SHALL NOT rewrite a catalog-supplied display name to strip a unit from it. A cell reading "698.7s" under a header reading "Duration (ms)" contradicts its own header, which is a worse defect than the one it fixes. So the duration class SHALL leave the value in the unit the header declares: it withholds the compact formatter — the thing that stated the nonsense figure, "698.7 K" for a count of milliseconds — and adds nothing. A duration column SHALL adopt no formatter, no tooltip override and no numeric column configuration, and SHALL therefore render, align, sort, filter and tooltip exactly as a column of no class does.

   **The coverage this buys, and what it misses, are both known.** Measured against the provisioned catalog, the `performance` tag falls on exactly the millisecond measurements — the per-hop mean and the summed hop durations of a conversation, a turn's wall-clock and summed hop durations, and a usage-log operation's duration — and on nothing else, so the rule withholds compaction from exactly the millisecond measurements the builder can project and from nothing else. A numeric millisecond field the catalog leaves **untagged** SHALL keep the class its declared type resolves — a compact count — rather than being recovered from its name. The catalog has one such field, on a seeded demo table, and the trade is deliberate: a name-derived rule would state a unit the catalog never declared.

   **This leaves one inconsistency, which SHALL be stated rather than hidden:** a millisecond column the catalog tags reads as a raw millisecond count, while a millisecond column it leaves untagged reads as a compacted one ("698.7 K"), so two columns measuring the same quantity can read differently in the same result. The inconsistency is accepted on the same terms as the fall-through itself — the untagged column keeps the rendering it has today, and the tagged one is the only one the catalog lets the client recognise. It is closed by the catalog declaring a unit per column, not by a second heuristic in the client.
2. **The returned values of an aggregate output column.** A column the executed query marks as a measure — returned but not grouped by — and that names no schema field SHALL take its class from its own values across the whole result: compact when every value is a number and whole, significant-digit when every value is a number and at least one is fractional, and no class when any value is not a number. This source SHALL apply only to an **aggregate-mode** run. In row mode every returned column is a projection rather than a measure, so an alias with no schema field — a scalar-function projection such as a time bucket — SHALL stay unformatted rather than be guessed at from its digits.

   This source SHALL NOT yield the duration class. An output column names no schema field, so there is no tag to read: what it carries is an alias, derived from a field's display name and its function or typed by the user. Recovering the unit would mean resolving the alias back to the argument field **and** knowing whether the function preserves the unit, which takes the function catalog's own semantics — excluded by this change's Non-goals. An aggregate over a millisecond field therefore keeps a compact or significant-digit rendering, under an alias that names the field it aggregated. This is the second face of the inconsistency above: `AVG(duration_ms)` compacts while `duration_ms` itself is left raw, under headers that both imply milliseconds.

The value class SHALL be withheld for every column of a run, leaving the grid rendering as it does today, in exactly the two cases where the column labels are withheld: a SQL run the backend could not translate, whose measure list comes from a blind scan of every returned column rather than from group-by semantics and so cannot be trusted to exclude an id or a raw epoch column; and a translated SQL run whose entity is not the entity selected in the builder, whose schema cannot describe the returned columns.

A **compact** cell SHALL render through the app's shared compact formatter, the same one the platform models grid's Parameters column uses, so a multi-billion count reads as a unit-suffixed figure. A **significant-digit** cell SHALL render at two significant digits below one and compact at one and above, so a sub-unit value survives instead of rounding to zero while a value of a few units is not rounded to its leading digit. That formatter SHALL be currency-agnostic and SHALL live beside the app's other number formatters; the conversations log's cost formatter SHALL NOT be reused for it, re-parameterised, or stripped of its currency symbol at a call site — its rounding stays local to that page, as `analytics/conversations-listing` requires. A **duration** cell SHALL NOT be formatted: it SHALL render the value as returned, which is the rendering an unclassified cell gets, so the figure stays in the unit its header declares. In particular a returned zero SHALL render as `0` rather than as an empty cell — in a result grid a zero is a value the query returned — and no duration formatter SHALL be introduced at this call site while the header states the unit. A **date-time** cell SHALL render through the app's shared date-time column configuration rather than by calling the date formatter by hand, so the column carries the same formatted value, tooltip and typed filter every other date-time column in the app carries.

A value a resolved numeric class cannot read as a number SHALL fall back to today's rendering rather than to an empty cell, so no value a run returned is ever hidden by a formatter.

On a cell whose text is a rounded or compacted rendering the tooltip SHALL carry the value as returned: every digit the app's shared number formatting can represent, which is double precision, thousand-delimited where the value is whole and unmodified where it is fractional. It SHALL NOT repeat the shortened text: a shortened value with no way to reach the full one is unreadable, per `.claude/rules/a11y.md`. A date-time cell keeps the shared date-time configuration's own tooltip. A duration cell shortens nothing, so it needs no such tooltip and SHALL keep the result grid's own.

A formatted numeric column SHALL right-align its cells and its header and SHALL sort by numeric value rather than as text, by adopting the app's shared numeric column configuration. The result grid's default comparator compares raw values with `>`, which orders a decimal that arrives as a JSON string lexicographically and sorts a zero to the end of the result, so a column this change has just declared numeric has to sort as a number. Formatting SHALL NOT change which rows a filter matches: the filter SHALL keep reading the column's numeric value, never its formatted text.

#### Scenario: A large integer column is compacted

- **WHEN** a run returns a column whose schema type is `Long` and a row whose value is 4897666958
- **THEN** the cell shows a unit-suffixed compact figure ("4.9 B") rather than every digit

#### Scenario: A sub-unit decimal survives instead of rounding to zero

- **WHEN** a run returns a column whose schema type is `Decimal` and a row whose value is 0.0004792
- **THEN** the cell shows it at two significant digits ("0.00048")
- **AND** it is not shown as "0" or as "0.00"

#### Scenario: A decimal of a few units keeps its leading digits

- **WHEN** a `Decimal` column returns 19.74
- **THEN** the cell shows "19.7" rather than "20"

#### Scenario: The compact threshold is exact

- **WHEN** an `Integer` column returns 999 in one row and 1000 in another
- **THEN** the 999 cell shows "999" and the 1000 cell shows "1 K"

#### Scenario: A timestamp column shows a local date-time

- **WHEN** a row-mode run projects a column whose schema type is `Timestamp` and whose value is epoch millis
- **THEN** the cell shows the local date-time rendering rather than the raw number

#### Scenario: A temporal column is never inferred from its values

- **WHEN** an aggregate run returns a measure alias that names no schema field and whose every value is epoch millis
- **THEN** that column is not rendered as a date-time

#### Scenario: An aggregate alias over whole values is compacted

- **WHEN** an aggregate run sums a column under an alias and every returned value is whole
- **THEN** the alias column is compacted

#### Scenario: An aggregate alias over fractional values gets significant digits

- **WHEN** an aggregate run averages a column under an alias and at least one returned value is fractional
- **THEN** the alias column shows significant digits

#### Scenario: A row-mode alias with no schema field stays unformatted

- **WHEN** a row-mode run projects a scalar-function expression under an alias and every returned value is a whole number
- **THEN** that column renders as it does today

#### Scenario: A non-numeric schema column is untouched

- **WHEN** a run returns a `Uuid`, `Enum` or `Boolean` column
- **THEN** its cells render as they do today

#### Scenario: An untranslated SQL run stays unformatted

- **WHEN** the user runs SQL the backend cannot translate and the result carries an all-numeric id column
- **THEN** no result column is formatted

#### Scenario: A translated SQL run over another entity stays unformatted

- **WHEN** a translated SQL run's entity is not the entity selected in the builder
- **THEN** no result column is formatted, on the same terms its headers keep their returned names

#### Scenario: The exact value stays reachable on a compacted cell

- **WHEN** the user hovers a compacted integer cell
- **THEN** the tooltip shows the value in full, thousand-delimited
- **AND** it does not repeat the compacted text

#### Scenario: A fractional value's tooltip is unrounded

- **WHEN** the user hovers a significant-digit decimal cell
- **THEN** the tooltip shows every digit the run returned

#### Scenario: A formatted numeric column sorts numerically

- **WHEN** the user sorts a formatted numeric column whose values arrive as numeric strings
- **THEN** the rows order by numeric value, putting 9 before 10 ascending rather than after it

#### Scenario: A filter still matches on the numeric value

- **WHEN** a filter is applied to a formatted numeric column
- **THEN** it matches on the column's numeric value rather than on the formatted text

#### Scenario: An unreadable value in a numeric column is still shown

- **WHEN** a column resolved as numeric returns a value in one row that cannot be read as a number
- **THEN** that cell shows the value as it does today rather than an empty cell

#### Scenario: A duration column is recognised by its catalog tag

- **WHEN** a run returns a column whose declared type is numeric and which the catalog tags `performance`, and a row whose value is 698700
- **THEN** the cell shows the value as returned, unformatted ("698700")
- **AND** it is not shown as a unit-suffixed count of milliseconds ("698.7 K")
- **AND** it is not shown as a duration in another unit ("698.7s")
- **AND** the column's name plays no part in the recognition

#### Scenario: A duration column's cells stay in the unit its header declares

- **WHEN** a run returns a column the catalog tags `performance` whose display name states its unit, such as "Duration (ms)"
- **THEN** the grid heads the column by that display name, unchanged
- **AND** the cells under it are in the unit that header names, because no formatter converts them

#### Scenario: A zero duration is still a value

- **WHEN** a duration column returns 0
- **THEN** the cell shows "0" rather than an empty cell

#### Scenario: An untagged millisecond column keeps its compact rendering

- **WHEN** a run returns two numeric millisecond columns, one the catalog tags `performance` and one it leaves untagged
- **THEN** the untagged column is compacted ("698.7 K") while the tagged one is left raw
- **AND** the untagged one is not recovered as a duration from its name
- **AND** the two therefore read differently in the same result, which is the accepted inconsistency the requirement states

#### Scenario: The performance tag on a non-numeric column changes nothing

- **WHEN** a run returns a column the catalog tags `performance` whose declared type is not numeric
- **THEN** it renders as its declared type resolves, which for a string or an enum is no formatting at all

#### Scenario: A bucket ordinal and a status code are not mistaken for durations

- **WHEN** a run returns a `*_bucket` ordinal column and a response-status column, both declared numeric and neither tagged `performance`
- **THEN** neither is recognised as a time measurement
- **AND** both keep the compact rendering their declared type resolves

#### Scenario: The exact millisecond value stays reachable on a duration cell

- **WHEN** the user reads a duration cell
- **THEN** the millisecond count is shown in the cell in full, so no tooltip is needed to reach it
- **AND** the cell text is not a shortened rendering of the value

#### Scenario: A duration column keeps the grid's default sort and filter

- **WHEN** a duration column is sorted, or a filter is applied to it
- **THEN** it behaves exactly as an unclassified column does, because it adopts no numeric column configuration
- **AND** the change adds neither numeric sorting nor a numeric filter to it

#### Scenario: An aggregate over a duration field is not rendered as a duration

- **WHEN** an aggregate run returns an output-column alias over a millisecond field
- **THEN** that column keeps the class its returned values resolve — compact when they are all whole, significant-digit otherwise
- **AND** it is not recognised as a duration, so it is compacted where the underlying column would have been left raw

