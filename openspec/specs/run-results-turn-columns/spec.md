# run-results-turn-columns Specification

## Purpose

Defines how the run Extraction Result grid presents request and turn positions for single-request,
chained-request, and multi-turn test cases — which of those columns it opens with, and how each renders
once shown — while preserving flat-row navigation and sorting behavior.

## Requirements

### Requirement: Run results show the turn number and total turn count

The run results grid SHALL provide two columns in the `EXECUTION` column group, positioned immediately
after `# Run number`, and SHALL render them as follows whenever they are shown:

- **Turn** — the result's `turnIndex` rendered 1-based, matching how `# Run number` renders `runIndex`.
- **Total turns** — the result's `totalTurns` as supplied.

Both SHALL render empty when the underlying field is absent.

Whether either column is shown on opening the grid is governed by "Execution position columns start
hidden unless they distinguish a row"; a column hidden there remains provided, listed in the columns
panel, and renders exactly as specified here once selected.

#### Scenario: A turn result shows its position

- **WHEN** a result row has `turnIndex` 2 within a 4-turn conversation
- **THEN** the Turn column shows `3` and the Total turns column shows `4`

#### Scenario: The first turn is shown as turn one

- **WHEN** a result row has `turnIndex` 0
- **THEN** the Turn column shows `1`, not `0`

#### Scenario: A single-turn result leaves both cells empty

- **WHEN** a result row carries neither `turnIndex` nor `totalTurns`
- **THEN** both columns render empty

### Requirement: Execution position columns start hidden unless they distinguish a row

On the run Extraction Result grid, `Total requests` and `Total turns` SHALL start hidden whatever they
hold. A total is context for a position, not a reading of its own, and a run reports the same total on
every row of a test case.

An Execution position column — `# Run number`, `Request`, `Turn` — SHALL start hidden when its value is
the same for every result in the run, and SHALL start visible when that value differs between any two
results. A column whose value is absent from every result counts as having no variation.

A column carrying one repeated value distinguishes no row from another, and each of these columns holds
a fixed width, so on a single-request single-turn run five such columns displace the metric and
extracted columns the grid exists to show.

The variation rule SHALL consider only those three position columns. `HTTP` and `Duration` SHALL remain
visible by default whatever their values, and no column outside the Execution group SHALL have its
default visibility decided by variation — a single-valued extracted column is a result the operator
asked for, not noise.

#### Scenario: A single-request, single-turn run hides its position columns

- **WHEN** a run's results all carry the same request position and the same turn position
- **THEN** `Request`, `Total requests`, `Turn` and `Total turns` are not shown in the grid

#### Scenario: A multi-turn run keeps its turn column

- **WHEN** a run's results span more than one turn position
- **THEN** `Turn` is shown in the grid and `Total turns` is not

#### Scenario: A chained-request run keeps its request column

- **WHEN** a run's results span more than one request position
- **THEN** `Request` is shown in the grid and `Total requests` is not

#### Scenario: The totals stay hidden even when they vary

- **WHEN** a run's results report different total turn counts for different test cases
- **THEN** `Total turns` is still not shown in the grid

#### Scenario: Repeated runs of a test case keep the run-number column

- **WHEN** a run's results span more than one run number
- **THEN** `# Run number` is shown in the grid

#### Scenario: A column absent from every result is treated as unvarying

- **WHEN** no result in the run carries a turn position
- **THEN** `Turn` is not shown in the grid

#### Scenario: HTTP and Duration are exempt

- **WHEN** every result in the run returned the same HTTP status
- **THEN** `HTTP` is still shown in the grid

#### Scenario: A run with no results hides nothing on account of variation

- **WHEN** the grid is shown for a run that produced no results
- **THEN** `# Run number`, `Request` and `Turn` are all shown

### Requirement: A column hidden by default stays offered in the columns panel

Starting a column hidden — whether for lack of variation or because it is a total — SHALL affect only
its default visibility. The column SHALL remain listed in the grid's columns panel, shown as unselected,
and selecting it SHALL bring it into the grid with its values for the current results.

The operator is being spared a column that reads the same on every row, not denied it; a run whose
positions are uniform is still a run whose positions someone may want to confirm.

#### Scenario: The panel lists a column hidden for lack of variation

- **WHEN** the columns panel is opened on a run whose turn positions do not vary
- **THEN** `Turn` is listed in the panel as unselected

#### Scenario: The panel lists the total columns

- **WHEN** the columns panel is opened on any run
- **THEN** `Total requests` and `Total turns` are listed in the panel as unselected

#### Scenario: The operator restores a hidden column

- **WHEN** the operator selects a column that was hidden for lack of variation
- **THEN** that column appears in the grid showing its value for each result

### Requirement: The variation rule never makes a hidden column visible

The variation rule SHALL only hide. A column that a grid already presents as hidden by default SHALL
stay hidden regardless of whether its values vary.

The run Compare Execution results grid starts with every Execution column hidden, because a comparison
opens on the metrics being compared; letting variation reveal those columns there would change a
deliberate default rather than remove noise from it.

#### Scenario: Compare keeps its Execution columns hidden when values vary

- **WHEN** the Compare Execution results grid is shown for two runs whose results span several turns
- **THEN** the Execution index columns are still hidden by default

### Requirement: Multi-turn results are not grouped

The results grid SHALL continue to render one flat row per result. It SHALL NOT group rows by test case, add an expander column, synthesize summary rows, alter the default sort, or disable sorting on any column, whether or not the run contains multi-turn cases.

This is a deliberate scope boundary: turn grouping in results is deferred so that concurrent comparison and heatmap work does not conflict with it.

#### Scenario: A multi-turn run renders flat

- **WHEN** a run containing 4-turn conversations is opened
- **THEN** each turn is its own row, with no expander column and no summary rows

#### Scenario: Column sorting still works on a multi-turn run

- **WHEN** a column header is used to sort a run containing multi-turn cases
- **THEN** the sort applies, exactly as it does for a single-turn run

#### Scenario: Per-turn metric scores need no special handling

- **WHEN** a metric is scored for each turn of a conversation
- **THEN** each turn's row shows its own score in the existing metric columns

### Requirement: Request and Turn columns are sortable

The Extraction Result grid SHALL allow users to sort rows numerically by the displayed Request and
Turn values. Sorting either column SHALL remain available and SHALL apply to the currently visible
rows while the Test Case name filter is active.

#### Scenario: Results are sorted by request number

- **WHEN** a user sorts the Request column
- **THEN** the result rows are ordered numerically by request number in the selected direction

#### Scenario: Results are sorted by turn number

- **WHEN** a user sorts the Turn column
- **THEN** the result rows are ordered numerically by turn number in the selected direction

#### Scenario: Filtered results remain sortable

- **WHEN** a user filters results by Test Case name and then sorts the Request or Turn column
- **THEN** the visible matching rows are ordered numerically by the selected column in the selected direction
