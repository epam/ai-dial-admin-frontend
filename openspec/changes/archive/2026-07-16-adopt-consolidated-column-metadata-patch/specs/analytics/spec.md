# Analytics — consolidated column-metadata PATCH (delta)

> Applies on top of the master spec `openspec/specs/analytics/spec.md`.

## MODIFIED Requirements

### Requirement: Table detail column schema management

The Table detail page SHALL show the table's columns in a grid (name, source name, type, tag, display name, description, nullable rendered as a true/false value); long display name/description values SHALL be truncated with the full value reachable via an ellipsis tooltip. A column whose `sensitive` flag is true SHALL show a marker (a colored dot with a "Sensitive" tooltip) rendered inline in the name cell, after the name; non-sensitive columns SHALL show no marker. Each column row SHALL offer a per-column action menu with **edit** and **delete (drop)** actions. The column name SHALL also be editable inline in the grid.

The edit action SHALL open a unified edit modal seeded with the column's current name, display name, tag, description, and sensitive flag. The name field SHALL be required (submit disabled while blank) and SHALL be disabled for columns the backend does not allow to rename (grain-key, ordering-key, and `_`-prefixed system columns) while the metadata fields remain editable. Blank display name, tag, or description values SHALL be valid input meaning "clear the value"; the sensitive flag SHALL be toggled with a switch. On submit the modal SHALL diff the form against the original column and send a **single** schema patch: a structural `rename` op when the name changed, plus a **single `update` merge-patch entry** carrying the target column name and only the metadata fields (tag, display name, description, sensitive) that changed. Within the `update` entry an omitted field leaves that attribute unchanged, a blank string value clears it, a non-blank string value sets it, and the boolean `sensitive` is sent as `true`/`false` when toggled. When a rename is included, the `update` entry SHALL reference the new (post-rename) column name. Submit SHALL be disabled when no field changed.

Adding columns SHALL be available from the header via a form popup reusing the column-row editor. Every schema change SHALL be sent as a schema patch to `updateTableSchema`, and on success the detail view SHALL refresh from the server. The header SHALL also offer deleting the whole table with a danger (red confirm) dialog, returning to the catalog on success.

#### Scenario: Inline rename patches the schema

- **WHEN** the user edits a column's name in the grid to a new non-empty value
- **THEN** a rename schema patch is sent and the grid refreshes with the server state

#### Scenario: Combined edit sends one patch with post-rename names

- **WHEN** the user renames `total_money` to `total_cost` and sets its display name to "Total money spend" in the edit modal and submits
- **THEN** a single schema patch is sent containing a rename from `total_money` to `total_cost` and an `update` entry whose `name` is `total_cost` and `display_name` is "Total money spend"
- **AND** the grid refreshes with the server state

#### Scenario: Only changed fields become update fields

- **WHEN** the user changes only the display name and leaves name, tag, and description untouched
- **THEN** the patch contains a single `update` entry carrying only `name` and `display_name`, with no `tag` or `description` field

#### Scenario: Blank metadata clears the value

- **WHEN** the user clears the display name field and submits
- **THEN** the `update` entry sends `display_name` as an empty string, clearing the stored display name

#### Scenario: Description is editable and patched

- **WHEN** the user changes a column's description in the edit modal and submits
- **THEN** the modal renders a description input
- **AND** the patch contains a single `update` entry carrying `name` and the new `description`

#### Scenario: Sensitive columns are marked in the grid

- **WHEN** the columns grid renders a column whose `sensitive` flag is true
- **THEN** the name cell shows a marker with a "Sensitive" tooltip after the name
- **AND** a column whose flag is false shows no marker

#### Scenario: Toggling sensitive is patched

- **WHEN** the user toggles the Sensitive switch in the edit modal and submits
- **THEN** the patch contains a single `update` entry carrying `name` and the new boolean `sensitive`

#### Scenario: Restricted columns cannot be renamed but keep metadata editable

- **WHEN** the user opens the edit modal for a grain-key or ordering-key column
- **THEN** the name input is disabled
- **AND** display name, tag, description, and sensitive remain editable

#### Scenario: Drop a column

- **WHEN** the user chooses delete from a column's action menu
- **THEN** a drop schema patch is sent and the column is removed after refresh

#### Scenario: Add columns

- **WHEN** the user adds one or more valid columns in the add-columns popup and submits
- **THEN** an add schema patch is sent and the new columns appear after refresh

### Requirement: Builder sections use section blocks with categorized field dropdowns and collapsible items

> Only the sensitive-marker addition is new here; the rest of the requirement is unchanged from the master spec.

Field options SHALL display the field's **display name** as primary text, the field type right-aligned, and the schema `description` as a secondary line when present. A field whose schema `sensitive` flag is true SHALL show a sensitive marker (a colored dot with a "Sensitive" tooltip) in its dropdown option, after the display name. All other categorized-field-dropdown behavior (grouping, accordion, search over name/display name, chips/summaries, display-name-only presentation) is unchanged.

#### Scenario: Sensitive field shows a marker in the dropdown

- **WHEN** a schema field whose `sensitive` flag is true is shown in a field dropdown
- **THEN** its option renders a sensitive marker with a "Sensitive" tooltip
- **AND** a non-sensitive field's option renders no such marker

### Requirement: Create table (source or enrichment)

> Only the per-column sensitive flag is new here; the rest of the requirement is unchanged from the master spec.

A **source** table's repeatable column set SHALL collect, per column, an optional **sensitive** flag alongside source name, exposed name, type, nullable, and optional tag. The flag SHALL default off and be toggled with a switch; the same per-column control SHALL be available in the Add columns popup (both reuse the column-row editor). Columns whose flag is on SHALL carry `sensitive: true` into the create/add payload; non-sensitive columns SHALL omit the flag.

#### Scenario: Creating a sensitive column carries the flag

- **WHEN** the user adds a column, toggles its Sensitive switch on, and submits the create/add form
- **THEN** that column is sent with `sensitive: true` in the payload
- **AND** columns left non-sensitive omit the flag
