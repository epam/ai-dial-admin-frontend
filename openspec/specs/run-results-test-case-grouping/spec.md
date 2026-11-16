# run-results-test-case-grouping Specification

## Purpose

Defines how the run Extraction result grid groups its rows by test case: when grouping applies, how groups and
their rows are laid out and ordered, how a group is expanded and collapsed, the switch that turns grouping on
and off, and what stays unavailable while the grid is grouped.

## Requirements

### Requirement: Grouping applies to runs whose results vary by run number, request or turn

The Extraction result grid SHALL be able to group by test case when the run's results differ in at least one
of `# Run number`, `Request` or `Turn` — the same condition under which at least one of those columns is
shown by default. The condition SHALL be evaluated once for the whole run's results, not per test case. For a
run in which all three are uniform, the grid SHALL show the flat list, offer no grouping switch, and show no
group rows.

#### Scenario: A multi-turn run can be grouped

- **WHEN** the run has test cases with more than one turn
- **THEN** the grid offers grouping by test case

#### Scenario: A multi-run suite can be grouped

- **WHEN** the run's test cases each executed with run numbers 1 and 2
- **THEN** the grid offers grouping by test case

#### Scenario: A multi-request suite can be grouped

- **WHEN** the run's test cases each produced more than one request
- **THEN** the grid offers grouping by test case

#### Scenario: A uniform run stays flat

- **WHEN** every result of the run has the same run number, request and turn
- **THEN** the grid shows the flat list with no group rows and no grouping switch

#### Scenario: Grouping is decided for the whole run

- **WHEN** only some test cases of the run have more than one turn
- **THEN** every test case of the run is shown as a group, including those with a single result row

### Requirement: A switch turns grouping on and off

When grouping applies, the Extraction result tab SHALL show a **Group by test case** switch next to the
Columns button. Grouping SHALL be off when the grid first opens, so the grid opens as the flat list the user
knows. Turning the switch on SHALL show the groups; turning it off SHALL show the flat list of result rows
with no group rows again. The switch state SHALL survive switching to another tab of the run view and back,
and SHALL start off again for a different run. It SHALL NOT be stored beyond the open run view. The switch
SHALL be absent on other tabs and whenever grouping does not apply.

#### Scenario: Off by default

- **WHEN** the Extraction result grid opens for a run to which grouping applies
- **THEN** the `Group by test case` switch is off and the grid shows the flat list with no group rows

#### Scenario: Turning the switch on

- **WHEN** the user turns the switch on
- **THEN** the grid shows the groups, one group row per test case followed by its result rows

#### Scenario: Turning the switch back off

- **WHEN** the user turns the switch off again
- **THEN** the grid shows one row per result with no group rows, and the columns are sortable and filterable again

#### Scenario: The choice survives a tab change

- **WHEN** the user turns the switch on, opens the Summary tab and returns to Extraction result
- **THEN** the switch is still on and the rows are still grouped

#### Scenario: No switch when grouping does not apply

- **WHEN** the run's results are uniform in run number, request and turn
- **THEN** no `Group by test case` switch is shown

#### Scenario: No switch on other tabs

- **WHEN** the user opens the Summary tab
- **THEN** no `Group by test case` switch is shown

### Requirement: Each test case is shown as a group header row followed by its results

While grouped, the grid SHALL show, for each test case, one **group row** carrying the test case name,
followed by that test case's result rows. A test case SHALL be identified by its id, or by its name when it
has no id. Groups SHALL be ordered alphabetically by test case name. Result rows inside a group SHALL be in
natural order: by run number, then request, then turn, and rows equal on all three SHALL keep the order they
were returned in. A group row SHALL show no value in the Execution position, `HTTP`, `Duration`, metric,
input-binding or extracted columns. The group row SHALL look different from result rows so that the two are
distinguishable without relying on color alone.

#### Scenario: Results follow their group row

- **WHEN** the grid is grouped and test case `test-weather` has six results
- **THEN** a group row named `test-weather` is followed by its six result rows, and no result row of another test case sits between them

#### Scenario: Natural order inside a group

- **WHEN** a test case's results arrive as (run 2, request 1, turn 1), (run 1, request 2, turn 1) and (run 1, request 1, turn 2)
- **THEN** its result rows are shown as (run 1, request 1, turn 2), (run 1, request 2, turn 1), (run 2, request 1, turn 1)

#### Scenario: Groups are alphabetical

- **WHEN** the run has test cases `test-weather` and `test-context`
- **THEN** the `test-context` group is shown before the `test-weather` group

#### Scenario: Group rows carry no request data

- **WHEN** the grid is grouped
- **THEN** a group row's `# Run number`, `Request`, `Turn`, `HTTP`, `Duration`, metric and extracted cells are empty

#### Scenario: A group row is distinguishable without color

- **WHEN** a screen reader reaches a group row and a result row
- **THEN** the group row is exposed as a group named after the test case, which the result row is not

### Requirement: A group row's overall score belongs to the test case

While grouped, the group row's Overall score cell SHALL show the test case's overall score with the same
rounding, threshold icon, tooltip and missing-score rendering as the flat list (see
`run-results-overall-score`). Result rows inside a group SHALL leave their Overall score cell empty — not a
dash and not the score — so the score is read as belonging to the test case rather than to a request. While
grouped, the Overall score column SHALL remain shown whatever its values.

#### Scenario: The score sits on the group row

- **WHEN** a grouped test case scored 0.7 and the threshold is 0.6
- **THEN** its group row shows `0.7` with the above-threshold icon in the Overall score column

#### Scenario: Result rows carry no score

- **WHEN** a group is expanded
- **THEN** the Overall score cell of each of its result rows is empty

#### Scenario: A test case without a score

- **WHEN** a grouped test case has no overall score
- **THEN** its group row shows a dash with no icon and its result rows are empty

#### Scenario: Flat list is unchanged

- **WHEN** grouping is switched off
- **THEN** every result row shows its test case's overall score again

### Requirement: Groups can be collapsed and expanded

Every group row SHALL have a button that collapses or expands the group. The buttons SHALL sit in a dedicated
narrow **toggle column** fixed at the far left of the grid, in front of the status column. The toggle column
SHALL be pinned, SHALL NOT be movable, resizable or hideable by the user, SHALL NOT be listed in the columns
panel, and SHALL exist only while the grid is grouped. Its cell on a result row SHALL be empty, so the status
and name cells of a result row line up with those of the group row, and the group row's test case name stays
in the Test Case name column. All groups SHALL start expanded. Collapsing a group SHALL hide its result rows
and keep its group row; expanding SHALL show them again in the same order. The button SHALL expose its state
to assistive technology (expanded or collapsed) and SHALL have an accessible name saying whether it collapses
or expands the group. The button SHALL be operable from the keyboard, and keyboard focus SHALL stay on the
button of the toggled group, so the next key press toggles it again without tabbing back. Which groups are
collapsed SHALL survive switching to another tab of the run view and back, and SHALL be forgotten when the
run changes.

#### Scenario: The toggle sits in a fixed column at the far left

- **WHEN** the grid is grouped
- **THEN** each group row's toggle button is in a narrow column at the far left of the grid, before the status column, and the result rows' cells in that column are empty

#### Scenario: The toggle column cannot be moved or hidden

- **WHEN** the grid is grouped and the user opens the columns panel or drags another column over the toggle column
- **THEN** the toggle column is not listed in the panel, and it stays first at the far left

#### Scenario: The flat list has no toggle column

- **WHEN** grouping is switched off
- **THEN** no toggle column is shown and the status column is the first column again

#### Scenario: Names line up across group and result rows

- **WHEN** the grid is grouped
- **THEN** the group row's test case name and the result rows' test case names start at the same left edge in the Test Case name column

#### Scenario: Groups start expanded

- **WHEN** grouping is switched on for the first time
- **THEN** every group shows its result rows and its button reads as collapsing the group

#### Scenario: Collapsing a group

- **WHEN** the user activates the button of an expanded group
- **THEN** that group's result rows are hidden, its group row stays, and the other groups are unchanged

#### Scenario: Expanding a group

- **WHEN** the user activates the button of a collapsed group
- **THEN** its result rows are shown again in run → request → turn order

#### Scenario: State is exposed programmatically

- **WHEN** a group is collapsed
- **THEN** its button reports that it is not expanded and is named as expanding the group

#### Scenario: Keyboard operation

- **WHEN** focus is on a group's button and the user presses Enter or Space
- **THEN** the group toggles, and focus stays on that group's button so a further key press toggles it again

#### Scenario: Collapsed state survives a tab change

- **WHEN** the user collapses a group, opens the Summary tab and returns
- **THEN** the group is still collapsed

#### Scenario: Collapsed state is kept when grouping is toggled

- **WHEN** the user collapses a group, turns grouping off and turns it on again
- **THEN** the group is still collapsed

### Requirement: Sorting and filtering are unavailable while grouped

While grouped, no column SHALL be sortable and no column SHALL offer a filter, and no floating filter SHALL be
shown. A sort or filter applied before grouping was turned on SHALL be cleared when grouping turns on, so no
hidden sort or filter changes the group order or removes rows from a group. Turning grouping off SHALL make
columns sortable and filterable again, starting with no sort and no filter applied.

#### Scenario: Header sort is unavailable

- **WHEN** the grid is grouped and the user activates a column header
- **THEN** the row order does not change

#### Scenario: No filter inputs

- **WHEN** the grid is grouped
- **THEN** the Test Case name column shows no floating filter input

#### Scenario: A previous sort or filter is cleared

- **WHEN** the user filtered the flat list by test case name and then turns grouping on
- **THEN** all groups are shown, each with all of its result rows

#### Scenario: Sorting returns in the flat list

- **WHEN** the user turns grouping off
- **THEN** the columns can be sorted and filtered as before this change

### Requirement: Group rows do not open row details

Activating a group row — clicking its cells or the row — SHALL NOT open the row detail panel and SHALL NOT
change which result is selected. Activating a result row, or any of its cells including the empty Overall
score cell, SHALL open the row detail panel for that result as in the flat list. Collapsing the group that
contains the selected result SHALL leave the open panel as it is.

#### Scenario: Clicking a group row

- **WHEN** the user clicks a group row's name cell outside its button
- **THEN** no row detail panel opens

#### Scenario: Clicking a result row

- **WHEN** the user clicks a result row inside an expanded group
- **THEN** the row detail panel opens for that result

#### Scenario: Clicking an empty score cell

- **WHEN** the user clicks the empty Overall score cell of a result row
- **THEN** the row detail panel opens for that result

#### Scenario: Collapsing the selected result's group

- **WHEN** the row detail panel is open for a result and the user collapses the group that contains it
- **THEN** the panel stays open for that result
