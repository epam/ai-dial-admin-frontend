# eval-runs-list Specification

## Purpose

Defines what the evaluation runs list presents and how — its column set and order, each column's cell
view, truncation and overflow behaviour, content-based sizing, and row activation — across the `/runs`
list, the Test Suite view's Runs tab, and the compare-run picker, all of which render the same run
shape. `/runs` and the Test Suite Runs tab both read it via the structured-query API
(`test_suite_runs`); the compare-run picker still reads it via `GET /api/v1/test-suite-runs`.

## Requirements

### Requirement: Runs list column set and order

The runs list SHALL present these columns, in this order: Status, Test case run name, Runs, Test
cases, Test Suite ID, Target, Metrics, Start Date, End Date, Duration, Cost, Overall score.

The count columns SHALL be labelled `Runs` and `Test cases`. The list SHALL NOT offer a `Created date`
column. Start Date and End Date SHALL be visible by default, as SHALL Test Suite ID on the
unscoped list.

#### Scenario: The unscoped runs list renders every column

- **WHEN** the operator opens the runs list
- **THEN** the twelve columns above are present, in that order
- **AND** no `Created date` column is offered, in the grid or in the columns panel

#### Scenario: Counts are labelled by what they count

- **WHEN** the runs list renders its headers
- **THEN** the run-count column reads `Runs` and the test-case-count column reads `Test cases`

### Requirement: A suite-scoped runs list omits Test Suite ID

A runs list already scoped to one test suite SHALL NOT present a Test Suite ID column; every other
column and the same order SHALL apply. The suite is the context, so repeating its id on every row
carries no information.

#### Scenario: The Test Suite Runs tab drops the redundant column

- **WHEN** the operator opens a test suite's Runs tab
- **THEN** the eleven remaining columns are present in the same relative order
- **AND** no Test Suite ID column is present

### Requirement: The suite-scoped runs list sources the same data as the unscoped list

The Test Suite Runs tab SHALL read run rows from the same query-backed source as the unscoped runs
list, so a suite-scoped row carries the same Target, Metrics, Cost, and Overall score values a
corresponding unscoped row would carry for the same run — never a missing-value indication caused
only by which view rendered it.

#### Scenario: Suite tab shows the same target, metrics, cost, and score as the unscoped list

- **WHEN** a run has a resolvable target, metric names, a recorded cost, or an overall score
- **AND** the operator views that run from its test suite's Runs tab
- **THEN** the Target, Metrics, Cost, and Overall score cells show the same values they would show on
  the unscoped runs list

#### Scenario: A run genuinely lacking a value still shows the missing-value indication

- **WHEN** a run has no resolvable target, no metrics, no cost, or no overall score
- **AND** the operator views that run from its test suite's Runs tab
- **THEN** the corresponding cell shows the missing-value indication, matching the unscoped list's
  behavior for the same run

### Requirement: Run name and run id share one column

The list SHALL present a run's name and its id as one column, `Test case run name`, rendered as two
lines within the row: the run name as the primary line and the run id as the secondary line, visually
subordinate to it. The list SHALL NOT present a separate id column.

Each line SHALL truncate independently at the column's rendered width, and each SHALL expose its full
value on hover and on keyboard focus. Neither line SHALL wrap.

#### Scenario: Name over id in one column

- **WHEN** a run row renders
- **THEN** its name and its id appear in a single column, the name on the primary line and the id
  below it
- **AND** no separate id column is present

#### Scenario: A long name truncates without hiding the id

- **WHEN** a run's name is wider than the column's rendered width
- **THEN** the name truncates with an ellipsis and the id line is still shown
- **AND** the full name is reachable on hover and on keyboard focus

#### Scenario: A long id truncates independently

- **WHEN** a run's id is wider than the column's rendered width but its name is not
- **THEN** the id truncates and the name is shown in full

### Requirement: Target names the evaluated entity and its kind

The list SHALL present a Target column identifying what the run evaluated, as two lines: the entity
name as the primary line and its kind — Application, Model, or MCP — as the secondary line. Truncation
and the hover / focus affordance SHALL behave as for `Test case run name`.

#### Scenario: Target shows name over kind

- **WHEN** a run row renders with a resolvable target
- **THEN** the Target column shows the entity's name on the primary line and its kind on the
  secondary line

#### Scenario: No resolvable target

- **WHEN** a run has no resolvable target entity
- **THEN** the Target cell shows a missing-value indication rather than an empty cell or a fabricated
  name

### Requirement: Metrics collapses overflow into a measured counter

The list SHALL present a Metrics column listing the metric names the run's test suite uses, as tags
laid out left to right. Tags SHALL be rendered until the next tag would exceed the column's rendered
width; the remaining tags SHALL collapse into a single counter badge reading the number hidden.

The number of visible tags SHALL be determined by measuring the rendered width, not by a fixed tag
count, so the column reflows when it is resized. The hidden names SHALL be reachable from the counter
on hover and by keyboard, listed in full.

#### Scenario: All tags fit

- **WHEN** every metric name fits within the column's rendered width
- **THEN** all tags are shown and no counter badge is rendered

#### Scenario: Tags overflow

- **WHEN** the metric names do not all fit within the column's rendered width
- **THEN** the tags that fit are shown, followed by one counter badge stating how many are hidden
- **AND** the hidden names are listed in full on hover and are reachable by keyboard

#### Scenario: Resizing reflows the tags

- **WHEN** the operator widens or narrows the Metrics column
- **THEN** the number of visible tags is recomputed for the new width and the counter is updated or
  removed accordingly

#### Scenario: A suite with no metrics

- **WHEN** a run's test suite uses no metrics
- **THEN** the Metrics cell renders no tags and no counter badge

### Requirement: Duration is derived from the run's own timestamps

The list SHALL present a Duration column computed as the run's completion time minus its start time.
Duration SHALL be shown only when both timestamps are present and the difference is finite and
non-negative; otherwise the cell SHALL show a missing-value indication.

#### Scenario: A settled run shows its duration

- **WHEN** a run has both a start and a completion timestamp
- **THEN** the Duration cell shows the elapsed time between them

#### Scenario: A run still in progress

- **WHEN** a run has a start timestamp but no completion timestamp
- **THEN** the Duration cell shows a missing-value indication rather than a zero or a running counter

### Requirement: Cost and Overall score distinguish absent from zero

The Cost and Overall score columns SHALL show a missing-value indication when the run has no such
value, and SHALL NOT substitute `0` for an absent one — a run that produced no scores and a run that
scored zero are different outcomes. When present, Cost SHALL be formatted as a currency amount and
Overall score as its numeric value.

#### Scenario: A run with no scores

- **WHEN** a run has no overall score
- **THEN** the Overall score cell shows a missing-value indication, not `0`

#### Scenario: A run with no recorded cost

- **WHEN** a run has no cost value
- **THEN** the Cost cell shows a missing-value indication, not `$0`

### Requirement: Columns keep a configured width and never wrap

`Test case run name`, `Test Suite ID`, and `Metrics` SHALL be flexible: after every other column has
taken the width it needs, these SHALL divide the remaining width between them.

The narrow columns — the two counts, Duration, Cost, and Overall score — SHALL each carry a width
ceiling, so the grid's shared flex cannot pad a two-digit count out to the width of a wide one. Target
and the two date columns SHALL each carry their own width floor rather than sharing the grid's global
one. No cell in the list SHALL wrap to a second line for want of width — content that does not fit
truncates, per its column's truncation rule.

The Status column SHALL be pinned to its indicator width at both bounds and SHALL NOT be widened to
fit its header label, which truncates instead; the full label SHALL stay reachable on hover.

#### Scenario: Narrow columns stay narrow, flexible columns take the rest

- **WHEN** the runs list renders in a viewport wider than the sum of its column widths
- **THEN** the count, duration, cost, and score columns stay within their width ceilings
- **AND** the remaining width is divided between `Test case run name`, `Test Suite ID`, and `Metrics`

#### Scenario: Nothing wraps in a narrow viewport

- **WHEN** the runs list renders where the available width is less than its content needs
- **THEN** no cell wraps to a second line; content truncates instead

#### Scenario: Status stays narrow

- **WHEN** the runs list renders
- **THEN** the Status column is sized for its indicator, not for the width of the word in its header

### Requirement: Activating a row opens the run

Clicking a run row, other than in the row-actions column, SHALL open that run's details page in the
same tab. A click with ctrl / cmd held, or a middle click, SHALL open it in a new tab instead. This
SHALL hold on both the unscoped runs list and a suite-scoped one.

#### Scenario: A plain click navigates in place

- **WHEN** the operator clicks a run row on a suite's Runs tab
- **THEN** the app navigates to that run's details page in the same tab

#### Scenario: A modified click opens a new tab

- **WHEN** the operator ctrl / cmd clicks or middle-clicks a run row
- **THEN** that run's details page opens in a new tab and the list stays as it is

#### Scenario: The actions column does not navigate

- **WHEN** the operator clicks within a row's actions column
- **THEN** no navigation occurs

### Requirement: A column is sortable or filterable only where the backend supports it

Columns whose values the run listing endpoint cannot order or query on SHALL NOT offer a sort control
or a filter. The list is fetched page by page and every sort and filter is a request parameter, so a
control the endpoint cannot honour would either reorder the fetched page alone or name a field the
endpoint rejects — which returns an empty list rather than a filtered one.

Duration, Cost and Overall score are not queryable: Duration is derived client-side from the run's own
timestamps, and Cost and Overall score are appended to a run after the underlying query has already
run. Every other column, including the run and test-case counts, Target and Metrics, reads a real
queryable field and offers whichever of sort and filter its shape supports.

#### Scenario: Duration, Cost, and Overall score offer neither a sort control nor a filter

- **WHEN** the runs list renders its headers and filter row
- **THEN** the Duration, Cost, and Overall score columns offer neither a sort control nor a filter

#### Scenario: The count columns are sortable, but offer no filter

- **WHEN** the runs list renders its headers and filter row
- **THEN** the Runs and Test cases columns offer a sort control
- **AND** neither offers a filter

### Requirement: Target is filterable by name, and sortable by its deployment name

Target identifies its entity through one of two underlying fields depending on what the run evaluated
(a deployment's name or an MCP tool's name), so the list SHALL offer a filter that searches both,
matching whichever one the run set.

No single field expresses "whichever name is set" for sorting, so the Target column's sort SHALL order
by the deployment name alone: rows evaluating an MCP tool, which carry no value in that field, SHALL
sort together at one end rather than being interleaved by their own MCP name.

#### Scenario: Filtering Target matches either underlying name

- **WHEN** the operator filters the runs list by a value on Target
- **THEN** rows whose evaluated deployment name matches, or whose evaluated MCP tool name matches, are
  returned

#### Scenario: Sorting Target orders by deployment name, grouping MCP rows together

- **WHEN** the operator sorts the runs list by Target
- **THEN** rows evaluating a deployment are ordered by that deployment's name
- **AND** rows evaluating an MCP tool sort together, not interleaved among the deployment-ordered rows

### Requirement: Metrics is sortable and filterable

The metric names a run's test suite uses are a real, queryable field, so the Metrics column SHALL
offer both a sort control and a filter, matching on any run whose metric names include the filtered
text.

#### Scenario: Filtering Metrics matches a metric name

- **WHEN** the operator filters the runs list by a metric name on Metrics
- **THEN** rows whose metric names include a match are returned

### Requirement: Status is sortable, and filtered from a filter button

The Status column header SHALL show its name and a sort control. Its place in the filter row SHALL
hold a filter button that opens a checkbox list of the fixed status values, and SHALL NOT hold a
free-text input: a status is a fixed value, so typing into it cannot express the filter the operator
wants.

The filter button SHALL be the only way to filter Status. No free-text or operator-based entry SHALL
be reachable for this column by any route, including AG Grid's own column-menu filter — a status
value is never discovered by typing it, only by picking it from the list.

The checkbox list SHALL offer exactly the status values the system can display — `PENDING`,
`COMPLETED`, `RUNNING`, `FAILED`, `CANCELLING`, `CANCELLED` — each labelled the same way its own status
indicator is labelled elsewhere in the app, plus a control to select or clear every value at once.

Selecting one or more values SHALL narrow the list to rows whose status matches any of the selected
values. Clearing every selection SHALL remove the filter entirely, returning the list to its
unfiltered state — the same state a column with no active filter is in.

A filter row holding only its filter button SHALL centre that button, horizontally and vertically,
rather than leaving it against the edge of the cell where an input would have ended.

#### Scenario: Status offers a filter button rather than an input

- **WHEN** the runs list renders its headers and filter row
- **THEN** the Status header shows the label `Status` and a sort control
- **AND** the filter row shows a filter button under Status, with no free-text input beside it
- **AND** that button is centred in its cell

#### Scenario: Picking statuses narrows by any of them

- **WHEN** the operator opens the Status filter button and checks `FAILED` and `CANCELLED`
- **THEN** the list shows only runs whose status is `FAILED` or `CANCELLED`

#### Scenario: Clearing the selection removes the filter

- **WHEN** the operator has one or more statuses checked and then clears every checkbox
- **THEN** the list returns to showing runs of every status, as if Status had never been filtered

#### Scenario: No free-text route exists onto the Status column

- **WHEN** the operator interacts with the Status column's header or filter row by any means the grid
  exposes
- **THEN** no free-text input or operator picker (equals, contains, or otherwise) is reachable for
  that column

### Requirement: The compare-run picker presents only identifying columns

The modal that selects a run to compare against SHALL present only the columns that identify a run —
its status, name and id, run and test-case counts, and start and end times. It SHALL NOT present the
Target, Metrics, Duration, Cost, or Overall score columns.

#### Scenario: Picking a run to compare

- **WHEN** the operator opens the compare-run selection modal
- **THEN** the grid shows status, `Test case run name`, `Runs`, `Test cases`, Start Date, and End Date
- **AND** it shows no Target, Metrics, Duration, Cost, or Overall score column
