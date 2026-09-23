## ADDED Requirements

### Requirement: Execution index columns with no variation start hidden

On the run Extraction Result grid, an Execution index column — `# Run number`, `Request`,
`Total requests`, `Turn`, `Total turns` — SHALL start hidden when its value is the same for every
result in the run, and SHALL start visible when that value differs between any two results.

A column carrying one repeated value distinguishes no row from another, and each of these columns holds
a fixed width, so on a single-request single-turn run five such columns displace the metric and
extracted columns the grid exists to show. A column whose value is absent from every result counts as
having no variation.

The rule SHALL consider only the five index columns. `HTTP` and `Duration` SHALL remain visible by
default whatever their values, and no column outside the Execution group SHALL have its default
visibility decided by variation — a single-valued extracted column is a result the operator asked for,
not noise.

#### Scenario: A single-request, single-turn run hides its index columns

- **WHEN** a run's results all carry the same request position and the same turn position
- **THEN** `Request`, `Total requests`, `Turn` and `Total turns` are not shown in the grid

#### Scenario: A multi-turn run keeps its turn columns

- **WHEN** a run's results span more than one turn position
- **THEN** `Turn` and `Total turns` are shown in the grid

#### Scenario: Repeated runs of a test case keep the run-number column

- **WHEN** a run's results span more than one run number
- **THEN** `# Run number` is shown in the grid

#### Scenario: A column absent from every result is treated as unvarying

- **WHEN** no result in the run carries a turn position
- **THEN** `Turn` and `Total turns` are not shown in the grid

#### Scenario: HTTP and Duration are exempt

- **WHEN** every result in the run returned the same HTTP status
- **THEN** `HTTP` is still shown in the grid

#### Scenario: A run with no results hides nothing

- **WHEN** the grid is shown for a run that produced no results
- **THEN** no column is hidden on account of variation

### Requirement: A column hidden for lack of variation stays offered in the columns panel

Hiding a column for lack of variation SHALL affect only its default visibility. The column SHALL remain
listed in the grid's columns panel, shown as unselected, and selecting it SHALL bring it into the grid
with its values for the current results.

The operator is being spared a column that reads the same on every row, not denied it; a run whose
positions are uniform is still a run whose positions someone may want to confirm.

#### Scenario: The panel lists a column hidden for lack of variation

- **WHEN** the columns panel is opened on a run whose turn positions do not vary
- **THEN** `Turn` is listed in the panel as unselected

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
