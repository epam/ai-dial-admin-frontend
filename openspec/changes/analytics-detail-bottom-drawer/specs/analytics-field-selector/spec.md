## ADDED Requirements

### Requirement: Field selector sidebar renders inside the drawer

The system SHALL render a 180px-wide sidebar on the left side of the drawer body. The sidebar SHALL contain two tabs: "Fields" and "Order". The Fields tab SHALL be active by default.

#### Scenario: Drawer opens with field selector
- **WHEN** the drawer opens
- **THEN** the left sidebar is visible with the Fields tab active

#### Scenario: Switch between tabs
- **WHEN** the user clicks the "Order" tab
- **THEN** the Order tab content is displayed and the tab shows as active

### Requirement: Fields tab shows checkboxes grouped by section

The Fields tab SHALL display a collapsible section for each data section (Execution, Test Case Data, Extracted Columns, Request / Response, and each metric group). Each section SHALL show a header with collapse arrow, section name, and field count. Under each section, individual fields SHALL have a checkbox and field name (monospace). Field names and section names that exceed the 180px sidebar width SHALL be truncated with ellipsis (`text-ellipsis overflow-hidden`) and show the full name via a native `title` tooltip on hover.

#### Scenario: All fields enabled by default
- **WHEN** the drawer opens for the first time
- **THEN** all field checkboxes are checked (enabled)

#### Scenario: Collapse a section
- **WHEN** the user clicks a section header in the Fields tab
- **THEN** the section's field list collapses and the arrow changes to a right-pointing indicator

#### Scenario: Expand a collapsed section
- **WHEN** the user clicks a collapsed section header
- **THEN** the section's field list expands and the arrow changes to a down-pointing indicator

### Requirement: Toggling a field checkbox updates visibility

The system SHALL hide the corresponding row (Table view) or column (Pivot view) when a field checkbox is unchecked. Checking the field SHALL restore it.

#### Scenario: Uncheck a field
- **WHEN** the user unchecks the "f1" field under "aidial_rag_eval.retrieval"
- **THEN** the f1 row disappears from the Table view and the f1 column disappears from the Pivot view

#### Scenario: Re-check a field
- **WHEN** the user checks a previously unchecked field
- **THEN** the field reappears in both Table and Pivot views

### Requirement: Order tab allows drag-to-reorder sections

The Order tab SHALL display a list of sections using `DraggableItem` (from `Common/DraggableItem/`) for drag handle + drop target behavior. Each row shows: a drag handle (⠿ via `DraggableItem`), a numbered position indicator, the section name, and an eye toggle. The user SHALL be able to drag sections to reorder them. Reordering SHALL update the section display order in both Table and Pivot views.

#### Scenario: Drag section to new position
- **WHEN** the user drags "Test Case Data" from position 2 to position 4
- **THEN** the section order updates, position numbers recalculate, and both views reflect the new order

#### Scenario: Visual feedback during drag
- **WHEN** the user drags a section over another section
- **THEN** the drop target shows a top border highlight indicating the insertion point

#### Scenario: Reorder via keyboard
- **WHEN** the user focuses a section row (via the focusable wrapper around `DraggableItem`, not the drag handle itself) and presses Arrow Up or Arrow Down
- **THEN** the section moves one position in the corresponding direction and position numbers recalculate

### Requirement: Order tab eye toggle hides entire sections

Each section row in the Order tab SHALL have an eye toggle. Clicking it SHALL hide the entire section (all its fields) from both views. A hidden section's eye icon SHALL appear dimmed.

#### Scenario: Hide a section
- **WHEN** the user clicks the eye toggle on "Request / Response"
- **THEN** the entire Request / Response section disappears from Table and Pivot views, and the eye icon appears dimmed

#### Scenario: Show a hidden section
- **WHEN** the user clicks the dimmed eye toggle on a hidden section
- **THEN** the section reappears in both views with its fields' individual visibility preserved

### Requirement: Field selector state persists within drawer session

Field visibility, section order, section hidden states, and spotlighted fields SHALL persist as long as the drawer is open. Closing the drawer (X button) or switching to sidebar mode SHALL reset all field selector state to defaults (all visible, original order, no spotlighted fields).

#### Scenario: Close and reopen resets state
- **WHEN** the user hides several fields, reorders sections, closes the drawer, then opens it again by clicking a row
- **THEN** all fields are visible, sections are in their original order, and no fields are spotlighted

#### Scenario: State persists across view toggles
- **WHEN** the user hides fields in Table view then switches to Pivot view
- **THEN** the same fields are hidden in Pivot view

### Requirement: Field selector is keyboard accessible

Section headers, checkboxes, tab switches, and drag handles SHALL be focusable via Tab key. Checkboxes SHALL toggle on Space. Sections SHALL expand/collapse on Enter.

#### Scenario: Toggle checkbox with keyboard
- **WHEN** the user focuses a field checkbox and presses Space
- **THEN** the checkbox toggles and the field visibility updates

#### Scenario: Expand section with keyboard
- **WHEN** the user focuses a collapsed section header and presses Enter
- **THEN** the section expands
