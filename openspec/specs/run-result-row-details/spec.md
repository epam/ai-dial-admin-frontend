# run-result-row-details Specification

## Purpose

Defines the right-hand row-detail panel of a single run's Extraction Result tab: a Field/Values table of the selected test case, built like the Run Comparison page's right panel but with one Values column and no comparison. It owns the table's layout, filters, sections, value cells and popup, field focus from grid cell clicks, and the panel chrome it shares with the bottom pivot.

## Requirements
### Requirement: Right panel shows a Field/Values table

When the Execution Result detail mode is "sidebar" and a row is selected, the right panel SHALL show the selected test case as a table with a sticky header of two columns, `Field` and `Values`. It SHALL NOT show a second run column, a Delta column, diff highlighting, a diff legend, a diff minimap, or view-differences / hide-highlights controls. The panel header SHALL show the test case title, a Display control, the bottom/right layout switch, and a Close button, and the panel SHALL be half the screen wide, like the Run Comparison right panel.

#### Scenario: Table layout for one test case
- **WHEN** the user selects a row with the detail mode set to "sidebar"
- **THEN** the right panel shows a `Field` column and one `Values` column under a sticky header
- **AND** no Delta column, diff legend or minimap is shown

#### Scenario: Header controls
- **WHEN** the right panel is open
- **THEN** its header shows the test case title, Display, the switch to the bottom panel, and Close

#### Scenario: Row selection updates the table
- **WHEN** the right panel is open and the user clicks a different grid row
- **THEN** the panel shows that test case without closing

### Requirement: Right table is organized in collapsible sections

The table SHALL group its fields into sections shown as full-width toggle rows, in the order of the bottom pivot: Execution first, then metric groups in the Extraction Result grid's column-group order, then the remaining sections. Every section SHALL start expanded. A toggle row SHALL expose its state with `aria-expanded`. The table SHALL include every Test Case Data, Extracted and metric field the grid shows for the run, rendering a missing value as an em dash, exactly as the bottom pivot does. Section collapse state SHALL reset when another row is selected.

#### Scenario: Collapse a section
- **WHEN** the user clicks the toggle row of an expanded section
- **THEN** its field rows are hidden and the toggle reports `aria-expanded="false"`

#### Scenario: Section order matches the grid
- **WHEN** the grid shows metric groups in a given order
- **THEN** the table's metric sections follow that order, after Execution

#### Scenario: Missing value shows a dash
- **WHEN** a column that other rows populate has no value for the selected row
- **THEN** the table still lists the field and its value cell shows an em dash

#### Scenario: Collapse state resets on row change
- **WHEN** the user collapses a section and then selects another row
- **THEN** all sections are expanded for the new row

### Requirement: Right table filters by field and by value

Under the `Field` and `Values` headers the table SHALL show a filter row. Each cell SHALL have a search input that narrows the rows as the user types (case-insensitive substring) and a filter control offering Contains, Does not contain, Equals and Does not equal. Filtering SHALL apply to the field label and to the displayed value respectively. A section left with no matching rows SHALL be hidden. Filters SHALL reset when another row is selected.

#### Scenario: Search by field
- **WHEN** the user types `acc` in the Field search
- **THEN** only rows whose label contains "acc" remain, and sections without any such row are hidden

#### Scenario: Search by value
- **WHEN** the user types `Romans` in the Values search
- **THEN** only rows whose value contains "Romans" remain

#### Scenario: Equals filter on values
- **WHEN** the user chooses Equals with `0.000` in the Values filter
- **THEN** only rows whose value equals `0.000` remain

#### Scenario: No matches
- **WHEN** the filters match no row
- **THEN** the table body shows no section rows

#### Scenario: Filters reset on row change
- **WHEN** a filter is applied and the user selects another row
- **THEN** the filter inputs are empty for the new row

### Requirement: Right table value cells match the grid

A status field SHALL render the execution status badge. A score field SHALL render the grid's bucket-coloured score cell filling its cell. Numeric fields SHALL be right-aligned. A value cell SHALL be capped to a fixed height and SHALL clip its content instead of growing the row. When the value is clipped, hovering or focusing the cell SHALL reveal a control that opens a popup titled with the field label and showing the full value, the same popup the bottom pivot opens. Short values SHALL show no control.

#### Scenario: Score cell colour
- **WHEN** a metric field's value falls in a score bucket
- **THEN** its value cell is filled with that bucket's colour, as in the grid

#### Scenario: Long value is clipped
- **WHEN** a value is taller than the cell's fixed height
- **THEN** the row stays at the fixed height and the overflow is clipped

#### Scenario: Open full value
- **WHEN** the user activates the open-popup control of a clipped value
- **THEN** a popup titled with the field label shows the full value

#### Scenario: Short value has no control
- **WHEN** a value fits within the cell
- **THEN** no open-popup control is offered for it

### Requirement: Grid cell click scrolls the right table to the related field

When the user clicks a cell in the Extraction Result grid whose column maps to a detail field, and the detail mode is "sidebar", the system SHALL open the right panel for that row (if needed) and scroll the table vertically so the related field is visible. Mapping SHALL be the one the bottom pivot uses. An unmapped column SHALL open the panel without scrolling to a specific field.

#### Scenario: Metric cell scrolls to its field
- **WHEN** the user clicks a metric cell while the detail mode is "sidebar"
- **THEN** the right table shows that row and scrolls to the clicked metric's field

#### Scenario: Unmapped column
- **WHEN** the user clicks the test case name cell
- **THEN** the right panel opens for that row without scrolling to a field

### Requirement: Display selection is shared by the bottom and right panels

The Display control SHALL open the same overlay in the right panel as in the bottom panel, controlling field and section visibility and order. The selection SHALL apply to whichever position is showing, SHALL survive switching between bottom and right and closing and reopening the panel within the same run session, and SHALL reset to the defaults when the user leaves the run. The defaults are those of the bottom panel: Duration hidden, every other execution field and the Request / Response fields visible. The overlay SHALL NOT offer comparison toggles.

#### Scenario: Hidden field stays hidden after switching
- **WHEN** the user hides a field in Display on the bottom panel and switches to the right panel
- **THEN** the field is absent from the table

#### Scenario: Selection survives close and reopen
- **WHEN** the user changes Display in the right panel, closes it, and opens it again on any row
- **THEN** the chosen visibility and order still apply

#### Scenario: Defaults on a new run session
- **WHEN** the user leaves the run and opens a run again
- **THEN** Duration is hidden and all other fields are visible

### Requirement: Right panel shows loading and error states

The right panel SHALL show a loader while the test case details load and an error message when loading fails, keeping its header — title area, layout switch and Close — usable in both states.

#### Scenario: Loading
- **WHEN** the right panel opens before the details arrive
- **THEN** the body shows a loader and the header controls stay available

#### Scenario: Load failure
- **WHEN** the details request fails or returns nothing
- **THEN** the body shows the load-error message and the panel stays open

### Requirement: Right panel does not offer the legacy detail features

The single run's right panel SHALL NOT offer a JSON Viewer switch, a Grafana trace link, or per-metric bindings and info cards. Request and response bodies SHALL be reachable as fields of the table.

#### Scenario: No JSON Viewer switch
- **WHEN** the right panel is open
- **THEN** no JSON Viewer switch is shown

#### Scenario: Request and response as fields
- **WHEN** the Request / Response section is visible in Display
- **THEN** its request body and response body appear as rows of the table
