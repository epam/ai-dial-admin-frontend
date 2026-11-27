## ADDED Requirements

### Requirement: Run trends table

The System Health page SHALL show an **Evaluation Run Trends** table below the activity card row. Each row
SHALL stand for one test suite that has at least one recorded completed run, and SHALL show, in order, the
**Test suite**, the **Evaluatee** it targets, the **Run trends - 10 runs** bars of its recent pass rate, the
**Latest** pass rate, and the **Δ prev** change. There SHALL be no separate Type column: the evaluatee's type
is part of the Evaluatee cell. The table SHALL read its rows from the evaluation analytics endpoint
`GET /api/v1/analytics/test-suites/run-trends`, and SHALL NOT offer sorting or filtering.

#### Scenario: Columns and heading

- **WHEN** the page has loaded run trends
- **THEN** a table headed Evaluation Run Trends is shown below the activity cards
- **AND** its columns are Test suite, Evaluatee, Run trends - 10 runs, Latest and Δ prev, in that order

#### Scenario: Backend order is kept

- **WHEN** the endpoint returns suites ordered by latest pass rate ascending
- **THEN** the rows appear in that order, the lowest latest pass rate first
- **AND** a suite with no latest pass rate appears after those that have one
- **AND** no column can be sorted

### Requirement: Run trends row content

The **Test suite** cell SHALL show the suite's name with the suite's id on a second line, as the runs table
shows a run's name with the run's id. The **Evaluatee** cell SHALL show the name of the evaluatee the suite
targets with its type on a second line, as the runs table's Target column does. The type SHALL read Model,
Application or Toolset from the evaluatee's deployment type, and Route for a route-targeted suite; when the
evaluatee has a name but no deployment type this table has a label for, it SHALL fall back to the suite's own
type. A field the backend omits SHALL be left out rather than shown empty. An evaluatee with no name SHALL
show its id in the name's place, and one with neither SHALL show a dash with no second line.

#### Scenario: A model suite

- **WHEN** a suite named `Docs regression` with id `suite-1` targets the model `GPT-4o` and the evaluatee's type is `dial-model`
- **THEN** its Test suite cell shows `Docs regression` with `suite-1` on the line below
- **AND** its Evaluatee cell shows `GPT-4o` with Model on the line below

#### Scenario: An MCP tool suite

- **WHEN** a suite targets the tool `search` of the toolset `docs-toolset` and the evaluatee's type is `dial-toolset`
- **THEN** its Evaluatee cell shows the toolset's name with Toolset on the line below

#### Scenario: A route suite

- **WHEN** a suite's type is route and its evaluatee carries only a name
- **THEN** its Evaluatee cell shows the route name with Route on the line below

#### Scenario: A suite with no reference

- **WHEN** a suite's evaluatee is empty
- **THEN** its Evaluatee cell shows a dash with no second line
- **AND** its Test suite cell is unaffected

#### Scenario: The suite name opens the suite

- **WHEN** the user activates the suite's name in a row
- **THEN** the suite opens at its own page


### Requirement: Latest pass rate and change

The **Latest** cell SHALL show the newest run's pass rate as a whole percentage with a thin progress bar,
and the **Δ prev** cell SHALL show the change in percentage points against the run before it as a signed
badge, increases coloured as good and decreases as bad. Each cell SHALL show a dash when the backend gives
no figure: no latest pass rate when the newest run had no test cases, no change when there is only one run
or either run has no rate. A change that rounds to zero SHALL show the dash too.

#### Scenario: Latest rate with a drop

- **WHEN** a suite's latest pass rate is 0.8 and the previous is 0.9
- **THEN** its Latest cell reads 80% with a bar at 80%
- **AND** its Δ prev cell reads -10% as a decrease

#### Scenario: A rise

- **WHEN** a suite's latest pass rate is 0.9 and the previous is 0.8
- **THEN** its Δ prev cell reads +10% as an increase

#### Scenario: A single run

- **WHEN** a suite has one completed run
- **THEN** its Latest cell shows that run's rate
- **AND** its Δ prev cell shows a dash

#### Scenario: The newest run had no test cases

- **WHEN** the newest run's total test case count is 0
- **THEN** its Latest and Δ prev cells show a dash


### Requirement: Run trend bars

The **Run trends - 10 runs** cell SHALL draw one vertical bar per run of the suite that has a pass rate,
oldest on the left and newest on the right, at most ten. Each bar's height SHALL be its pass rate on a fixed
0–100% scale shared by every row, and its colour SHALL follow the pass-rate band the Latest bar uses (green,
yellow, red). A run without a pass rate SHALL be left out. A row with no bar to draw SHALL leave the cell
empty. The bars are decorative; the cell SHALL carry a text equivalent naming the rates, oldest to newest, for
assistive technology.

#### Scenario: Ten runs

- **WHEN** a suite returns ten runs with pass rates
- **THEN** the cell shows ten bars, the oldest on the left
- **AND** each bar's height is its pass rate against the same 0–100% scale as every other row's

#### Scenario: Colour follows the band

- **WHEN** a suite's runs have pass rates 0.9, 0.5 and 0.2
- **THEN** their bars are drawn green, yellow and red

#### Scenario: A run without a rate

- **WHEN** one of a suite's runs has no test cases
- **THEN** the cell leaves that run out

#### Scenario: Text equivalent

- **WHEN** a screen reader reaches a Run trends cell
- **THEN** it reads the pass rates of the drawn runs in order, oldest first


### Requirement: Run trends paging

The table SHALL load 10 suites at a time and SHALL offer previous and next controls with a label giving the
current page and the page count. The controls SHALL be disabled at the first and last page and while a page
is loading. The page count SHALL follow the total reported by the backend, not the number of rows received,
because a page may hold fewer rows than requested.

#### Scenario: More than one page

- **WHEN** the backend reports 25 suites
- **THEN** the pager reads page 1 of 3 and next is enabled while previous is disabled

#### Scenario: Next page

- **WHEN** the user activates next
- **THEN** the second page of 10 suites is requested and shown
- **AND** the pager reads page 2 of 3

#### Scenario: A short page

- **WHEN** the backend returns fewer rows than requested for a page but reports more pages
- **THEN** the table shows the rows it got
- **AND** the pager still follows the reported page count

#### Scenario: One page only

- **WHEN** the backend reports 4 suites
- **THEN** the pager is not shown

### Requirement: Run trends loading, empty and error states

The table SHALL have its own states, independent of the cards above it. While a page is loading it SHALL
show a loading indicator and no stale rows. When no suite has a recorded completed run it SHALL show an
empty state saying runs appear here once their results are recorded. When the request fails it SHALL show an
error message announced as an alert, with a retry control that requests the same page again.

#### Scenario: Loading

- **WHEN** the run trends request is in flight
- **THEN** the table area shows a loading indicator

#### Scenario: No recorded runs

- **WHEN** the endpoint returns an empty page and a total of 0
- **THEN** the table shows an empty state saying a run appears once its results are recorded

#### Scenario: The request fails

- **WHEN** the run trends request fails
- **THEN** the table area shows an error message announced as an alert
- **AND** the cards above it are unaffected

#### Scenario: Retry

- **WHEN** the user activates retry after a failure
- **THEN** the same page is requested again
- **AND** it shows the loading indicator until the page returns

### Requirement: Run trends placement

The Evaluation Run Trends table SHALL share a row with a placeholder for the Test Suite Health Distribution
chart. On a standard screen (the width at which the card rows switch to four columns, and wider) the table
SHALL take the left half of the row and the placeholder the right half. On a narrower screen they SHALL stack
at full width, the table first. The placeholder SHALL show its title and a loading-style skeleton, and SHALL
carry no data.

#### Scenario: Standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the Evaluation Run Trends table takes the left half of its row
- **AND** a placeholder titled Test suite health distribution takes the right half, showing a skeleton

#### Scenario: Small screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Evaluation Run Trends table takes the full width
- **AND** the placeholder is shown below it, also at full width
