## MODIFIED Requirements

### Requirement: Picking a table rebuilds the draft on it

Picking a table in the Tables tab SHALL make it the draft's table and open the draft builder at
`/queries`, whatever is open at the time — another draft or a saved query. The table SHALL NOT be
written into the address. The new draft SHALL start from the builder's defaults for that table; nothing
SHALL be carried over from the page that was open. Picking a table SHALL NOT change the source of an
open saved query.

A table row SHALL be a link to the draft builder. Opened in a new browser tab, it SHALL show a draft on
the default table specified in `analytics/query-builder`, since the picked table is held by the page it was picked in.

Picking the table the open draft is already built on SHALL leave the draft as it is when it holds no
changes. When the page holds unsaved work, the table SHALL become the draft's table only once the user
confirms leaving that work.

#### Scenario: Picking a table from a draft

- **WHEN** a draft is open and the user picks another table
- **THEN** the builder shows a fresh draft on that table
- **AND** the address stays `/queries`

#### Scenario: Picking a table from a saved query

- **WHEN** a saved query is open and the user picks a table
- **THEN** the draft builder opens on that table
- **AND** the saved query is left unchanged

#### Scenario: Unsaved work is confirmed before the table changes

- **WHEN** the page holds unsaved work and the user picks a table
- **THEN** the draft keeps its table until the user confirms leaving
- **AND** on confirmation the builder shows a fresh draft on the picked table

#### Scenario: A table opened in a new tab

- **WHEN** the user opens a table row in a new browser tab
- **THEN** the new tab shows a draft on the default table and the current tab is unchanged
