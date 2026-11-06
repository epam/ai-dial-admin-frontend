## MODIFIED Requirements

### Requirement: Parameters tab edits the schema's own properties

The system SHALL populate the catalog-schema Parameters tab from the schema resource as loaded, and
SHALL make those properties editable. Unlike an app runner, a catalog schema declares no external
schema endpoint — DIAL Core resolves it from configuration alone — so there is no resolved read to
perform and no read-only mode to enter.

Because the tab is always editable, it SHALL offer the property editor even when the schema declares
no properties yet, so the first property can be created here rather than only through the raw JSON
editor. An empty presentation is the editor's own, reserved for the case where editing is not
offered at all.

The tab SHALL expose the catalog presentation hints each property may carry — the tab and section it
renders in, its order, its widget, and whether its value is a locale map — as editable fields
alongside the property's name, type, title, description, and requiredness. The widget selection SHALL
offer the eight values Core's catalog meta-schema allows: `text`, `richText`, `badge`, `chips`,
`url`, `boolean`, `image`, and `date`, and a localized `- None -` option for clearing the hint.
Widget is optional even when the property is required. Choosing `- None -` SHALL remove `dial:widget`
from the property metadata and show the empty placeholder rather than the option label. It SHALL
preserve other metadata and omit `dial:meta` only if no metadata remains. The UI-only option, an empty
string, and null SHALL NOT be persisted as a widget. Core's [catalog meta-schema](https://github.com/epam/ai-dial-core/blob/bf830d8a6a2087cfd00c9364a93cf7efde60c362/config/src/main/resources/catalog-schemas/schema.json)
defines the widget as an optional string constrained to those eight values.

#### Scenario: Properties are editable with no resolved read

- **WHEN** a user opens a catalog schema's Parameters tab
- **THEN** the schema's own properties are shown and editable
- **AND** no resolved-schema request is issued

#### Scenario: Presentation hints are editable

- **WHEN** a user edits a property's tab, section, order, widget, or localized flag and saves
- **THEN** the values are stored under that property's catalog metadata and reappear on reload

#### Scenario: Presentation hints stay optional on a required property

- **WHEN** a user marks a property as required and leaves its order and widget empty
- **THEN** neither field is marked invalid and the save is not blocked

#### Scenario: Widget offers supported values and a clear option

- **WHEN** a user opens the widget selection on a property
- **THEN** the widget values offered are exactly `text`, `richText`, `badge`, `chips`, `url`,
  `boolean`, `image`, and `date`
- **AND** the localized `- None -` option is available to clear the selection

#### Scenario: A newly selected widget clears on the first attempt

- **WHEN** a user selects a widget on an empty property and then selects `- None -` once
- **THEN** the widget field immediately shows the empty placeholder
- **AND** the selected widget is removed from the property metadata

#### Scenario: Clearing a widget preserves other metadata through save

- **WHEN** a user selects `- None -` on a property with a widget and other catalog metadata, saves,
  and reopens the schema
- **THEN** the widget field shows its empty placeholder
- **AND** `dial:widget` is absent from the saved schema and the other metadata is unchanged
- **AND** the existing save success or failure notification behavior is unchanged

#### Scenario: Clearing the last metadata hint

- **WHEN** a user clears a widget that is the only catalog metadata on a property and saves
- **THEN** neither `dial:widget` nor an empty `dial:meta` object is stored

#### Scenario: A widget can be selected again after clearing

- **WHEN** a user clears a widget and then selects a supported widget value
- **THEN** the newly selected value is displayed and saved as `dial:widget`

#### Scenario: A schema with no properties still offers the property editor

- **WHEN** a user opens the Parameters tab of a schema that declares no properties
- **THEN** the property editor is shown, empty, with its add-field action — not an empty state in
  place of it
- **AND** adding a field and saving stores that first property on the schema

#### Scenario: Editing preserves extensions the tab does not render

- **WHEN** a user edits one property of a schema whose other properties carry a file-valued
  declaration, a string format, or nested presentation metadata
- **THEN** those declarations survive the save unchanged
- **AND** the file-valued property still resolves as a DIAL file reference to Core on publish
