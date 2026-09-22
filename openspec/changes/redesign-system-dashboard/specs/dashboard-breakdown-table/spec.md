## Purpose

Defines the page's single tabbed breakdown table — the tab sets each view offers, what each tab
counts and states about it, the share-of-calls bar and its normalization, the delta column and when
a row may be called new, server-side top-N and search, the full-list dialog, and the side panel a
row opens.

## ADDED Requirements

### Requirement: One tabbed table replaces the per-dimension grids

Each view SHALL render a single breakdown table whose tabs select the dimension its rows are grouped
by. The tab sets SHALL be:

- **LLM view**: `Models`, `Applications`, `Projects`
- **MCP view**: `MCP Servers`, `Tools`, `Applications`, `Projects`

The first tab of each set SHALL be the default. Switching tab SHALL issue exactly one request — the
tab request of [[dashboard-query-consolidation]], grouped by that tab's dimension and ordered and
limited server-side — and SHALL NOT re-issue the view's other requests. A tab is grouped and ranked
by the backend rather than regrouped on the client because a top-N taken over rows grouped by every
dimension at once ranks combinations, not the dimension the tab is about.

The selected period SHALL apply to every tab.

#### Scenario: Default tab is the view's leading dimension

- **WHEN** the MCP view loads
- **THEN** the breakdown table shows the `MCP Servers` tab
- **AND** tabs for `Tools`, `Applications` and `Projects` are offered

#### Scenario: Switching tab issues exactly one request

- **GIVEN** the breakdown table has rendered
- **WHEN** the user selects another tab
- **THEN** one request is issued per window, grouped by the new tab's dimension
- **AND** the view's totals, bucketed and leading-dimension responses are reused

### Requirement: Each tab states what it counts and what one row aggregates

The table SHALL state, for the active tab, which field the dimension is read from and what a single
row covers. A tab's name alone does not say it: `Applications` ranks the deployment that *called*
the model rather than applications that were called, and `Projects` ranks the project the calling
API key belongs to rather than a project the traffic was about. A reader who cannot tell which of
those a row is has no way to read the ranking.

The statement SHALL change with the tab, SHALL sit with the table's title rather than inside a
tooltip, and SHALL name the fallback bucket where the tab has one, so a row labelled `Direct call`
or `No Project` is explained where it is ranked.

#### Scenario: The statement follows the active tab

- **GIVEN** the `Models` tab is selected
- **WHEN** the user selects `Projects`
- **THEN** the table's description changes to the one describing projects

#### Scenario: A fallback bucket is explained where it is ranked

- **WHEN** the `Applications` tab is selected
- **THEN** its description names the bucket a call made directly against a model falls into

### Requirement: The LLM view states each row's cost

In the LLM view, every tab SHALL carry a cost column holding the sum of the row's prices over the
window, formatted as money like every other spend figure on the page. A row with no price SHALL
state no figure rather than a zero.

The MCP view SHALL NOT render the column: an `mcp` row carries no price at all, so the column would
be an empty one on every row rather than a measure.

#### Scenario: Cost is stated per row in the LLM view

- **WHEN** the `Models` tab renders in the LLM view
- **THEN** each row states its cost over the window

#### Scenario: The MCP view offers no cost column

- **WHEN** the `MCP Servers` tab renders
- **THEN** the table has no cost column

### Requirement: Rows carry a share bar normalized against the window total

Every tab SHALL render, per row, the dimension value, a `Share of calls` bar with its percentage,
the row's call count, and the tab's own extra measures. `Share of calls` SHALL be the row's calls
divided by **the sum of all rows in the window for that dimension** — including rows beyond the
shown top-N — never by the largest row's calls.

The bar's fill SHALL be proportional to that same share, so the bar and the percentage state one
fact. A share MUST NOT be rendered such that the top row reads as 100% while accounting for a
fraction of the traffic.

Rows SHALL be ordered by calls, descending, with ties broken by the dimension value so repeated
renders of one window agree. The column header SHALL expose the active sort programmatically.

#### Scenario: Share is relative to the window total

- **GIVEN** the window carries 204 calls across seven deployments, the largest of which carries 81
- **WHEN** the `Deployments` tab renders
- **THEN** the largest row's share reads as its portion of 204, not as 100%

#### Scenario: Bar and percentage agree

- **WHEN** a row renders
- **THEN** the bar's fill is proportional to the percentage shown beside it

#### Scenario: Shares account for rows beyond the top-N

- **GIVEN** more rows exist than are shown
- **WHEN** the shown rows render
- **THEN** their shares sum to less than 100%
- **AND** each share is computed against the full window total

#### Scenario: Sort is exposed programmatically

- **WHEN** the table renders ordered by calls
- **THEN** the calls column header states its sort direction to assistive technology

### Requirement: The delta column compares each row against the previous window

When comparison is on, each tab SHALL render a delta column stating the signed percentage change in
that row's calls from the previous window. The delta SHALL be read from the tab response's previous-window
measures, matched to the row by its dimension value.

A row absent from the previous window's response SHALL be called new only when that response was
the whole dimension — non-empty, and shorter than the page size it was asked for. When the previous
window recorded nothing at all, or its response was cut at the page size, the row's absence says
nothing: the table SHALL state no comparison for it rather than calling it new. A window with no
traffic would otherwise make every row look new, and a row ranked below the cut would be called new
while it had been there all along.

A row present in the previous window but absent from the current one SHALL NOT be added to the
table — the table lists the current window's rows — and its disappearance is instead visible in the
totals.

The delta SHALL carry its direction as a shape and as text, not as colour alone: an arrow, the
magnitude, and the direction spelled out for a screen reader.

When comparison is off, the column SHALL NOT be rendered, and the table SHALL NOT reserve space
for it.

#### Scenario: Delta matched by dimension value

- **GIVEN** comparison is on and a deployment appears in both windows
- **WHEN** its row renders
- **THEN** the delta states the signed change between the two windows' call counts

#### Scenario: A row new in this window reads as new

- **GIVEN** the previous window's response listed the whole dimension
- **AND** a model has calls in the current window and none in that response
- **WHEN** its row renders
- **THEN** the delta column marks it as new
- **AND** it shows no percentage

#### Scenario: An empty previous window makes no row new

- **GIVEN** the previous window recorded no calls at all
- **WHEN** the table renders
- **THEN** no row is marked new
- **AND** each states that there is no comparison

#### Scenario: A truncated previous response makes no row new

- **GIVEN** the previous window's response was cut at the page size
- **AND** a model in the current window is absent from it
- **WHEN** its row renders
- **THEN** it states no comparison rather than being marked new

#### Scenario: Column absent when comparison is off

- **GIVEN** comparison is off
- **WHEN** the table renders
- **THEN** no delta column is present

### Requirement: Top-N and search are answered by the backend

The table SHALL show a bounded number of rows, offering a `View all` affordance that opens the full
list in a dialog. Both the bounded page and the full list SHALL be ordered and limited by the
backend, not by trimming a client-side list.

Because the card holds one ranked page, it SHALL offer neither column sorting nor per-column
filters: both would reorder or sieve that page while hiding that the rest of the dimension was
never fetched. The dialog SHALL offer per-column filters, because there the page is the whole list.

Search SHALL be answered by the backend, matching the dimension value case-insensitively, so a
search reaches rows outside the shown top-N. The term SHALL be debounced before it becomes a
request, since the field reports every keystroke. A search that matches nothing SHALL render the
empty-result state and SHALL state the term that produced it.

Search and `View all` SHALL be the only interactions on this table that issue a request.

#### Scenario: The card offers the full list without counting it

- **GIVEN** the window contains more rows than the bound
- **WHEN** the table renders
- **THEN** it offers `View all`
- **AND** it states no row count, since the count it holds is the count of its own page

#### Scenario: Column filters are offered in the dialog only

- **WHEN** the card renders
- **THEN** its columns offer no filter
- **WHEN** the full-list dialog opens
- **THEN** its columns offer filters

#### Scenario: Search finds a row outside the shown page

- **GIVEN** a deployment ranks below the shown bound
- **WHEN** the user searches for its name
- **THEN** the request is re-issued with that term
- **AND** the row is listed

#### Scenario: Search is case-insensitive

- **WHEN** the user searches with different capitalization than the stored value
- **THEN** the row still matches

#### Scenario: No match states the term

- **WHEN** a search matches no row
- **THEN** the empty-result state names the searched term

### Requirement: A row opens a side panel detailing that row

Activating a row SHALL open a side panel for it, stating the dimension value as its title and
carrying: the row's calls, its share of the window, the request method where the dimension has a
single one, a requests-over-time chart for that row over the current window, and a list of the
row's child entities with their calls and share — routes for a deployment, tools for an MCP server,
models for a project.

The panel's share SHALL use the same normalization as the table's column, so the two never disagree
about one row's share.

Where the row's child dimension carries more than one method, the panel SHALL state the methods
rather than a single one, because a row with both a read and a write method has no single method to
name. The panel SHALL be dismissible, and dismissing it SHALL leave the table's tab, search and
scroll position unchanged.

#### Scenario: Panel opens with the row's figures

- **WHEN** the user activates a row
- **THEN** a side panel opens titled with the row's dimension value
- **AND** states its calls, its share, a requests-over-time chart and its child entities

#### Scenario: Panel share matches the table

- **WHEN** the panel is open
- **THEN** the share it states equals the share the row states in the table

#### Scenario: Multiple methods are stated as multiple

- **GIVEN** a row's calls span more than one request method
- **WHEN** the panel renders
- **THEN** it states the methods rather than naming one

#### Scenario: Dismissing preserves table state

- **GIVEN** the user has searched and switched tab before opening a row
- **WHEN** the panel is dismissed
- **THEN** the tab and the search term are unchanged

### Requirement: Missing dimension values carry the shared fallback labels

A row whose dimension value is missing — falsy or the literal string `undefined` — SHALL render its
dimension's fallback label: `No Project` on the `Projects` tab, for a call made outside any project,
and `Direct call` on the `Applications` tab, for a call with no calling deployment. Each SHALL
carry a tooltip stating the cause, and the `Direct call` tooltip SHALL be specific to the active
view, because an LLM call with no parent was made against the model directly while an MCP call with
no parent came from a try-out.

Both labels SHALL be localized, SHALL be presentational — the underlying value is unchanged — and
SHALL be what a copied cell carries. The literal text `undefined` SHALL never be rendered, on any
tab, in the side panel, or in a copied cell.

#### Scenario: Missing project renders No Project

- **WHEN** a row on the `Projects` tab has no project value
- **THEN** the cell renders `No Project` with its tooltip

#### Scenario: Missing parent deployment renders Direct call

- **WHEN** a row on the `Applications` tab has no calling deployment value
- **THEN** the cell renders `Direct call` with the tooltip its view defines

#### Scenario: Side panel uses the same fallback

- **WHEN** a row carrying a fallback label is opened
- **THEN** the panel's title carries the same label
- **AND** the literal text `undefined` is not shown
