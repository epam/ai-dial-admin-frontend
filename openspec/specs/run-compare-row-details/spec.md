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

### Requirement: Pivot metric and extracted order matches the Execution Results grid

The compare row-detail pivot SHALL order metric groups and extracted fields to match the Execution Results grid: metric groups follow the grid column-group order, and extracted fields follow the run-wide first-seen schema rather than alphabetical order.

#### Scenario: Metric groups follow the compare grid
- **WHEN** the Execution Results grid shows DeepEval: Answer Relevancy before Exact Match
- **THEN** the bottom pivot shows those metric sections in the same order

#### Scenario: Extracted fields follow the grid schema
- **WHEN** the Execution Results extracted columns are answer, history, last_question, verification
- **THEN** the pivot Extracted columns appear in that same order

### Requirement: Pivot includes run-wide fields with a dash for missing values

The compare row-detail pivot SHALL include every Extracted and metric field that the Execution Results grid shows, even when the selected row has no value for that field. A missing, null, or absent value SHALL render as an em dash, matching the grid.

#### Scenario: Metric present on other rows
- **WHEN** the compare grid shows a metric column as an em dash for the selected row
- **THEN** the bottom pivot still includes that metric column
- **AND** the cell shows an em dash

#### Scenario: Extracted column present on other rows
- **WHEN** an extracted column exists on either compared run but the selected row has no value for it
- **THEN** the pivot includes that column
- **AND** the cell shows an em dash

### Requirement: Clicked row is highlighted in the grid

The grid row corresponding to the open detail SHALL be highlighted with the `ag-active-detail-row` class.

#### Scenario: Row highlight on open
- **WHEN** the user opens row detail for a compare row
- **THEN** that row is highlighted with the active-detail styling
- **AND** any previously highlighted row loses the highlight

#### Scenario: Row highlight cleared on close
- **WHEN** the detail panel closes
- **THEN** the previously highlighted row loses the active-detail styling
