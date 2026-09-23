## Purpose

Defines the page-wide `Compare` control: how the previous window is derived from the selected
period, which widgets a comparison reaches, and the rule that each window is a request of its own.

## ADDED Requirements

### Requirement: Compare control sits beside the period selector and governs the whole page

The controls bar SHALL render a `Compare` selector after the period selector, offering
`Previous period` and an off option. The selection SHALL apply to every widget on the page that can
express a change over time — the KPI cards and the breakdown table's delta column — rather than to
one widget. The selection SHALL NOT affect the URL, and SHALL survive switching the `View by`
option so a reader who moves between views keeps the comparison they asked for.

`Previous period` SHALL be the default. A figure without a comparison answers "how much" and not
"more or less than before", which is the question this page exists to answer; a reader who does not
want the comparison turns it off.

#### Scenario: Comparison is on by default

- **WHEN** the user opens the usage page
- **THEN** the `Compare` selector reads `Previous period`
- **AND** each KPI card renders a delta against the previous window
- **AND** the breakdown table renders its delta column

#### Scenario: Turning comparison off drops every comparison at once

- **WHEN** the user selects the off option
- **THEN** no KPI card renders a delta
- **AND** the breakdown table renders no delta column

#### Scenario: Comparison survives a view switch

- **GIVEN** comparison is set to `Previous period` in the LLM view
- **WHEN** the user switches `View by` to MCP
- **THEN** comparison is still `Previous period`

### Requirement: The previous window is the same span immediately before the current one

For a preset period, the previous window SHALL be the same span ending where the current window
begins — `Last 2d` compares against the two days before those two days. For a custom range, the
previous window SHALL be the same duration ending at the custom range's start. The previous window
SHALL be derived from the current window when the window is taken, not stored, so a preset's
sliding window and its comparison always share an edge.

The window SHALL be taken once per change to the inputs that define it — the period, the custom
range, and the manual refresh — and SHALL NOT be re-taken during rendering, so a preset window
computed from the clock does not produce a new range on every pass.

#### Scenario: Preset period compares against the adjacent span

- **GIVEN** the period is `Last 2d`
- **WHEN** the page requests data with comparison on
- **THEN** the current window covers the last two days
- **AND** the previous window covers the two days ending where the current window begins

#### Scenario: Custom range compares against the same duration before it

- **GIVEN** a custom range spanning four days
- **WHEN** the page requests data with comparison on
- **THEN** the previous window spans four days and ends at the custom range's start

#### Scenario: A window is taken once per input change

- **GIVEN** the page has loaded
- **WHEN** nothing about the period changes
- **THEN** no widget re-issues its request

### Requirement: Each window is a request of its own

The query grammar carries no comparison in expression position, so one aggregate cannot split its
own rows into two windows. A widget group that compares SHALL therefore issue one request per
window and pair the responses on the client, rather than widening a single request to the union of
the two.

Turning comparison on SHALL add exactly one request per comparing shape, and SHALL leave every
non-comparing shape — the share chart's ranking, the heatmap's week, the split series, the spend
periods — at one request.

#### Scenario: Enabling comparison adds one request per comparing shape

- **GIVEN** the page has loaded with comparison off
- **WHEN** the user turns comparison on
- **THEN** the totals, the bucketed series and the breakdown rows are each requested a second time
- **AND** each of those requests covers exactly one of the two windows

#### Scenario: A row is attributed to exactly one window

- **WHEN** the two responses are paired into current and previous figures
- **THEN** every row contributes to exactly one of the two windows
- **AND** no row on the boundary is counted in both
