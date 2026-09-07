## MODIFIED Requirements

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

