## Purpose

Defines the page's single tabbed breakdown table — the tab sets each view offers, what each tab
counts and states about it, the share of calls and its normalization, the change each measure
states and when a row may be called new, server-side top-N, the full-list dialog with its paged
reads and its search, and the side panel a row opens.

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

### Requirement: Rows state their share of the window as a figure

Every tab SHALL render, per row, the dimension value, its `Share of calls`, its call count, and the
tab's own extra measures. `Share of calls` SHALL be the row's calls divided by **the sum of all rows
in the window for that dimension** — including rows beyond the shown top-N — never by the largest
row's calls. A share MUST NOT be rendered such that the top row reads as 100% while accounting for a
fraction of the traffic.

The share SHALL be stated as a figure, not as a bar. Rows arrive ranked by calls, so a bar's length
only ever descends and restates the ranking, while taking a column's width to do it.

Every column SHALL take an equal share of the table's width, and every figure SHALL end on its
cell's right edge, so a column reads down as one set of numbers. Each measure carries its own change
beside it, so the columns hold figures of one kind and deserve one width.

Rows SHALL be ordered by calls, descending, with ties broken by the dimension value so repeated
renders of one window agree. That order is the backend's and the table offers no control over it,
so the header SHALL NOT claim a sort state: `aria-sort` belongs to a column a reader can reorder,
and announcing one that cannot be changed offers an interaction that does not exist.

#### Scenario: Share is relative to the window total

- **GIVEN** the window carries 204 calls across seven deployments, the largest of which carries 81
- **WHEN** the `Deployments` tab renders
- **THEN** the largest row's share reads as its portion of 204, not as 100%

#### Scenario: The share is a figure

- **WHEN** a row renders its share
- **THEN** it states the percentage as a figure and draws no bar

#### Scenario: Shares account for rows beyond the top-N

- **GIVEN** more rows exist than are shown
- **WHEN** the shown rows render
- **THEN** their shares sum to less than 100%
- **AND** each share is computed against the full window total

#### Scenario: No column claims a sort a reader cannot change

- **WHEN** the table renders ordered by calls
- **THEN** no column header announces a sort state

### Requirement: Each measure states its own change beside it

When comparison is on, every measure a row states — its calls, its error rate, its average latency
and its cost — SHALL state its own change from the previous window, in the same cell, as the ratio of
that measure's own previous value. The change SHALL be read from the previous-window response,
matched to the row by its dimension value.

There SHALL be no delta column of its own. One column can compare only one measure, and standing
beside `Cost` it read as a change in money while it was counting calls. Each change SHALL carry the
direction its own measure gives it — more calls read as growth, more spend, more errors and more
latency do not — in the same pill the KPI cards state their change in, so one change reads the same
way page-wide.

The figure SHALL end on the cell's right edge, like every other number in the table, and the change
SHALL sit in a track of its own beside it, right-aligned — so the figures read down as one set and
the changes as another, while each change still touches the figure it belongs to. Letting the
change's own width place the figure left both columns ragged.

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

When comparison is off, no change SHALL be stated.

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

#### Scenario: Each measure compares itself

- **GIVEN** comparison is on and a row's cost doubled while its calls halved
- **WHEN** the table renders
- **THEN** the cost cell states a rise and the calls cell a fall
- **AND** the rise in cost is toned as unwelcome while a rise in calls would be welcome

#### Scenario: No delta column is rendered

- **GIVEN** comparison is on
- **WHEN** the table renders
- **THEN** no column of its own states the change

#### Scenario: Figures line up whatever the changes beside them

- **GIVEN** one row states a change and the next has none to state
- **WHEN** the table renders
- **THEN** both figures end on the same line, and so do the changes beside them

#### Scenario: Nothing is stated when comparison is off

- **GIVEN** comparison is off
- **WHEN** the table renders
- **THEN** no cell states a change

### Requirement: Top-N is answered by the backend and the dialog holds the full list

The card SHALL show the ranked head of the dimension — ten rows — offering a `View all` affordance
that opens the full list in a dialog. Both the card's page and the full list SHALL be ordered and
limited by the backend, not by trimming a client-side list.

Neither surface SHALL offer column sorting or per-column filters. The card holds one ranked page, so
both would reorder or sieve that page while hiding that the rest of the dimension was never fetched.
The dialog reads the whole dimension, but block by block, so a filter there would sift the blocks it
has read and silently miss the rest.

The card SHALL NOT offer a search field either: a term pushed into the aggregate re-ranks the whole
window and answers with rows the card never loaded, so the field read as a page that reorders
itself. Finding a row outside the head is the dialog's job.

#### Scenario: The card states ten rows and offers the full list without counting it

- **GIVEN** the window contains more rows than the bound
- **WHEN** the table renders
- **THEN** it offers `View all`
- **AND** it states no row count, since the count it holds is the count of its own page

#### Scenario: No column offers a filter on either surface

- **WHEN** the card renders
- **THEN** its columns offer no filter
- **WHEN** the full-list dialog opens
- **THEN** its columns offer no filter either, and it offers a search over the dimension

#### Scenario: The card offers no search field

- **WHEN** the card renders
- **THEN** no search field is present
- **AND** switching tab issues the tab's own request and nothing else

#### Scenario: A row outside the head is reached through the dialog

- **GIVEN** a deployment ranks below the card's ten rows
- **WHEN** the user opens `View all` and searches for its name
- **THEN** the row is listed

### Requirement: The dialog reads the dimension a block at a time

The dialog SHALL read its rows in blocks as it is scrolled, not as one page: a dimension can hold
more rows than the query surface will answer at once, and a reader who opened the dialog to look at
the head should not wait for the tail.

The dialog SHALL offer one search field over the dimension, answered by the backend and matched
case-insensitively, so a term reaches values no block has read. The term SHALL be debounced before
it becomes a request, since the field reports every keystroke, and SHALL be part of what identifies
the list: a new term drops the blocks in hand and reads from the first one again. Closing the dialog
SHALL clear it.

The ranking SHALL carry the dimension as its last key, so a block is a stable slice of it: two rows
holding the same figure would otherwise be free to come back in either order, and the same row could
arrive in two blocks or in none.

While a block is in flight the dialog SHALL say so with a spinner over the rows, not in place of
them: a block read on scroll leaves the rows above it on screen, and replacing the grid would drop
the reader back to the top of the list.

An empty result in the dialog SHALL be stated by the grid's own no-rows message: there the emptiness
is a term that matched nothing, while the card's message names a period with no traffic — wrong, and
drawn on top of the grid's own answer.

The card's empty state SHALL name no period. The page states its window in the time filter above,
and repeating it inside the card bought a second copy of that reading, its own formatting and three
props threaded through the grid.

A fallback bucket SHALL keep its ranked place in the dialog rather than being pinned last as it is
on the card: a block is 25 rows of a longer list, so pinning moves the bucket to the end of its own
block, which is a position in the middle of the list.

The delta SHALL be read per block, by asking the previous window for that block's own dimension
values. A block is a position in this window's ranking, which the previous window does not share, so
the values are asked for by name. A row the previous window does not answer for SHALL state no
comparison rather than being called new, and a fallback bucket — whose value is an absence rather
than a name — SHALL state none either.

#### Scenario: Scrolling reads the next block

- **GIVEN** the dialog is open on a dimension holding more rows than one block
- **WHEN** the reader scrolls past the loaded rows
- **THEN** the next block is read at its offset
- **AND** the rows already shown are not re-read

#### Scenario: A block in flight is stated over the rows

- **GIVEN** the dialog has rows on screen and is reading the next block
- **WHEN** the grid renders
- **THEN** a spinner is shown over those rows
- **AND** the rows already read stay where they are

#### Scenario: The search reaches the whole dimension

- **GIVEN** the dialog is open
- **WHEN** the reader searches for a value ranked below every loaded block
- **THEN** the rows are read again from the first block, narrowed by that term
- **AND** the matching row is listed

#### Scenario: A term that matches nothing is stated by the grid

- **GIVEN** the dialog is open and searched for a value no row carries
- **WHEN** the grid renders
- **THEN** the grid's own no-rows message is shown
- **AND** the card's own empty message is not

#### Scenario: Closing the dialog clears the term

- **GIVEN** the dialog is open with a term typed
- **WHEN** the reader closes it and opens it again
- **THEN** the field is empty and the whole dimension is listed

#### Scenario: A block states its own comparison

- **GIVEN** comparison is on and the dialog is open
- **WHEN** a block of rows is read
- **THEN** the previous window is asked for those rows by name
- **AND** a row it does not answer for states no delta

### Requirement: Only the dialog and its blocks issue further requests

`View all`, a scroll to the next block, and a term typed into the dialog's search SHALL be the only
interactions on this table that issue a request.

#### Scenario: Reading the table issues nothing beyond its blocks

- **GIVEN** the dialog is closed
- **WHEN** the reader opens a row detail panel and dismisses it
- **THEN** no request is issued

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
name. The panel SHALL be dismissible, and dismissing it SHALL leave the table's tab and scroll
position unchanged.

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

- **GIVEN** the user has switched tab before opening a row
- **WHEN** the panel is dismissed
- **THEN** the tab is unchanged

### Requirement: A tool row names the MCP servers it aggregates

A tool name is not unique across servers — the same `get_me` lives on dozens of toolsets — so a row
on the `Tools` tab SHALL state which server its calls were made on, under the tool's own name. One
server SHALL be named outright; several SHALL be counted, with the names the response carried
available in a tooltip.

The names SHALL be read as part of the tab's own request rather than a second one, and SHALL be
capped, with the total taken separately: a capped list cannot say how many it left out.

A name SHALL be shown as a reader can take it in — without the `toolsets/` prefix, which the column
already implies, and with Core's own percent-escapes decoded. A name that is not valid encoding SHALL
be shown as it stands rather than dropped.

#### Scenario: One server is named

- **GIVEN** a tool was called on a single MCP server
- **WHEN** the row renders
- **THEN** that server's name is stated under the tool's

#### Scenario: Several servers are counted

- **GIVEN** a tool was called on more than one server
- **WHEN** the row renders
- **THEN** the count of servers is stated under the tool's name
- **AND** the names the response carried are available in a tooltip

#### Scenario: Other tabs state no server

- **GIVEN** the `MCP Servers` tab, whose dimension is the server itself
- **WHEN** a row renders
- **THEN** it states no second name

### Requirement: Missing dimension values carry the shared fallback labels

A row whose dimension value is missing — falsy or the literal string `undefined` — SHALL render its
dimension's fallback label: `No Project` on the `Projects` tab, for a call made outside any project,
`Direct call` on the `Applications` tab, for a call with no calling deployment, and `Other methods`
on the `Tools` tab, for an MCP call that names no tool. Each SHALL carry a tooltip stating the
cause, and the `Direct call` tooltip SHALL be specific to the active view, because an LLM call with
no parent was made against the model directly while an MCP call with no parent came from a try-out.

The `Tools` fallback is not a rare row: the MCP transport logs a protocol method — `initialize`,
`tools/list`, a notification — the same way it logs `tools/call`, and those outnumber the tool calls
by roughly three to one. It is labelled rather than filtered out, because the tab's share is
normalized against the window total and dropping the rows from the tab alone would leave the
percentages summing to a fraction of the window. It SHALL instead be pinned below the ranked rows,
so the bucket nobody came for does not take the head of the page, and its tooltip SHALL point at
`View all` for the full list. On every other tab a fallback row SHALL keep its ranked place.

Both labels SHALL be localized, SHALL be presentational — the underlying value is unchanged — and
SHALL be what a copied cell carries. The literal text `undefined` SHALL never be rendered, on any
tab, in the side panel, or in a copied cell.

#### Scenario: Missing project renders No Project

- **WHEN** a row on the `Projects` tab has no project value
- **THEN** the cell renders `No Project` with its tooltip

#### Scenario: Missing parent deployment renders Direct call

- **WHEN** a row on the `Applications` tab has no calling deployment value
- **THEN** the cell renders `Direct call` with the tooltip its view defines

#### Scenario: An MCP call naming no tool renders Other methods, last

- **GIVEN** the MCP view's `Tools` tab
- **WHEN** a row has no tool-call name, because its calls are protocol methods
- **THEN** the cell renders `Other methods` with a tooltip naming those methods and pointing at
  `View all`
- **AND** the row sits below every ranked tool, whatever its calls

#### Scenario: A fallback row on another tab keeps its rank

- **GIVEN** the `Applications` tab, whose fallback bucket outranks every named row
- **WHEN** the table renders
- **THEN** `Direct call` sits in its ranked place

#### Scenario: Side panel uses the same fallback

- **WHEN** a row carrying a fallback label is opened
- **THEN** the panel's title carries the same label
- **AND** the literal text `undefined` is not shown
