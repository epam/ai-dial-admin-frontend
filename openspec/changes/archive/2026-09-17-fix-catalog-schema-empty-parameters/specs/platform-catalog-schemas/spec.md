## MODIFIED Requirements

<!--
The empty-properties scenario below was authored as `A schema with no properties says so` with
inverted content, because a MODIFIED requirement may not drop a scenario the current spec has and
REMOVED + ADDED of one requirement is rejected outright — neither route could rename it. It was
renamed to its present heading when this delta was synced into the consolidated spec, which also
separates it from `catalog-properties-editing`'s identically-named scenario, where the
deployment-side editor legitimately does show an empty state.
-->

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
offer exactly the values Core's catalog meta-schema allows: `text`, `richText`, `badge`, `chips`,
`url`, `boolean`, `image`, and `date`.

#### Scenario: Properties are editable with no resolved read

- **WHEN** a user opens a catalog schema's Parameters tab
- **THEN** the schema's own properties are shown and editable
- **AND** no resolved-schema request is issued

#### Scenario: A schema with no properties still offers the property editor

- **WHEN** a user opens the Parameters tab of a schema that declares no properties
- **THEN** the property editor is shown, empty, with its add-field action — not an empty state in
  place of it
- **AND** adding a field and saving stores that first property on the schema

#### Scenario: Presentation hints are editable

- **WHEN** a user edits a property's tab, section, order, widget, or localized flag and saves
- **THEN** the values are stored under that property's catalog metadata and reappear on reload

#### Scenario: Widget offers exactly the supported values

- **WHEN** a user opens the widget selection on a property
- **THEN** the options are exactly `text`, `richText`, `badge`, `chips`, `url`, `boolean`, `image`,
  and `date`

#### Scenario: Editing preserves extensions the tab does not render

- **WHEN** a user edits one property of a schema whose other properties carry a file-valued
  declaration, a string format, or nested presentation metadata
- **THEN** those declarations survive the save unchanged
- **AND** the file-valued property still resolves as a DIAL file reference to Core on publish
