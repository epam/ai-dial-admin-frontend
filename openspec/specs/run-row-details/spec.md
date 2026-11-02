# run-row-details Specification

## Purpose

The row-detail panel of a single run's Execution Results tab when it is shown in the right side panel:
its Field | Values table, sections and filtering, how long values are truncated and opened in a pop-up,
the header actions, and how the panel shares Display settings with the bottom drawer.

## Requirements

### Requirement: Side panel presents the row as a Field | Values table

When the single run's row detail is shown in the right side panel, it SHALL render the selected row as
a two-column table with a Field column and a Values column. The table SHALL have a header row naming
the columns that stays visible while the body scrolls, followed by a search and filter row for each
column. Fields SHALL be grouped into collapsible sections in this order: Execution, Test Case Data,
Extracted Columns (when present), one section per metric, then Request / Response. Field rows SHALL be
visually indented under their section. Numeric score values SHALL keep the heat-map colouring they have
elsewhere in the run view, and the Execution status SHALL show its status icon with the status text.
The panel SHALL fit half of the viewport width.

#### Scenario: Row opens as a table
- **WHEN** the row detail is in the right side panel and a row is selected
- **THEN** the panel shows a header row with "Field" and "Values" and one section per kind of data the row has
- **AND** each field appears as a row with its name in the Field column and its value in the Values column

#### Scenario: Header stays visible while scrolling
- **WHEN** the table body is taller than the panel and the user scrolls down
- **THEN** the column header row and the search and filter row remain visible

#### Scenario: Sections can be collapsed
- **WHEN** the user activates a section header
- **THEN** that section's field rows hide and the header reports it as collapsed
- **AND** activating it again shows the rows and reports it as expanded

#### Scenario: Score cell keeps heat-map colouring
- **WHEN** a metric field has a numeric score value
- **THEN** its value cell is coloured by the same heat-map scale used for that score in the run results grid

### Requirement: Side panel header actions

The side panel header SHALL show the row title and, in this order, a link to the trace in Grafana (only
when the row has a trace URL), the Display button, a button that moves the detail to the bottom drawer,
a divider, and a Close button. Closing SHALL hide the panel. Moving to the bottom drawer SHALL show the
same row there.

#### Scenario: Grafana link only with a trace
- **WHEN** the selected row has no trace URL
- **THEN** the header shows no Grafana link

#### Scenario: Switch to bottom keeps the row
- **WHEN** the user activates the switch-to-bottom button
- **THEN** the side panel closes and the bottom drawer opens for the same row

#### Scenario: Close hides the panel
- **WHEN** the user activates Close
- **THEN** the side panel hides and no row remains selected

### Requirement: Side panel search and filter

The search field above each column SHALL hide field rows whose name (Field column) or value (Values
column) does not contain the typed text, ignoring case. The filter control next to each search field
SHALL offer the same text conditions as the Compare row-detail table. A section left with no matching
rows SHALL be hidden. Search and filter state SHALL NOT persist after the panel is closed or a
different row is opened.

#### Scenario: Searching Field narrows rows
- **WHEN** the user types "ans" into the Field search
- **THEN** only field rows whose name contains "ans" remain, and sections with no remaining rows are hidden

#### Scenario: Searching Values narrows rows
- **WHEN** the user types text into the Values search
- **THEN** only field rows whose value contains that text remain

#### Scenario: Filters reset for another row
- **WHEN** a search is active and the user selects a different row
- **THEN** the new row is shown with empty search and no active filter

### Requirement: Long values are truncated and open in a pop-up

A value cell SHALL show at most three lines of its content, ending with an ellipsis when the content
does not fit, instead of growing the row or scrolling inside the cell. When a value is truncated, the
whole cell SHALL be one control that opens a pop-up titled with the field name and showing the full
value. While the pointer is over such a cell, or keyboard focus is on it, an "open in pop-up" icon
SHALL appear at its bottom-right. A cell whose content fits SHALL show no icon and SHALL NOT open a
pop-up. The pop-up SHALL present JSON values pretty-printed and SHALL close on its close control or
Escape.

#### Scenario: Long value is clamped
- **WHEN** a field value needs more than three lines at the current width
- **THEN** the cell shows three lines ending in an ellipsis and the row is no taller than a three-line row

#### Scenario: Hover reveals the pop-up icon
- **WHEN** the pointer is over a truncated value cell
- **THEN** an open-in-pop-up icon appears at the bottom-right of the cell

#### Scenario: Focus reveals the pop-up icon
- **WHEN** keyboard focus moves onto a truncated value cell
- **THEN** the same icon is shown, and Enter or Space opens the pop-up

#### Scenario: Clicking anywhere on the cell opens the full value
- **WHEN** the user clicks any part of a truncated value cell
- **THEN** a pop-up opens with the field name as its title and the complete value in it

#### Scenario: Short value is not interactive
- **WHEN** a field value fits within its cell
- **THEN** no icon appears on hover and clicking the cell opens nothing

#### Scenario: Widening the panel can remove truncation
- **WHEN** a truncated value fits after the panel width changes
- **THEN** the cell stops showing the ellipsis and the icon

### Requirement: Display settings are shared between side panel and bottom drawer

The side panel's Display control SHALL open the same Display panel as the bottom drawer, and the
chosen field visibility and order SHALL apply to the table. The selection SHALL be kept when the user
switches between the side panel and the bottom drawer, and when the detail is closed and a row is
opened again, for as long as the run view stays open.

#### Scenario: Hide a field in the side panel
- **WHEN** the user hides a field in Display while in the side panel
- **THEN** its row disappears from the table

#### Scenario: Selection survives a mode switch
- **WHEN** the user hides a field in the side panel and switches to the bottom drawer
- **THEN** that field is hidden there too

### Requirement: Grid cell click scrolls the side panel to the related field

When the user clicks a cell in the run's Execution Results grid whose column maps to a detail field and
the row detail is in the right side panel, the system SHALL open the panel for that row (if needed) and
scroll the table vertically so that field's row is visible below the sticky header. Unmapped columns
SHALL open the panel without scrolling to a specific field.

#### Scenario: Cell click scrolls to field
- **WHEN** the row detail is in the right side panel and the user clicks an `answer` cell in the grid
- **THEN** the panel shows that row and the `answer` field row is scrolled into view, not hidden behind the header

#### Scenario: Unmapped column opens without scrolling
- **WHEN** the user clicks the test case name cell in the grid
- **THEN** the panel opens for that row at the top of the table
