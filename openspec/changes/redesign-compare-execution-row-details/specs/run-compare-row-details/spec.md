## ADDED Requirements

### Requirement: Compare page row click opens bottom detail by default

On the dedicated Run Comparison page Execution Results tab, clicking a grid row SHALL open the row-detail panel at the bottom (pivot) by default. Closing the panel SHALL preserve bottom mode so the next row click reopens the bottom panel. The user MAY switch to the right sidebar (table) and back via the panel header.

#### Scenario: First row click opens bottom panel
- **WHEN** no row detail is open and the user clicks a compare grid row
- **THEN** the bottom detail panel opens with that row’s comparison data in pivot view

#### Scenario: Close preserves bottom mode
- **WHEN** the bottom panel is open and the user closes it
- **THEN** the panel hides and the next row click reopens the bottom panel (not the right sidebar)

#### Scenario: Switch to sidebar then back
- **WHEN** the bottom panel is open and the user chooses Switch to Sidebar
- **THEN** the right sidebar shows the same row in table view
- **AND** Switch to Bottom returns to pivot in the bottom panel

#### Scenario: Toggle same row closed
- **WHEN** a row is selected and the user clicks the same row again
- **THEN** the detail panel closes

### Requirement: Grid cell click scrolls to related pivot field

When the user clicks a cell in the Compare Execution Results grid whose column maps to a pivot field, the system SHALL open the bottom panel for that row (if needed) and horizontally scroll so the related pivot column is visible. Unmapped columns SHALL still open the panel without scrolling to a specific field.

#### Scenario: Cell click scrolls to field
- **WHEN** the user clicks an `http` or `cmp_http` cell for a row
- **THEN** the detail panel shows that row and scrolls to the HTTP pivot column

#### Scenario: Unmapped column still opens panel
- **WHEN** the user clicks the test case name column
- **THEN** the detail panel opens for that row without scrolling to a specific field

### Requirement: Compare pivot cells truncate and open a dual-run popup

Compare pivot value cells SHALL truncate content that does not fit. On hover, the cell SHALL show an “open in popup” affordance at the bottom-right. Clicking the cell SHALL open a popup titled with the field label that shows both the primary and compared run values for that field (side-by-side), not only the clicked cell’s value. Delta-row cells SHALL remain non-clickable.

#### Scenario: Truncate long value
- **WHEN** a primary or secondary field value exceeds the cell width
- **THEN** the cell displays truncated text with overflow hidden

#### Scenario: Hover shows open-popup icon
- **WHEN** the user hovers a value cell
- **THEN** an open-in-popup icon appears at the bottom-right of the cell

#### Scenario: Click opens dual-run popup
- **WHEN** the user clicks a primary or secondary value cell
- **THEN** a popup opens with the field label as title
- **AND** both the primary and compared run values for that field are shown

### Requirement: Display has no table/pivot switcher

Row-detail Display SHALL control field visibility/order and diff toggles only. View mode SHALL be determined solely by panel position: bottom → pivot, right → table.

#### Scenario: Display omits view-mode control
- **WHEN** the user opens Display on the compare row-detail panel
- **THEN** no table/pivot segmented control is shown
- **AND** columns tree and diff toggles remain available

#### Scenario: Position implies view
- **WHEN** the panel is at the bottom
- **THEN** the body shows the pivot view
- **WHEN** the panel is on the right
- **THEN** the body shows the table view

### Requirement: Drawer displays two-run comparison for the clicked row

The compare row-detail panel SHALL display a side-by-side comparison between the primary and compared run results for the selected test case, including diff highlighting and counts.

#### Scenario: Both runs have a matching result
- **WHEN** the user opens a row where both runs have a result
- **THEN** the panel shows primary and compared values
- **AND** diff count and highlighting are computed between the two sides

#### Scenario: No match in compared run
- **WHEN** the user opens a row whose `_compared` field is null
- **THEN** the panel opens and shows the primary result
- **AND** a placeholder indicates no match on the compared side

### Requirement: Clicked row is highlighted in the grid

The grid row corresponding to the open detail SHALL be highlighted with the `ag-active-detail-row` class.

#### Scenario: Row highlight on open
- **WHEN** the user opens row detail for a compare row
- **THEN** that row is highlighted with the active-detail styling
- **AND** any previously highlighted row loses the highlight

#### Scenario: Row highlight cleared on close
- **WHEN** the detail panel closes
- **THEN** the previously highlighted row loses the active-detail styling

## REMOVED Requirements

### Requirement: Row click in compare mode opens the bottom drawer
### Requirement: Drawer toolbar shows run names as column labels
### Requirement: Pin/unpin and sidebar-switch controls hidden in run-compare mode
### Requirement: Compared run result missing shows a placeholder
### Requirement: Exiting run-compare mode closes the drawer
