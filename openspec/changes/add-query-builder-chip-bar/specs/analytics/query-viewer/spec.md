## ADDED Requirements

### Requirement: Result count

When a result is shown, the results header SHALL state the number of returned rows beside the Table and
Chart switch. When the response includes a total count, the header SHALL state the total as well; the
service computes a total only for a row query paged by offset that requested one, which the chips never
request, so a total appears only for a result produced another way. No count of result columns and no
timing SHALL be shown.

The results header SHALL also carry, right-aligned, the Add to dashboard action — for a saved query
without unsaved changes, where custom dashboards are enabled — and the Export CSV action.

#### Scenario: The count reflects the result

- **WHEN** a run returns 12 rows
- **THEN** the results header states 12 results
- **AND** no column count is shown

#### Scenario: A reported total is stated

- **WHEN** a run's response includes a total count
- **THEN** the results header states the total beside the number of returned rows

#### Scenario: No count before a run

- **WHEN** no result is shown
- **THEN** the results header states no count

#### Scenario: Add to dashboard sits in the results header

- **WHEN** a saved query without unsaved changes is open and custom dashboards are enabled
- **THEN** the results header offers Add to dashboard beside Export CSV

## MODIFIED Requirements

### Requirement: Run query and result

The Run action SHALL execute the current query and render the result in the main results area. In the Builder view the query is the serialized `StructuredQuery` from the builder state, executed via a server action delegating to `analyticsDataApi.executeAction` (`/v1/queries/execute`). The result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified. A cell SHALL make its value readable whatever its size: up to a
bounded length the value SHALL be reachable as a tooltip — carrying that rendered text, or, where that
rendered text is a rounded or compacted rendering of a numeric value, the value as returned in full (see
"Numeric and temporal result-cell formatting") — including for an
object, which the grid's shared tooltip otherwise drops for not being a string — and beyond that length the
cell SHALL instead show a bounded preview and a named control that opens the value in a dialog. The dialog
SHALL present the value in a read-only editor that scrolls, folds and searches, SHALL indent a value that is
JSON — including one that arrives as JSON text, which is the shape the heavy columns take — and SHALL offer
copying it and closing. No tooltip SHALL be offered past that length, where one could not show the value
anyway. The cell SHALL carry only the preview, not the whole document. A result column that names a schema field SHALL be headed by that field's display name, resolved through the same executed-query column-label map the chart views use; a column produced by a computed output column SHALL be headed by its alias, which is already human-readable. A SQL-view run, whose columns the builder cannot attribute to schema fields, SHALL head every column by its returned name. Before any run, the results area SHALL show an empty state inviting the user to run the query. An empty result SHALL show an empty-state message. A failed run SHALL surface an error via the app's notification convention and SHALL NOT replace a previously shown result with a broken grid. Run SHALL be disabled until a schema is loaded.

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

### Requirement: Export the shown result as CSV

When a result is shown, the results area SHALL offer an Export CSV action in its header row, in both the Table and the Chart view, including for a result with no rows (the file then holds only the header record). The action SHALL NOT be offered before the first successful run, and SHALL be disabled while a run or an export is in progress. While an export is in progress — from activation until the file starts downloading or the export fails — the action SHALL show a spinner in place of its icon and SHALL expose the busy state programmatically. Before the user activates it, the action SHALL state the export's ceiling — that a file holds at most 1,000 rows — in a tooltip reachable by hover and by keyboard focus, and in the action's accessible description. For a result produced by SQL the tooltip SHALL add that a lower `LIMIT` in the statement exports fewer rows.

The export SHALL re-execute the request that produced the shown result — not the query as it currently stands in the editor or builder. A result produced from the Builder view SHALL be exported through the service's structured CSV endpoint (`POST /v1/queries/execute-csv`) with the run's query, its page replaced by the first page of 1000 rows — the service's per-request maximum — so the file starts at the first matching row whatever page the grid showed: an offset page keeps its type and `include_total` with offset 0 and limit 1000, a cursor page keeps its type with no cursor and limit 1000, and a query with no page gets an offset page of 1000 without a total. Everything else in the query (entity, mode, columns, filter, grouping, sort) SHALL be sent unchanged. A result produced by SQL — from the SQL view or from an AI-message run that ran SQL — SHALL be exported through the SQL CSV endpoint (`POST /v1/queries/execute-sql-csv`) with the statement unchanged, so its own limit (or the service default) applies; the statement text SHALL NOT be rewritten. A failed run, which leaves the previous result shown, SHALL leave the export bound to the request that produced that result. A relative time range is evaluated again when the export runs, so the file reflects the window at export time.

When the downloaded file may not hold every matching row, the export SHALL tell the user so through a notification shown with the download: when the service reported a total count larger than the number of records in the file, the notice SHALL name both numbers; otherwise, when the file holds 1000 records, the notice SHALL say the file reached the 1000-row maximum and more rows may match. A file under that maximum with no larger total SHALL download without a notice.

The export SHALL run with the signed-in user's own token, as Run does, and SHALL be cancelled when the user leaves the page. On success the browser SHALL download the file the service returned, under the file name the service sent, with its bytes unchanged. On failure the export SHALL surface the service's error message through the app's error notification, SHALL NOT download a file, and SHALL leave the shown result unchanged.

#### Scenario: Export is not offered before a run

- **WHEN** the query builder page is open and no query has been run yet
- **THEN** no Export CSV action is shown

#### Scenario: Export is offered for a shown result in both views

- **WHEN** a run has produced a result
- **THEN** an enabled Export CSV action is shown in the results header
- **AND** it is still shown after switching to the Chart view

#### Scenario: The 1000-row ceiling is stated before export

- **WHEN** the user hovers or focuses the Export CSV action
- **THEN** a tooltip says the file holds at most 1,000 rows

#### Scenario: Export is offered for an empty result

- **WHEN** a run returns no rows
- **THEN** the Export CSV action is shown and enabled

#### Scenario: Export sends the request that produced the result

- **WHEN** the user runs a query, then edits the query without running it again, and activates Export CSV
- **THEN** the export sends the request that produced the shown result, not the edited one

#### Scenario: A structured run exports through the structured CSV endpoint

- **WHEN** the shown result came from the Builder view and the user activates Export CSV
- **THEN** the service's structured CSV endpoint is called with the query the run sent, its page widened to the first 1000 rows

#### Scenario: A structured export asks for the first 1000 rows

- **WHEN** the shown result came from an offset-paged run with limit 25 and offset 50, and the user activates Export CSV
- **THEN** the structured CSV endpoint is called with offset 0 and limit 1000
- **AND** the rest of the query is the same as the run sent

#### Scenario: A cursor-paged export starts from the first page

- **WHEN** the shown result came from a cursor-paged run that had moved past its first page
- **THEN** the structured CSV endpoint is called with no cursor and limit 1000

#### Scenario: A file at the maximum is reported as possibly partial

- **WHEN** an export returns 1000 records and the service reported no total
- **THEN** the file is downloaded
- **AND** a notification says the file reached the 1000-row maximum and more rows may match

#### Scenario: A reported total larger than the file is named

- **WHEN** an export returns 1000 records and the service reported a total of 4200
- **THEN** a notification names 1000 of 4200 rows

#### Scenario: A complete file downloads without a notice

- **WHEN** an export returns fewer than 1000 records and no larger total
- **THEN** the file is downloaded and no notification is shown

#### Scenario: A SQL run exports through the SQL CSV endpoint

- **WHEN** the shown result came from the SQL view and the user activates Export CSV
- **THEN** the service's SQL CSV endpoint is called with the same statement the run sent

#### Scenario: Successful export downloads the service's file

- **WHEN** the export succeeds
- **THEN** the browser downloads the returned CSV under the file name the service sent

#### Scenario: Export shows progress while it runs

- **WHEN** an export is in progress
- **THEN** the Export CSV action shows a spinner instead of its icon, is marked busy, and is disabled until it settles

#### Scenario: Failed export surfaces the service error

- **WHEN** the service rejects the export (for example a limit above its maximum, or an exceeded query budget)
- **THEN** an error notification shows the service's message
- **AND** no file is downloaded
- **AND** the shown result is unchanged

#### Scenario: A failed run keeps the export bound to the shown result

- **WHEN** a run succeeds, a later run fails, and the user activates Export CSV
- **THEN** the export sends the request of the successful run whose result is still shown

## REMOVED Requirements

### Requirement: Result stat tiles

**Reason**: The stat-tile row is replaced by one result count in the results header. The Fields tile is
dropped, and the Include total toggle it described no longer exists.

**Migration**: See "Result count".
