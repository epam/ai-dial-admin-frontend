## Purpose

Defines Test Suite Trends tab behavior for summarizing recent suite runs — how the tab reports each
run's case-level outcome mix and its latest run's pass count, and how it reports runs against the
suite's optional overall score threshold.

## ADDED Requirements

### Requirement: Cases Passed panel placement and data source
The Trends tab SHALL render a **Cases Passed** panel that reports per-run case-level outcome counts
for the suite's most recent runs, positioned after the KPI strip and before the Overall Score Trend
chart. The panel SHALL read the analytics case-pass-rate endpoint
(`GET /api/v1/analytics/eval-summaries/test-case-pass-rate/{testSuiteId}`) with `lastN` set to the
Trends run-window size, and SHALL NOT derive its counts from any other source. That response names
no run, so each run's name, creation date, status and detail-page route SHALL come from the suite's
runs list, joined on `testSuiteRunId`.

#### Scenario: Panel renders between the KPI strip and the score chart
- **WHEN** the Trends tab loads for a suite with at least one run returned by the case-pass-rate
  endpoint
- **THEN** the Cases Passed panel appears after the KPI strip and before the Overall Score Trend
  chart

#### Scenario: Window size matches the Trends window
- **WHEN** the Trends run-window size is 10
- **THEN** the panel requests the case-pass-rate endpoint with `lastN=10`

### Requirement: Bar series ordering and composition
The panel SHALL render one stacked bar per run returned by the endpoint, ordered oldest first by
reversing the endpoint's newest-first response order. Each bar SHALL stack its run's four groups
bottom-up in this order: `successPassedCount` (pass), `successNotPassedCount` (fail), `failedCount` (error) and
`successNoVerdictCount` (not scored). The four SHALL be distinct groups: `failedCount` covers rows whose
execution did not succeed, while `successNoVerdictCount` covers rows that executed successfully but
produced no threshold verdict. A group with a count of `0` SHALL render no segment at all, rather
than a minimum-height sliver.

#### Scenario: Oldest run is leftmost
- **WHEN** the endpoint returns three runs newest first
- **THEN** the bars appear left to right in the reverse of that order

#### Scenario: Zero-count group renders no segment
- **WHEN** a run has `failedCount` of `0`
- **THEN** that bar has no error segment

#### Scenario: All four groups render when non-zero
- **WHEN** a run has non-zero `successPassedCount`, `successNotPassedCount`, `failedCount` and `successNoVerdictCount`
- **THEN** the bar shows four segments, pass at the bottom and not scored at the top

#### Scenario: Errored and unscored rows stay in separate groups
- **WHEN** a run has `failedCount` 3 and `successNoVerdictCount` 7
- **THEN** the bar shows an error segment counting 3 and a not-scored segment counting 7


### Requirement: Bar scale and unresolved remainder
Each bar SHALL be drawn on a fixed-height track whose full height represents that run's `totalCount`,
so each segment's height is its group count as a proportion of `totalCount`. When the four group
counts sum to less than `totalCount`, the difference SHALL remain as unfilled track and SHALL be
reported in the bar's tooltip as a count of rows not run.

#### Scenario: Segment heights are proportional to the run total
- **WHEN** a run has `totalCount` 40 and `successPassedCount` 20
- **THEN** the passed segment occupies half the track height

#### Scenario: Short bucket sum leaves unfilled track
- **WHEN** a run has `totalCount` 30 and buckets summing to 24
- **THEN** the bar leaves the top fifth of the track unfilled and its tooltip reports 6 rows not run

#### Scenario: Partial run is comparable to a complete one
- **WHEN** one run has `totalCount` 30 with 15 rows counted and another has `totalCount` 30 fully
  counted
- **THEN** both bars use the same track height and the partial run's stack fills half of it

### Requirement: Panel shares a row with the Overall Score Trend chart
The Cases Passed panel and the Overall Score Trend chart SHALL occupy one row at an even width
split, each filling its half and squared off against the other's height. Bars SHALL have a fixed
nominal width that flexes only within a bounded range, so a full window fits the halved width. On
viewports too narrow for the split the two SHALL stack, each at its natural height.

#### Scenario: The two charts share a row
- **WHEN** the Trends tab renders on a wide viewport with run data
- **THEN** the Cases Passed panel and the Overall Score Trend chart sit side by side, each taking
  half the row's width, and both render at the same height

#### Scenario: Run labels read bottom-to-top
- **WHEN** a bar renders its run label
- **THEN** the label is rotated to read from bottom to top, so it is not constrained by the bar's
  width, and its accessible name still reports the run horizontally

#### Scenario: A full window fits the halved width
- **WHEN** the window contains 10 runs and the panel has half the row
- **THEN** the bars shrink within their bounded range rather than the card overflowing

#### Scenario: Narrow viewports stack the two
- **WHEN** the viewport is too narrow for an even split
- **THEN** the Cases Passed panel and the Overall Score Trend chart stack vertically

### Requirement: Latest bar is visually distinguished
The bar for the newest run in the window SHALL be visually separated from the preceding bars and
SHALL carry an accent treatment on both the bar and its label, so the run the numeric readout
describes is identifiable without reading the readout.

#### Scenario: Newest bar is set apart
- **WHEN** the window contains more than one run
- **THEN** the rightmost bar is separated from the others by a divider and rendered with the accent
  treatment, while the other bars are not

#### Scenario: Single run still gets the accent treatment
- **WHEN** the window contains exactly one run
- **THEN** that bar carries the accent treatment

### Requirement: Per-run navigation from a bar
Each bar whose run is resolvable to a run detail page SHALL be an anchor to that run's detail page, so
that middle-click, cmd/ctrl-click, and "open link in new tab" work and default activation navigates in
the same tab. Each such bar SHALL be reachable by keyboard in oldest-to-newest DOM order, SHALL
activate on Enter, and SHALL show a visible focus indicator. A bar whose run cannot be resolved to a
detail page SHALL render non-interactive — no link, no pointer cursor, and not in the tab order —
while still showing its tooltip.

#### Scenario: Bar navigates to the run detail page
- **WHEN** the user activates a bar for a resolvable run
- **THEN** the application navigates to that run's detail page in the same tab

#### Scenario: Bar supports opening in a new tab
- **WHEN** the user cmd/ctrl-clicks or middle-clicks a bar for a resolvable run
- **THEN** the browser opens that run's detail page in a new tab and the Trends tab is unchanged

#### Scenario: Keyboard order follows the chart order
- **WHEN** the user tabs through the panel's bars
- **THEN** focus moves from the oldest bar to the newest

#### Scenario: Unresolvable run is non-interactive
- **WHEN** a run returned by the endpoint has no corresponding entry in the suite's runs list
- **THEN** that bar is not a link and is skipped by keyboard navigation, and its tooltip still appears
  on hover

### Requirement: Bar tooltip content
Hovering a bar or moving keyboard focus to it SHALL show a single tooltip for that bar reporting the
run's label, its creation date, and each group's count with the group's name. At most one tooltip
SHALL be shown at a time, and leaving or blurring the bar SHALL dismiss it. When the run's `status`
is `RUNNING`, the tooltip SHALL additionally state that the run is in progress.

#### Scenario: Tooltip reports label, date, and counts
- **WHEN** the user hovers a bar
- **THEN** a tooltip shows that run's label and creation date plus its pass, fail, error and
  not-scored counts

#### Scenario: Keyboard focus shows the same tooltip
- **WHEN** the user moves keyboard focus to a bar
- **THEN** the same tooltip appears as on hover

#### Scenario: Only one tooltip at a time
- **WHEN** the user moves the pointer from one bar directly to another
- **THEN** the first bar's tooltip is dismissed and only the second bar's tooltip is shown

#### Scenario: Running run is marked in progress
- **WHEN** a bar's run has `status` `RUNNING`
- **THEN** its tooltip states that the run is in progress

### Requirement: Bar accessible name
Each bar SHALL expose an accessible name that identifies the run and reports its outcome counts, so
the bar's meaning is available without the tooltip or the visual stack.

#### Scenario: Accessible name covers run identity and counts
- **WHEN** assistive technology reads a bar
- **THEN** its name includes the run label, the run's creation date, and the pass, fail, error and
  not-scored counts out of `totalCount`

### Requirement: Latest-run readout
The panel SHALL render a latest-run readout describing only the newest run in the window — never an
aggregate across runs. The readout SHALL show that run's label as a link to its detail page (or as
plain text when the run is unresolvable), its creation date, `successPassed / total` as the
primary metric with a "cases passed" caption, and its fail, error and not-scored counts.

#### Scenario: Readout reflects the newest run only
- **WHEN** the window's newest run has `successPassedCount` 44 and `totalCount` 48, and older runs
  have different counts
- **THEN** the readout shows `44 / 48`, regardless of the older runs' counts

#### Scenario: Latest run label links to its detail page
- **WHEN** the newest run is resolvable to a detail page
- **THEN** its label in the readout is a link to the same destination as its bar

#### Scenario: Unresolvable latest run label is plain text
- **WHEN** the newest run is not resolvable to a detail page
- **THEN** its label in the readout is plain text rather than a link

### Requirement: Delta against the previous run
When the window contains at least two runs, the readout SHALL show a delta chip reporting
`successPassedCount` of the newest run minus `successPassedCount` of the run immediately before it,
marked as an increase for values greater than or equal to zero and as a decrease for negative values,
with a success treatment for the former and an error treatment for the latter. When the window
contains fewer than two runs the chip SHALL be omitted entirely. No baseline comparison SHALL be
shown, because the suite has no baseline run.

#### Scenario: Increase is reported as a gain
- **WHEN** the newest run passed 44 cases and the previous run passed 38
- **THEN** the chip reports an increase of 6 with the success treatment

#### Scenario: Decrease is reported as a loss
- **WHEN** the newest run passed 38 cases and the previous run passed 44
- **THEN** the chip reports a decrease of 6 with the error treatment

#### Scenario: No change is reported as a gain of zero
- **WHEN** the newest run and the previous run passed the same number of cases
- **THEN** the chip reports an increase of 0 with the success treatment

#### Scenario: Chip omitted for a single run
- **WHEN** the window contains exactly one run
- **THEN** no delta chip is rendered

### Requirement: Lack-scoring readout
When the newest run produced no pass/fail verdict at all — `successPassedCount` and
`successNotPassedCount` both `0` while `successNoVerdictCount` is greater than `0` — the panel SHALL
replace the primary `passed / total` metric with a "Lack scoring" note, and SHALL NOT report a pass
count or pass rate of zero. This SHALL be determined from the run's own counts, never from the
suite's `overallScoreThreshold`. `failedCount` SHALL NOT bear on it: an execution failure says
nothing about whether scoring happened. Whenever any pass/fail verdict exists the panel SHALL show
the pass-rate readout. The bars SHALL still be rendered in either case.

#### Scenario: No verdict either way replaces the primary metric
- **WHEN** the newest run has `successPassedCount` 0, `successNotPassedCount` 0 and
  `successNoVerdictCount` 30
- **THEN** the readout shows the "Lack scoring" note instead of a `passed / total` figure

#### Scenario: Errored rows do not decide the state
- **WHEN** the newest run has `successPassedCount` 0, `successNotPassedCount` 0,
  `successNoVerdictCount` 10 and `failedCount` 20
- **THEN** the readout still shows the "Lack scoring" note, because no row was scored either way

#### Scenario: An all-errored run is not lacking scoring
- **WHEN** the newest run has `failedCount` equal to `totalCount` and `successNoVerdictCount` 0
- **THEN** the readout shows the `passed / total` figure rather than the "Lack scoring" note

#### Scenario: A single verdict restores the pass-rate readout
- **WHEN** the newest run has `successPassedCount` 1 and `successNoVerdictCount` 29
- **THEN** the readout shows `1 / 30` rather than the "Lack scoring" note

#### Scenario: Bars remain visible when scoring is lacking
- **WHEN** the newest run is lacking scoring
- **THEN** the panel still renders one bar per run, filled by the not-scored and error groups

### Requirement: Panel states
The panel SHALL render the following states:
- **Loading** — the panel frame is in place with empty tracks and a placeholder readout, so no
  layout shift occurs when data arrives.
- **No runs** — when the endpoint returns an empty `runs` array, the bars and readout are replaced by
  a single short "no runs yet" line.
- **Fewer runs than the window** — only the runs returned are rendered, left-aligned, with the
  latest-bar separation preserved and no padding with empty tracks.
- **Request failure** — the panel reports that its data is unavailable while the rest of the Trends
  tab continues to render.

#### Scenario: Loading state reserves the panel's space
- **WHEN** the panel's data is still loading
- **THEN** the panel frame, empty tracks, and a placeholder readout are shown, and the panel does not
  change height when the data arrives

#### Scenario: Empty runs array shows a short message
- **WHEN** the endpoint returns `runs` as an empty array
- **THEN** the panel shows a "no runs yet" line instead of bars and a readout

#### Scenario: Short window is not padded
- **WHEN** the window size is 10 and the endpoint returns 4 runs
- **THEN** the panel renders 4 bars, left-aligned, and no empty tracks

#### Scenario: Panel failure does not blank the tab
- **WHEN** the case-pass-rate request fails
- **THEN** the panel reports its data as unavailable and the KPI strip, Overall Score Trend, and
  Metric Trends still render their data
