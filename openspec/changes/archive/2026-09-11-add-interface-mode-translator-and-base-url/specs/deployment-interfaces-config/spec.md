## MODIFIED Requirements

### Requirement: Interfaces section rendering
Each of the five supported views SHALL render an "Interfaces" section, consisting of a title and a
bordered container, as a sibling of the existing endpoint/source configuration — not nested inside it.
The five views are: Entities → Models, Entities → Applications, Entities → Interceptors,
Assets → Applications, Assets → Models.

#### Scenario: Section renders on all five supported views
- **WHEN** an admin opens the properties of a Model, an entity Application, an Interceptor, an
  Assets → Application, or an Assets → Model
- **THEN** an "Interfaces" section with title and bordered container is visible alongside the
  endpoint/source fields

#### Scenario: Section does not render on unsupported views
- **WHEN** an admin opens Assets → Toolsets or Assets → Prompts
- **THEN** no "Interfaces" section is rendered

### Requirement: Per-view field casing
Views backed by ai-dial-admin-backend (Models, entity Applications, Interceptors) SHALL read and write
interface values using the camelCase `baseUrl` field. Views backed directly by the ai-dial-core DTO
(Assets → Applications, Assets → Models) SHALL read and write interface values using the snake_case
`base_url` field.

#### Scenario: Entity-backed view uses camelCase field
- **WHEN** a Model's interface value is saved
- **THEN** the payload sent to ai-dial-admin-backend uses `{ interfaces: { <type>: { baseUrl } } }`

#### Scenario: Core-backed view uses snake_case field
- **WHEN** an Assets → Application's or Assets → Model's interface value is saved
- **THEN** the payload sent to ai-dial-core uses `{ interfaces: { <type>: { base_url } } }`

## ADDED Requirements

### Requirement: Interface mode selector on Assets → Applications and Assets → Models
Each configured interface row on Assets → Applications and Assets → Models SHALL render a `mode`
selector with exactly two options, `passthrough` and `translator`, defaulting to `passthrough` when the
interface has no `mode` saved.

#### Scenario: New interface defaults to passthrough
- **WHEN** an admin adds a new interface row
- **THEN** its `mode` selector shows `passthrough` selected, and the row displays the existing `base_url`
  input

#### Scenario: Existing interface with no saved mode renders as passthrough
- **WHEN** an admin opens an entity whose interface entry has a `base_url` but no `mode` field
- **THEN** the row renders identically to a `passthrough` row, with the selector showing `passthrough`

### Requirement: Passthrough mode shows the base_url input
When an interface row's `mode` is `passthrough`, the row SHALL show the existing `base_url` text input
and hide any translator-selection control.

#### Scenario: Switching back to passthrough restores the base_url input
- **WHEN** an admin switches a `translator`-mode row back to `passthrough`
- **THEN** the row shows the `base_url` input and no translator selector

### Requirement: Translator mode shows a translator selector
When an interface row's `mode` is `translator`, the row SHALL show a select populated with the platform
`Translator` assets available to the current entity type, plus a `Custom` option, in place of the
`base_url` input.

#### Scenario: Switching to translator mode reveals the selector
- **WHEN** an admin sets an interface row's `mode` to `translator`
- **THEN** the `base_url` input is replaced by a select listing the available `Translator` assets and a
  `Custom` option

#### Scenario: Selecting a named translator stores a reference by name
- **WHEN** an admin selects an existing `Translator` asset from the selector
- **THEN** the interface's `translator` value is saved as that translator's name, with no `base_url`/`out`
  fields shown or stored inline

### Requirement: Custom translator reveals inline base_url and out controls
Selecting `Custom` in the translator selector SHALL reveal an additional line with a `base_url` input and
an `out` select listing the available interface types excluding `Custom` and excluding the interface
type the row itself is configured for — a translator cannot translate an interface into itself.

#### Scenario: Custom reveals base_url and out
- **WHEN** an admin selects `Custom` in the translator selector
- **THEN** a `base_url` input and an `out` select appear on the next line, with no `in` control shown

#### Scenario: Custom translator is stored inline
- **WHEN** an admin fills in `base_url` and `out` for a `Custom` translator and saves
- **THEN** the interface's `translator` value is saved as an inline object containing `base_url` and
  `out`, not a name reference

#### Scenario: out excludes Custom and the row's own interface type
- **WHEN** an admin opens the `out` select on an interface row of type `X`
- **THEN** the options list the remaining three interface types and include neither a `Custom` entry
  nor `X` itself

### Requirement: Per-interface default headers editor
Each configured interface row on Assets → Applications and Assets → Models SHALL render a key-value
editor for that interface's `default_headers`/`defaultHeaders`, built on the same shared key-value grid
component used for the entity-level editor, with its own "Add" control.

#### Scenario: Adding a per-interface header row
- **WHEN** an admin clicks the "Add" button under an interface row's default-headers grid
- **THEN** a new empty key/value row appears scoped to that interface only, leaving other interfaces'
  headers and the entity-level headers unchanged

### Requirement: Defaults popup per interface
Each configured interface row SHALL render a `Defaults` button that opens a popup containing a JSON
editor bound to that interface's `defaults` object.

#### Scenario: Opening the Defaults popup shows the interface's current defaults
- **WHEN** an admin clicks an interface row's `Defaults` button
- **THEN** a popup opens showing that interface's `defaults` value as editable JSON, scoped to that
  interface only

#### Scenario: Editing and closing the popup saves the change to draft state
- **WHEN** an admin edits the JSON in the Defaults popup and confirms
- **THEN** the interface's `defaults` value in the entity's draft state reflects the edited JSON

#### Scenario: Invalid JSON blocks confirmation
- **WHEN** an admin enters syntactically invalid JSON in the Defaults popup
- **THEN** the popup cannot be confirmed until the JSON is valid

### Requirement: Features popup per interface
Each configured interface row SHALL render a `Features` button that opens a popup reusing the existing
entity-level Features controls, scoped to overriding that interface's `features` value.

#### Scenario: Opening the Features popup shows the same controls as the entity Features tab
- **WHEN** an admin clicks an interface row's `Features` button
- **THEN** a popup opens showing the same typed switches/text controls the entity-level Features tab
  renders, reflecting that interface's current `features` overrides

#### Scenario: Confirming the popup saves the override to draft state
- **WHEN** an admin toggles a feature in the popup and confirms
- **THEN** the interface's `features` value in the entity's draft state reflects the change, without
  altering the entity-level `features` value
