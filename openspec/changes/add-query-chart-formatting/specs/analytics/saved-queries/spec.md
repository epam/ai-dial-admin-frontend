## MODIFIED Requirements

### Requirement: Result view and chart configuration round-trip

The result view a query was last rendered in, and its chart configuration, SHALL be part of what a saved query stores and restores. Reopening a saved query SHALL show it in its stored result view, and a stored chart configuration SHALL survive the page's first run rather than being reset by it. A stored chart configuration whose axis columns are not set SHALL be re-derived from the result. The chart configuration SHALL be stored without interpretation — it names result columns, not schema fields.

The chart configuration SHALL carry the chart type — including the scorecard — its axis columns, and its legend settings: whether the legend is shown and its position (above, right, below or left). A stored configuration without legend settings, or with a position the page does not know, SHALL open with the legend on and below the chart, and opening it SHALL NOT by itself mark the query as changed. Changing the legend settings SHALL count as an unsaved change. Whether the chart formatting panel is open SHALL NOT be stored.

#### Scenario: A stored chart view is restored

- **WHEN** the user opens a query saved in the chart view and runs it
- **THEN** the result is shown as a chart using the stored chart type and axis columns

#### Scenario: An unset axis is re-derived

- **WHEN** the user opens a query whose stored chart configuration has no axis columns set and runs it
- **THEN** the chart selects its default columns from the result

#### Scenario: Changing the result view is an unsaved change

- **WHEN** the user switches a saved query from the table view to the chart view
- **THEN** the page indicates unsaved changes

#### Scenario: The legend settings round-trip

- **WHEN** the user moves the legend of a saved query's chart to the right, saves, and opens the query again
- **THEN** the chart's legend is on the right

#### Scenario: Moving the legend is an unsaved change

- **WHEN** the user moves the legend of a saved query's chart to the right
- **THEN** the page indicates unsaved changes

#### Scenario: A chart saved before legend settings opens with defaults

- **WHEN** the user opens a query whose stored chart configuration has no legend settings
- **THEN** the chart shows its legend below the chart
- **AND** the query is not marked as changed

#### Scenario: A scorecard round-trips

- **WHEN** the user saves a query shown as a scorecard and opens it again
- **THEN** the result is shown as a scorecard
