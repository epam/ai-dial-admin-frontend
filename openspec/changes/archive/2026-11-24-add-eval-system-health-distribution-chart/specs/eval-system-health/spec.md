## ADDED Requirements

### Requirement: Health distribution chart

The System Health page SHALL show a **Test suite health distribution - 5 weeks** chart. It SHALL read the
five most recent UTC weeks, the current week included, from the evaluation analytics endpoint
`GET /api/v1/analytics/test-suites/health-distribution` with the backend's default threshold of 0.75, and
SHALL send no filter. It SHALL draw one bar per week, oldest week first and the current week last, each bar
split into a **Healthy** band for the test suites whose weekly pass rate is at or above the threshold and a
**Fail** band for those below it. A bar SHALL be scaled to the week's own suites, so every bar with data
reaches the same height and the bands show shares rather than counts. A week the endpoint reports with no
counted suite SHALL show no bar. The Healthy band SHALL use the success colour and the Fail band the error
colour of the active theme.

#### Scenario: Five weeks, current week last

- **WHEN** the endpoint returns five weeks
- **THEN** the chart shows five bars in the order the endpoint returned them, the oldest first
- **AND** the request asked for 5 weeks and no filter

#### Scenario: Bars are shares

- **WHEN** one week has 6 healthy and 2 failing suites and another has 30 healthy and 10 failing
- **THEN** both bars reach the full height of the chart
- **AND** in each the Healthy band takes 75% of the bar and the Fail band 25%

#### Scenario: A week with no suites

- **WHEN** a week is reported with 0 healthy and 0 failing suites
- **THEN** its place on the x-axis is kept and no bar is drawn for it

### Requirement: Health distribution week labels and legend

Each bar SHALL be labelled on the x-axis with its week's start date, a Monday in UTC, as a short month and
day such as `Nov 3`. A legend SHALL name the two bands with the threshold the endpoint reports, as
`Healthy ≥ <threshold>` and `Fail < <threshold>`, each beside a swatch of its band's colour. The legend
SHALL be plain text, not a control.

#### Scenario: Week label

- **WHEN** a week starts at Monday 3 November 00:00 UTC
- **THEN** its bar is labelled `Nov 3`, whatever the viewer's time zone

#### Scenario: Legend states the threshold

- **WHEN** the endpoint reports a threshold of 0.75
- **THEN** the legend reads `Healthy ≥ 0.75` and `Fail < 0.75`, each beside a swatch in its band's colour

### Requirement: Health distribution tooltip

No percentage or count SHALL be drawn on a bar. Hovering a bar SHALL show a tooltip naming the week and, for
Healthy and for Fail, the number of test suites and its share of the week's suites as a percentage with one
decimal place, such as `Healthy 21 suites · 65.8%`. The shares of one week SHALL add up to 100%. A week with
no counted suite SHALL offer no tooltip.

#### Scenario: Tooltip on a bar

- **WHEN** a week has 21 healthy and 11 failing suites and the user hovers its bar
- **THEN** a tooltip names the week
- **AND** shows `Healthy` with 21 suites and 65.6%, and `Fail` with 11 suites and 34.4%

#### Scenario: Nothing on the bars

- **WHEN** the chart is shown
- **THEN** no percentage or count is drawn inside or above any bar

### Requirement: Health distribution explanation

An info control SHALL sit beside the chart's title. Hovering it, and moving keyboard focus to it, SHALL show a
tooltip that explains the chart: that each bar shows the share of the test suites that ran in that week which
were healthy and which failed; that a test suite is healthy when its pass rate across all its runs that week
is at or above the threshold the legend states, and fails when it is below; that a suite counts only in the
weeks it ran; and that one evaluatee can have several test suites, so the chart is more granular than
evaluatee-level health. The tooltip SHALL name only the two bands the chart draws. The control SHALL have an
accessible name.

#### Scenario: Tooltip on hover

- **WHEN** the user hovers the info control beside the chart title
- **THEN** a tooltip explains what a bar shows and when a test suite is healthy, naming the threshold

#### Scenario: Tooltip on keyboard focus

- **WHEN** the user moves keyboard focus to the info control
- **THEN** the same tooltip is shown

#### Scenario: Only two bands

- **WHEN** the tooltip is shown
- **THEN** it describes Healthy and Fail only, and names no third band

### Requirement: Health distribution is available to assistive technology

The drawn bars SHALL be hidden from assistive technology, and the chart SHALL be accompanied by a visually
hidden table with a row per week, giving the week's start date, its healthy and failing suite counts and
their shares. The table SHALL carry the section's title as its accessible name.

#### Scenario: Hidden table

- **WHEN** the chart has loaded five weeks
- **THEN** a table named after the section has five rows
- **AND** each row states the week, the healthy count, the failing count and the shares

### Requirement: Health distribution loading, empty and error states

The chart SHALL have its own states, independent of the cards and the run-trends table. While the request is
in flight it SHALL show a loading indicator. When every returned week has no counted suite it SHALL show an
empty state saying a week fills in once test suite runs are recorded. When the request fails it SHALL show an
error message announced as an alert, with a retry control that requests the chart again.

#### Scenario: Loading

- **WHEN** the health distribution request is in flight
- **THEN** the chart area shows a loading indicator

#### Scenario: No recorded runs

- **WHEN** the endpoint returns five weeks that all have 0 healthy and 0 failing suites
- **THEN** the chart area shows an empty state saying a week fills in once test suite runs are recorded
- **AND** no bars or legend are shown

#### Scenario: The request fails

- **WHEN** the health distribution request fails
- **THEN** the chart area shows an error message announced as an alert
- **AND** the cards and the run-trends table are unaffected

#### Scenario: Retry

- **WHEN** the user activates retry after a failure
- **THEN** the chart is requested again
- **AND** it shows the loading indicator until the response returns

## MODIFIED Requirements

### Requirement: Run trends placement

The Evaluation Run Trends table SHALL share a row with the Test suite health distribution chart. On a
standard screen (the width at which the card rows switch to four columns, and wider) the table SHALL take
the left half of the row and the chart the right half. On a narrower screen they SHALL stack at full width,
the table first. Each SHALL keep its own height: neither stretches to match the other.

#### Scenario: Standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the Evaluation Run Trends table takes the left half of its row
- **AND** the Test suite health distribution chart takes the right half

#### Scenario: Small screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Evaluation Run Trends table takes the full width
- **AND** the chart is shown below it, also at full width
