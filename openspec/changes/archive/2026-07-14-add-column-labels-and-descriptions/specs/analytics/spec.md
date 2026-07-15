# Analytics — column display names and descriptions (delta)

> Applies on top of the master spec **after** `redesign-query-builder-page` is archived — the first modified requirement below enters the master spec through that change.

## MODIFIED Requirements

### Requirement: Builder sections use section blocks with categorized field dropdowns and collapsible items

Each Builder-view section (Group by, Aggregates, Select, Filters, Having, Sort, Page) SHALL render as a bordered section block with a labeled header and a header-level add action where applicable. Field pickers SHALL be searchable dropdowns whose options are grouped by the field's schema tag/category (untagged fields under a default group). Category groups SHALL be collapsible headers showing the group's option count, with at most one category expanded at a time (accordion); the group holding the current selection SHALL start expanded, and an active search term SHALL show all matches regardless of collapse state. Category header colors SHALL cycle the full builder palette. The dropdown's search input SHALL use the same compact boxed style as the builder's other controls.

Field options SHALL display the field's **display name** — the schema `display_name` when set, otherwise the field `name` — as primary text, the field type right-aligned, and the schema `description` as a secondary line when present; fields without display name and description SHALL render as a single line. The dropdown overlay width SHALL stay bounded: long descriptions truncate to one line and the full text is reachable via a hover tooltip of reasonable width. The dropdown search SHALL match against both the field name and its display name. Added items SHALL render compactly — chips for plain fields, collapsible rows for parameterized items (group-by functions, aggregates, conditions, having rows, sort keys) that expand into their editor and collapse back to a summary chip tinted with the owning section's palette color — and chips and collapsed summaries SHALL refer to fields by their display name. Display names are presentation-only: structured-query serialization, the JSON view, and the SQL view SHALL always use the raw field `name`. Styling SHALL use the project's palette/theme tokens only.

#### Scenario: Field dropdown groups by category

- **WHEN** the user opens a field dropdown in a builder section
- **THEN** the fields are grouped under collapsible category headers with option counts
- **AND** expanding one category collapses the previously expanded one
- **AND** typing in the search shows all matching fields across categories

#### Scenario: Display-named field renders display name, description, and type

- **WHEN** the schema field `total_money` carries display name "Total money spend" and a description
- **THEN** its dropdown option shows "Total money spend" as primary text with the type right-aligned
- **AND** the description is shown as a secondary line

#### Scenario: Field without a display name falls back to its name

- **WHEN** a schema field has no display name and no description
- **THEN** its dropdown option shows the raw field name in a single line, as before

#### Scenario: Search matches the display name

- **WHEN** the user types "money" and only the field `total_money` with display name "Total money spend" matches
- **THEN** that field is shown in the results
- **AND** searching by the raw name `total_money` finds it as well

#### Scenario: Chips and summaries use the display name

- **WHEN** the user adds a projection chip and an aggregate over a field with a display name
- **THEN** the chip shows the field's display name
- **AND** the collapsed aggregate summary refers to the field by its display name
- **AND** the serialized query and the JSON view reference the raw field name

#### Scenario: Parameterized item collapses to a summary

- **WHEN** the user collapses an aggregate or filter-condition row
- **THEN** the row shows a compact summary of its configuration in its section's color
- **AND** expanding it restores the full editor

### Requirement: Table detail column schema management

The Table detail page SHALL show the table's columns in a grid (name, source name, type, tag, display name, description, nullable rendered as a true/false value); long display name/description values SHALL be truncated with the full value reachable via an ellipsis tooltip. Each column row SHALL offer a per-column action menu with **edit** and **delete (drop)** actions. The column name SHALL also be editable inline in the grid.

The edit action SHALL open a unified edit modal seeded with the column's current name, display name, and tag. The description SHALL NOT be offered for editing while the backend has no description-edit operation (the backend silently ignores unknown patch operations, which would make a save appear to do nothing); the field joins the modal once that operation ships. The name field SHALL be required (submit disabled while blank) and SHALL be disabled for columns the backend does not allow to rename (grain-key, ordering-key, and `_`-prefixed system columns) while the metadata fields remain editable. Blank display name or tag values SHALL be valid input meaning "clear the value". On submit the modal SHALL diff the form against the original column and send a **single** schema patch containing only the changed operations (`rename`, `retag`, `set_display_name`); when a rename is included, the metadata operations SHALL reference the new (post-rename) column name. Submit SHALL be disabled when no field changed.

Adding columns SHALL be available from the header via a form popup reusing the column-row editor. Every schema change SHALL be sent as a schema patch to `updateTableSchema`, and on success the detail view SHALL refresh from the server. The header SHALL also offer deleting the whole table with a danger (red confirm) dialog, returning to the catalog on success.

#### Scenario: Inline rename patches the schema

- **WHEN** the user edits a column's name in the grid to a new non-empty value
- **THEN** a rename schema patch is sent and the grid refreshes with the server state

#### Scenario: Combined edit sends one patch with post-rename names

- **WHEN** the user renames `total_money` to `total_cost` and sets its display name to "Total money spend" in the edit modal and submits
- **THEN** a single schema patch is sent containing a rename from `total_money` to `total_cost` and a set_display_name targeting `total_cost`
- **AND** the grid refreshes with the server state

#### Scenario: Only changed fields become operations

- **WHEN** the user changes only the display name and leaves name and tag untouched
- **THEN** the patch contains only a set_display_name operation

#### Scenario: Blank metadata clears the value

- **WHEN** the user clears the display name field and submits
- **THEN** a set_display_name operation with an empty value is sent, clearing the stored display name

#### Scenario: Restricted columns cannot be renamed but keep metadata editable

- **WHEN** the user opens the edit modal for a grain-key or ordering-key column
- **THEN** the name input is disabled
- **AND** display name and tag remain editable

#### Scenario: Drop a column

- **WHEN** the user chooses delete from a column's action menu
- **THEN** a drop schema patch is sent and the column is removed after refresh

#### Scenario: Add columns

- **WHEN** the user adds one or more valid columns in the add-columns popup and submits
- **THEN** an add schema patch is sent and the new columns appear after refresh

### Requirement: System-owned tables are read-only

The catalog and detail views SHALL reflect the table's server-provided `system` flag. System-owned tables are seeded server-side and reject every modifying request (`409 table_is_system`), so the UI SHALL NOT offer modify actions for them: in the catalog the row's delete action SHALL be hidden and a System indicator SHALL be shown; in the detail view the delete-table / write-rows / add-columns actions and the per-column edit/drop actions and inline rename SHALL be suppressed, replaced by a read-only indicator. System tables SHALL remain fully viewable and navigable, including their column display names and descriptions.

#### Scenario: System table in the catalog

- **WHEN** the catalog lists a table whose `system` flag is true
- **THEN** the row shows a System indicator
- **AND** the row's delete action is not offered

#### Scenario: System table detail is read-only

- **WHEN** the user opens a system table's detail page
- **THEN** the delete-table, write-rows, and add-columns actions are absent and a read-only indicator is shown
- **AND** the column grid offers no edit/drop actions and no inline editing
- **AND** the table, its columns, and their display names and descriptions remain viewable
