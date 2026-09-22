# dashboard-share-breakdown Specification

## Purpose

Defines the dashboard's share donut: how call volume splits across the top few entities of the
active view, with the remainder folded into a single residual slice, and how its dialog lists the
rest of the dimension.

## Requirements

### Requirement: The donut shows the top five plus a residual slice

The dashboard SHALL render a donut splitting the current window's calls across the five highest
entities of the active view's primary dimension, with every remaining entity folded into one
`Other` slice. Slices SHALL be ordered by value, descending, and `Other` SHALL always render last
regardless of its size.

Each slice SHALL state its entity and its share of the window's total calls. The donut's centre
SHALL state the window's total, so the shares have a denominator on screen.

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
- **THEN** its centre states the window's total call count

### Requirement: The dialog lists the whole dimension, a block at a time

`View all` SHALL open a dialog listing the dimension beyond the ring's five slices, reading it in
blocks as the list is scrolled rather than in one page.

The ring in that dialog SHALL draw every row read so far, not the card's five. The dialog is where
the long tail is being read, and a ring that kept folding it into one slice would answer the
question the card already answered. Its residual is therefore the window's total minus the rows
read, and SHALL shrink as the legend reads further.

The dialog's own filter SHALL narrow the list and never the ring, and SHALL apply to the rows read so
far: it is a way to find an entity in a list that is already open, not a second reading of the
window.

While a block is in flight the dialog SHALL say so with a spinner under the list, so the rows
already read stay where the reader left them.

#### Scenario: A block in flight is stated under the list

- **GIVEN** the dialog is reading the next block
- **WHEN** it renders
- **THEN** a spinner is shown under the list
- **AND** it is gone once the block has arrived

#### Scenario: Scrolling the list reads further into the dimension

- **GIVEN** the dialog is open on a dimension holding more entities than one block
- **WHEN** the reader scrolls the list to its end
- **THEN** the next block of entities is read and listed

#### Scenario: The ring draws what the list has read

- **GIVEN** the dialog has read several blocks
- **WHEN** the ring renders
- **THEN** every row read so far is a slice of it
- **AND** its residual is the window's total minus those rows

#### Scenario: Nothing further is read once the dimension ends

- **GIVEN** the dialog has read every entity of the dimension
- **WHEN** the reader scrolls the list to its end again
- **THEN** no further request is issued

### Requirement: Shares are computed against the window total, and ties are ordered stably

A slice's share SHALL be its calls divided by the sum of all the window's calls, including the
entities folded into `Other` — never against the largest slice. The shares of all rendered slices
SHALL therefore sum to the whole.

Entities tied on value SHALL be ordered by name so that repeated renders of the same window produce
the same donut, and the five-slice cut SHALL be taken after that ordering, so a tie at the boundary
resolves the same way every time.

An entity with a missing name SHALL render the same fallback label the breakdown table uses for that
dimension, never the literal text `undefined`.

#### Scenario: Shares sum to the whole

- **WHEN** the donut renders with an `Other` slice
- **THEN** the shares of the five named slices and `Other` sum to 100%

#### Scenario: Share is not relative to the largest slice

- **GIVEN** the largest entity accounts for two fifths of the window's calls
- **WHEN** the donut renders
- **THEN** its slice states two fifths, not the whole

#### Scenario: Ties resolve identically across renders

- **GIVEN** two entities at the five-slice boundary carry equal call counts
- **WHEN** the donut is rendered twice over the same window
- **THEN** the same entity is named in both renders

#### Scenario: Missing name uses the shared fallback label

- **GIVEN** a slice's entity name is missing
- **WHEN** the donut renders
- **THEN** the slice carries the dimension's fallback label
- **AND** the literal text `undefined` is not shown

### Requirement: Hovering a slice answers which slice it is

Hovering a slice SHALL keep that slice's colour and fade the others, so the ring answers which slice
the cursor is on. The hovered slice SHALL NOT grow: scaling it moves the ring's edge under the
cursor, which reads as the pointer having left the slice it is on.

#### Scenario: The hovered slice is the only one at full strength

- **WHEN** the cursor rests on a slice
- **THEN** that slice keeps its colour and the others fade
- **AND** the ring's geometry does not change

### Requirement: The donut follows the view's primary dimension

The donut's dimension SHALL be the active view's leading breakdown dimension — models in the LLM
view, MCP servers in the MCP view — matching the breakdown table's default tab, so the two widgets
never disagree about what the page is about.

The donut SHALL read that dimension from a request of its own rather than from the breakdown
table's. Sharing the table's response would make the ring reload, and change what it splits by,
every time a reader switched the tab below it.

#### Scenario: Donut and table agree on dimension

- **WHEN** a view loads
- **THEN** the donut splits by the same dimension the breakdown table's default tab lists

#### Scenario: Switching view switches the dimension

- **GIVEN** the donut splits by model
- **WHEN** the user switches `View by` to MCP
- **THEN** the donut splits by MCP server

#### Scenario: Switching the breakdown tab leaves the donut alone

- **GIVEN** the donut splits by model
- **WHEN** the user selects the Projects tab in the breakdown table
- **THEN** the donut still splits by model
- **AND** it issues no request
