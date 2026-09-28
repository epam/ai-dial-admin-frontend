# catalog-properties-editing Specification

## Purpose

The mechanism a deployment surface uses to point at a catalog schema and fill in the display metadata
it describes: the schema picker, the values editor built by the shared schema renderer, the
client-side validation that precedes every write, and the preservation of display fields that arrive
as a locale map. The catalog meta-schema's presentation metadata is deliberately inert here — it is
the shared renderer's to support, and this capability states the gap rather than working around it. Shared by the four Core-direct deployment
surfaces — Catalog Models, Catalog Interceptors, platform-bucket Applications and Toolsets — so each
of them contributes only its placement, never its own copy of this behavior.

## Requirements

### Requirement: A deployment can be pointed at a catalog schema

The system SHALL let an admin select a catalog schema for a deployment, store the selection as the
deployment's `catalog_schema_id`, and clear it again. The selection SHALL survive a save and reopen.

#### Scenario: A schema is selected and persists

- **WHEN** an admin selects a catalog schema on a deployment and saves
- **THEN** the deployment's `catalog_schema_id` is that schema's `$id`
- **AND** reopening the deployment shows the same schema as selected

#### Scenario: The selection can be cleared

- **WHEN** an admin clears the selected schema and saves
- **THEN** the deployment carries no `catalog_schema_id`
- **AND** the values editor is no longer offered

#### Scenario: A read-only admin cannot change the selection

- **WHEN** a read-only admin opens a deployment carrying a catalog schema
- **THEN** the selection is shown but cannot be changed, and no values are editable

### Requirement: The schema picker lists both populations in one grid

The picker SHALL offer every catalog schema DIAL Core resolves — those written through its API and
those declared in its configuration file — read in a single request, and SHALL present them in a
single-select grid with exactly three columns: the schema's `$id`, its display name, and the entity
kind it declares.

Author and updated-time columns SHALL NOT be offered: the read that unions the two populations
carries no resource metadata, and adding them would cost one metadata request per row for the
API-written half and remain empty for the other.

The entity kind SHALL be presented as information, not as a filter or a constraint — DIAL Core never
checks a deployment's own kind against the schema's `dial:catalogEntityType`, so a picker that hid
mismatched schemas would refuse a pairing Core accepts.

#### Scenario: Both populations appear

- **WHEN** an admin opens the picker and schemas exist in both populations
- **THEN** all of them are listed in one grid

#### Scenario: The grid shows exactly the three columns

- **WHEN** the picker grid renders
- **THEN** its columns are the schema id, the display name, and the entity kind
- **AND** no author or updated-time column is present

#### Scenario: A schema written for another entity kind is still selectable

- **WHEN** an admin opens the picker on a model and a schema declares the `agent` entity kind
- **THEN** that schema is listed and can be selected, with its kind visible

#### Scenario: Exactly one schema can be selected

- **WHEN** an admin picks a row in the grid
- **THEN** any previous selection is replaced rather than added to

#### Scenario: A failed read is reported rather than shown as an empty catalogue

- **WHEN** the schema list cannot be read
- **THEN** the picker surfaces the failure instead of presenting an empty selectable list

#### Scenario: The selected schema is reachable

- **WHEN** an admin has a schema selected
- **THEN** its own detail page can be opened from the field in a new tab

### Requirement: The values editor is the shared schema renderer

The system SHALL render the editor for `catalog_properties` with the shared schema renderer the
application parameters tab already uses, passing it the selected schema. Types, enumerations, nested
objects, arrays and `oneOf`/`anyOf` are therefore supported exactly as they are there.

The renderer does not read the catalog meta-schema's presentation metadata — `dial:tab`,
`dial:section`, `dial:propertyOrder`, `dial:widget` — nor its `dial:file` marker. In this capability
those declarations SHALL have no effect on the rendering, and that SHALL be a stated limitation
rather than an unreported one: a file-valued property renders as a plain text field holding the file
reference. Support for them is expected to arrive in the shared renderer itself, at which point this
surface gains it without changing.

#### Scenario: Values are edited and round-trip

- **WHEN** an admin fills in the fields the selected schema declares and saves
- **THEN** the values are stored in the deployment's `catalog_properties` and reappear on reload

#### Scenario: Enumerations, objects and arrays behave as in the parameters tab

- **WHEN** the selected schema declares an enumerated property, a nested object and an array
- **THEN** each is edited with the same control the application parameters tab provides for it

#### Scenario: A schema with no properties says so

- **WHEN** the selected schema declares no properties
- **THEN** the editor shows an empty state rather than a blank area

#### Scenario: Presentation metadata is inert, and the surface does not pretend otherwise

- **WHEN** the selected schema declares `dial:tab`, `dial:section`, `dial:propertyOrder` or
  `dial:widget` on its properties
- **THEN** the fields are still all editable, in the renderer's own layout
- **AND** the declarations are preserved in the schema, which this surface never writes

#### Scenario: A file-valued property is editable as a reference

- **WHEN** the selected schema marks a property `dial:file`
- **THEN** the property is editable as a text field carrying the file reference
- **AND** a value already set elsewhere is shown and preserved rather than cleared

#### Scenario: A raw JSON view is available for anything the form cannot express

- **WHEN** an admin opens the catalog values of a deployment
- **THEN** a raw JSON view of `catalog_properties` is reachable, so a value the form renders
  awkwardly can still be entered exactly


### Requirement: Catalog values are validated before the write

DIAL Core validates `catalog_properties` against the referenced schema, and what a failure costs
depends on where the deployment lives: for a platform-bucket resource the rejection happens when Core
assembles its merged configuration, taking the whole configuration down with it; for a user-bucket
application or toolset Core rejects the write itself with a `400`. The system SHALL therefore validate
the values against the selected schema before the write, in both cases, and SHALL surface the reason.

The enforced rules are: every property the schema marks required is present, and each value matches
its declared type and any declared enumeration. A value that arrived as a locale map SHALL be checked
for the schema's own default locale (`dial:defaultLocale`, defaulting to `en`) rather than rejected
for its shape — the form does not author such a value, but Core accepts one and rejects it later if
that locale is missing.

#### Scenario: A missing required value blocks the save

- **WHEN** a schema marks a property required and an admin leaves it empty
- **THEN** the save is blocked with a message naming the property, and no request reaches Core

#### Scenario: A value of the wrong type blocks the save

- **WHEN** a value does not match the type its schema declares
- **THEN** the save is blocked with a message naming the property

#### Scenario: A platform-bucket write is gated locally

- **WHEN** an admin saves invalid catalog values on a Catalog model or interceptor
- **THEN** the save is blocked client-side rather than reaching Core, where it would be accepted and
  then break the merged configuration

#### Scenario: A user-bucket rejection from Core is surfaced

- **WHEN** Core rejects catalog values on a user-bucket application or toolset with a `400`
- **THEN** the error notification carries Core's own message

### Requirement: A locale-map display field is preserved rather than corrupted

DIAL Core accepts a deployment's `displayName`, `description`, and `intro` as either a plain string
or a `locale -> value` map. The system SHALL preserve the map form through a read and a save, and
SHALL NOT render it into a text input or overwrite it with the rendering.

Authoring such a map is out of scope: the system SHALL continue to offer a single text field for the
plain-string form.

#### Scenario: A locale map survives an unrelated edit

- **WHEN** a deployment whose `displayName` is a locale map is opened, another field is edited, and
  the deployment is saved
- **THEN** `displayName` is still the same locale map

#### Scenario: A locale map is not rendered as text

- **WHEN** a deployment whose display field is a locale map is opened
- **THEN** the field does not show a serialized object, and does not present the map as editable text

#### Scenario: A plain string behaves exactly as before

- **WHEN** a deployment whose display fields are plain strings is opened and edited
- **THEN** the fields behave as they do today, with no change in shape on save
