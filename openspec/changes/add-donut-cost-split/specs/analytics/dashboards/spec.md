## MODIFIED Requirements

### Requirement: The donut shows the top five plus a residual slice

The dashboard SHALL render a donut splitting the current window across the five highest entities of
the active view's primary dimension, with every remaining entity folded into one `Other` slice.
Slices SHALL be ordered by value, descending, and `Other` SHALL always render last regardless of its
size.

The measure it splits by SHALL be the one the reader selects — see the requirement below. Each slice
SHALL state its entity and its share of the window's total **of that measure**. The donut's centre
SHALL state that same total, so the shares have a denominator on screen.

`Other` SHALL state how many entities it folds, so a reader can tell a long tail from a sixth
entity. When five or fewer entities exist, no `Other` slice SHALL be rendered.

#### Scenario: Long tail folds into Other

- **GIVEN** the window contains twelve deployments
- **WHEN** the donut renders
- **THEN** it shows five named slices and one `Other` slice
- **AND** `Other` states that it folds seven entities

#### Scenario: Other renders last even when large

- **GIVEN** `Other` carries a larger share than any named slice
- **WHEN** the donut renders
- **THEN** `Other` is still the last slice

#### Scenario: Few entities render without Other

- **GIVEN** the window contains three deployments
- **WHEN** the donut renders
- **THEN** it shows three slices and no `Other` slice

#### Scenario: Centre states the denominator

- **WHEN** the donut renders
- **THEN** its centre states the window's total of the selected measure

## ADDED Requirements

### Requirement: The share chart splits by calls or by cost, and the backend ranks on the choice

The share chart SHALL offer the measure it splits by: `Calls` and `Cost`. `Calls` SHALL be listed
first and SHALL be the selection the card opens with, so the default reading is unchanged.

The MCP view SHALL offer no such choice and SHALL split by calls alone: no `mcp` row carries a
price, so a cost ring there would be empty whatever the window. Switching the view SHALL return the
selection to `Calls`.

Choosing a measure SHALL re-issue the chart's ranking request **ordered by that measure**. The top-N
cut is taken by the backend, so a ring ranked on calls and rendered on spend would show the five
busiest entities' money rather than the five costliest entities — re-sorting the returned page
cannot recover the rows the cut already dropped. This adds no new request shape: it is the same
ranking request the page already issues, as a breakdown tab switch is.

The ring's values, its denominator, its centre figure and the card's legend SHALL all follow the
selected measure, and a money figure SHALL carry its currency marker wherever it is stated.

The full-list dialog SHALL state **both** measures on every row, whichever one the reader opened it
with, because the list has room for two figures where the card has room for one — and a reader deep
in the long tail should not have to close the dialog to learn what a row costs. The rows SHALL keep
the order the ring was ranked by, which is the measure the reader arrived with. Where a view prices
nothing, the dialog SHALL state its single figure as the card does.

While the re-ranking is being read, the chart SHALL keep the figures it already has rather than
emptying: a ring replaced by a loader collapses the card to a fraction of its height and moves every
widget below it. The figures SHALL state the measure they were **ranked by**, not the one just
selected, so the interim reading is a correct picture of the old measure rather than a wrong one of
the new. The selection flips the figures when its rows arrive.

#### Scenario: Cost is offered in the LLM view

- **WHEN** the share chart renders in the LLM view
- **THEN** it offers both `Calls` and `Cost`
- **AND** `Calls` is the selected measure

#### Scenario: The MCP view offers no cost split

- **WHEN** the share chart renders in the MCP view
- **THEN** it offers no cost measure

#### Scenario: Choosing cost re-ranks on the backend

- **GIVEN** the share chart is split by calls
- **WHEN** the reader selects `Cost`
- **THEN** the ranking request is re-issued ordered by spend
- **AND** the ring names the costliest entities rather than the busiest ones

#### Scenario: The board does not move while the re-ranking is read

- **GIVEN** the share chart is split by calls
- **WHEN** the reader selects `Cost` and the request is still in flight
- **THEN** the ring still states its call figures
- **AND** the card keeps its height

#### Scenario: A cost ring states money

- **GIVEN** the share chart is split by cost
- **WHEN** it renders
- **THEN** its centre and each legend row state a money figure with its currency marker

#### Scenario: The dialog states both measures at once

- **GIVEN** the share chart is split by calls
- **WHEN** the reader opens the full list
- **THEN** each row states both its call count and its cost
- **AND** the list keeps the order the ring was ranked by

#### Scenario: Switching view returns the measure to calls

- **GIVEN** the share chart is split by cost in the LLM view
- **WHEN** the reader switches to the MCP view
- **THEN** the chart splits by calls

### Requirement: A tool row is one tool on one server

The `Tools` tab SHALL group by the MCP server as well as the tool name, and each row SHALL state the
server it belongs to under the name. A tool name does not identify a tool: `execute_python` exists
on several servers, and folding them into one row sums unrelated work under a name that reads like
one thing.

A row's identity SHALL carry both keys, so two servers' same-named tools are two rows wherever rows
are matched by id — the previous window's figures among them.

#### Scenario: One tool name on two servers is two rows

- **GIVEN** two MCP servers each expose a tool called `execute_python`
- **WHEN** the `Tools` tab renders
- **THEN** it shows two rows
- **AND** each names its own server

#### Scenario: A tab without a qualifier is unchanged

- **WHEN** the `Models` tab renders
- **THEN** its rows are grouped by the deployment alone
