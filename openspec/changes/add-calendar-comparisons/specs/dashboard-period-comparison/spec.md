## MODIFIED Requirements

### Requirement: Compare control sits beside the period selector and governs the whole page

The controls bar SHALL render a `Compare` selector after the period selector, offering
`Previous period`, `Previous month`, `Previous year` and an off option. The selection SHALL apply to
every widget on the page that can express a change over time — the KPI cards and the breakdown
table's per-measure deltas — rather than to one widget. The selection SHALL NOT affect the URL, and
SHALL survive switching the `View by` option so a reader who moves between views keeps the
comparison they asked for.

`Previous period` SHALL be the default. A figure without a comparison answers "how much" and not
"more or less than before", which is the question this page exists to answer; a reader who does not
want the comparison turns it off.

A widget that names the compared window SHALL name the selected one rather than always saying
`previous period`. Where a widget renders a change without knowing which comparison is selected,
its text SHALL name no period at all instead of naming the wrong one.

#### Scenario: Comparison is on by default

- **WHEN** the user opens the usage page
- **THEN** the `Compare` selector reads `Previous period`
- **AND** each KPI card renders a delta against the previous window

#### Scenario: Turning comparison off drops every comparison at once

- **WHEN** the user selects the off option
- **THEN** no KPI card renders a delta
- **AND** the breakdown table renders no per-measure delta

#### Scenario: Comparison survives a view switch

- **GIVEN** comparison is set to `Previous period` in the LLM view
- **WHEN** the user switches `View by` to MCP
- **THEN** comparison is still `Previous period`

#### Scenario: A card names the window it is compared against

- **GIVEN** the comparison is set to `Previous year`
- **WHEN** a KPI card renders its footnote
- **THEN** the footnote names the previous year rather than the previous period

### Requirement: The previous window is the same span immediately before the current one

For a preset period, the previous window SHALL be the same span ending where the current window
begins — `Last 2d` compares against the two days before those two days. For a custom range, the
previous window SHALL be the same duration ending at the custom range's start. The previous window
SHALL be derived from the current window when the window is taken, not stored, so a preset's
sliding window and its comparison always share an edge.

This rule governs `Previous period`. The calendar comparisons derive their window differently — see
the requirement below.

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

## ADDED Requirements

### Requirement: A calendar comparison moves the window by whole months and keeps its duration

`Previous month` SHALL take the current window back one calendar month and `Previous year` back
twelve, keeping the date and the time of day. Both SHALL keep the window's **duration** rather than
its end date: a comparison measured over a different amount of time answers a different question,
and February would otherwise shorten every window compared against it.

Where the target month has no such day, the day SHALL be clamped to that month's last — 31 March
compared against a previous month reads 28 February, and 29 February against a previous year reads
28 February. The shift SHALL move the month with the day already set to the 1st, so a 31st does not
roll forward into the month after the target.

The shift SHALL read and write local date parts, so a comparison lands on the same wall-clock date
a reader would name, rather than on an instant offset by daylight saving.

Neither option SHALL add a request shape or change how many requests a window costs: the previous
window is still one window, derived where the adjacent one is derived.

#### Scenario: Previous month keeps the date and the time of day

- **GIVEN** the window runs from 15 September 11:30 for two days
- **WHEN** the comparison is set to `Previous month`
- **THEN** the compared window starts 15 August 11:30
- **AND** it spans two days

#### Scenario: Previous month crosses the year boundary

- **GIVEN** the window starts 20 January
- **WHEN** the comparison is set to `Previous month`
- **THEN** the compared window starts 20 December of the year before

#### Scenario: A day the target month does not have is clamped

- **GIVEN** the window starts 31 March
- **WHEN** the comparison is set to `Previous month`
- **THEN** the compared window starts 28 February

#### Scenario: A leap day compares against the 28th

- **GIVEN** the window starts 29 February of a leap year
- **WHEN** the comparison is set to `Previous year`
- **THEN** the compared window starts 28 February of the year before

#### Scenario: A calendar comparison costs the same as the adjacent one

- **GIVEN** the comparison is set to `Previous year`
- **WHEN** the page loads
- **THEN** the comparing shapes are each requested once per window, as they are for `Previous period`
