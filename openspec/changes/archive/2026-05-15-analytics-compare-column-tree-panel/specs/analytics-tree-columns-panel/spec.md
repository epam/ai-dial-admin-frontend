## ADDED Requirements

### Requirement: Columns button opens the tree panel
The Analytics tab toolbar SHALL render a "Columns" ghost icon button. Clicking it SHALL open the `TreeColumnsPanel` as an overlay on the right side of the analytics grid. Clicking the button again or the panel's close button SHALL dismiss the panel.

#### Scenario: Button visible in both normal and compare mode
- **WHEN** the Analytics tab renders with results loaded
- **THEN** a "Columns" icon button is visible in the toolbar above the grid

#### Scenario: Button opens the panel
- **WHEN** the user clicks the "Columns" button
- **THEN** the TreeColumnsPanel overlay appears on the right side of the grid

#### Scenario: Close button dismisses the panel
- **WHEN** the TreeColumnsPanel is open and the user clicks its close button
- **THEN** the panel disappears and the grid returns to full width

---

### Requirement: TreeColumnsPanel renders the column hierarchy as a tree
The `TreeColumnsPanel` component SHALL accept a `ColDef[]` tree and render it as a collapsible checkbox tree that mirrors the multi-level column structure of the grid. Each group node SHALL be expandable/collapsible. Each node SHALL display its `headerName`.

#### Scenario: Groups render as expandable nodes
- **WHEN** the TreeColumnsPanel opens with a column tree that contains column groups
- **THEN** each group node is rendered with its `headerName` and an expand/collapse control
- **AND** groups are expanded by default

#### Scenario: Leaf columns render as checkboxes
- **WHEN** the TreeColumnsPanel renders a column tree with leaf columns
- **THEN** each leaf column with a `headerName` is rendered as a labelled checkbox
- **AND** the checkbox reflects the column's current `hide` state (checked = visible)

#### Scenario: Columns without headerName are not shown
- **WHEN** a column definition has no `headerName`
- **THEN** it is not rendered in the panel

---

### Requirement: Leaf columns matching skipLeafNames are excluded from the panel
The `TreeColumnsPanel` SHALL accept a `skipLeafNames` prop (default `['Current', 'Compared']`). Leaf columns whose `headerName` exactly matches a `skipLeafNames` entry SHALL not be rendered as panel items. They remain subject to visibility changes when their parent node is toggled.

#### Scenario: Current and Compared leaves hidden from panel
- **WHEN** the Analytics tab is in compare mode and the TreeColumnsPanel is open
- **THEN** "Current" and "Compared" leaf nodes are not shown as individual panel items
- **AND** their parent metric key node is the finest visible toggle unit

#### Scenario: Toggling a parent node also hides skipped leaf children
- **WHEN** the user unchecks a metric key node (e.g. "score") in the panel
- **THEN** both the Current and Compared leaf columns under "score" become hidden in the grid

---

### Requirement: Group checkbox state reflects visibility of descendants
A group node's checkbox SHALL show an indeterminate state when some but not all of its visible (non-skipped) descendant columns are hidden. It SHALL show checked when all are visible and unchecked when all are hidden.

#### Scenario: All children visible — group is checked
- **WHEN** all leaf descendants of a group node are visible
- **THEN** the group's checkbox is checked (not indeterminate)

#### Scenario: All children hidden — group is unchecked
- **WHEN** all leaf descendants of a group node are hidden
- **THEN** the group's checkbox is unchecked (not indeterminate)

#### Scenario: Some children hidden — group is indeterminate
- **WHEN** some but not all leaf descendants of a group node are hidden
- **THEN** the group's checkbox displays an indeterminate state

---

### Requirement: Toggling a group node toggles all its descendants
Checking or unchecking a group node in the panel SHALL set the `hide` property on the group and all descendant columns (including skipped leaf columns) to the corresponding value, and SHALL call `onColumnsChange` with the updated column tree.

#### Scenario: Unchecking a group hides all descendants
- **WHEN** the user unchecks a fully-visible group node
- **THEN** all columns in that group (including nested groups and skipped leaves) are hidden in the grid

#### Scenario: Checking a hidden group reveals all descendants
- **WHEN** the user checks a fully-hidden group node
- **THEN** all columns in that group become visible in the grid

---

### Requirement: Panel column state resets when the column structure changes
When `Analytics.tsx` receives new column definitions (on data load or mode switch), the `panelColDefs` state SHALL be reset to the new definitions, restoring all columns to their default visibility.

#### Scenario: Switching to compare mode resets visibility
- **WHEN** the user selects a run in the Compare With dropdown and compare mode activates
- **THEN** all columns in the new compare-mode layout are visible in the panel

#### Scenario: Clearing compare mode resets visibility
- **WHEN** the user clears the Compare With dropdown and normal mode restores
- **THEN** all columns in the normal layout are visible in the panel
