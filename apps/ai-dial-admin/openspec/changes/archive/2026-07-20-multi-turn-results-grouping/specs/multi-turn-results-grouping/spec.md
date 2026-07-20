## ADDED Requirements

### Requirement: Result rows grouped into conversations by multiTurnId
The run results grid SHALL group flat result rows into logical conversations by their top-level
`multiTurnId`. Rows sharing a non-empty `multiTurnId` form one multi-turn conversation whose turns
are ordered by `turnIndex`; a row without a `multiTurnId` is a single-turn result. The results
payload is otherwise unchanged.

#### Scenario: Results sharing a multiTurnId form one conversation
- **WHEN** two or more result rows share the same non-empty `multiTurnId`
- **THEN** they are displayed as one multi-turn conversation whose turns are ordered by `turnIndex`

#### Scenario: Result without multiTurnId is single-turn
- **WHEN** a result row has no `multiTurnId`
- **THEN** it is displayed as a single-turn result (one row, no expander)

#### Scenario: Single-turn results stack at the top
- **WHEN** the results grid contains both single-turn results and multi-turn conversations
- **THEN** all single-turn results are ordered ahead of the multi-turn conversations, each partition
  keeping its first-appearance order

#### Scenario: Backend without multiTurnId falls back to flat
- **WHEN** no result row carries a `multiTurnId`
- **THEN** the grid behaves exactly as before grouping — every row is a single-turn row with no
  group summary rows

### Requirement: Multi-turn conversations are collapsible and expanded by default
The results grid SHALL render a multi-turn conversation with a leading expander chevron and show it
**expanded** by default (one row per turn). The chevron owns expand/collapse; a group summary
row-body click is a no-op. Single-turn results render as one row without a chevron.

#### Scenario: Expanded on load
- **WHEN** the results grid loads
- **THEN** every multi-turn conversation is expanded, showing one row per turn
- **AND** the expanded summary row shows only the conversation name and an `N turns` badge; its data
  columns are blank (the turn rows carry the values)

#### Scenario: Collapse to a stacked summary
- **WHEN** the user clicks the chevron on an expanded conversation
- **THEN** the turns are hidden and the summary row's columns each show every turn's value stacked
  (read-only, auto-height)
- **AND** clicking the chevron again re-expands the turns in `turnIndex` order beneath the summary

### Requirement: Search flattens results to matching turns
When any floating column filter is active, the results grid SHALL switch to a flat per-turn view
(turn and single rows, no group summary rows) so native per-column filtering hides non-matching rows.
Clearing all filters SHALL restore the grouped (expanded) view.

#### Scenario: Typing a filter flattens to turns
- **WHEN** the user enters text in a floating column filter
- **THEN** group summary rows are replaced by their turn rows and non-matching rows are hidden

#### Scenario: Clearing the filter restores grouping
- **WHEN** the user clears all floating column filters
- **THEN** the grid returns to the grouped view honoring the user's expand/collapse state

### Requirement: Column sorting is disabled while grouped
The grouped results grid SHALL disable column sorting, because ag-grid community cannot keep a
conversation's turns contiguous under a synthesized summary row during a sort. Row order is owned by
the grouping projection (conversation appearance order; turns by `turnIndex`).

#### Scenario: Columns are not sortable in grouped mode
- **WHEN** the results grid is showing grouped conversations
- **THEN** clicking a column header does not sort or reorder rows

### Requirement: Detail opens for turns, not group summaries
Row interaction SHALL remain keyed by the result `id`. Clicking a turn or single-turn row SHALL open
that result's detail; clicking a group summary row SHALL NOT open a detail.

#### Scenario: Turn row opens its detail
- **WHEN** the user clicks a turn or single-turn row
- **THEN** that result's detail (drawer/panel) opens for its `id`

#### Scenario: Group summary row does not open detail
- **WHEN** the user clicks a collapsed conversation's summary row
- **THEN** no result detail opens (the row toggles expand instead)
