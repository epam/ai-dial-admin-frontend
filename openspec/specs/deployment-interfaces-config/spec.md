# deployment-interfaces-config Specification

## Purpose

Defines how each supported entity view renders and persists its configured interfaces (endpoint
type, mode, translator, per-interface defaults/features/headers).

## Requirements

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

### Requirement: Adding an interface with multiple allowed types
For views where more than one interface type is allowed (Models: `openaiChatCompletions`,
`openaiResponses`, `anthropicMessages`), clicking "+ Add" SHALL open a dropdown of interface types that
have not yet been configured; selecting a type SHALL close the dropdown and reveal a labeled `base_url`
input for that type.

#### Scenario: Dropdown lists only unused types
- **WHEN** a Model already has an `openaiChatCompletions` interface configured and the admin clicks
  "+ Add"
- **THEN** the dropdown shows only `openaiResponses` and `anthropicMessages`, not
  `openaiChatCompletions`

#### Scenario: Selecting a type reveals its input
- **WHEN** the admin selects `anthropicMessages` from the dropdown
- **THEN** the dropdown closes and a labeled input for `anthropicMessages` appears, bound to that
  interface's `base_url`/`baseUrl` value

#### Scenario: Add button hides once all types are configured
- **WHEN** a Model has all three allowed interface types configured (`openaiChatCompletions`,
  `openaiResponses`, `anthropicMessages`)
- **THEN** the "+ Add" button is no longer rendered

### Requirement: Adding an interface with a single allowed type
For views where exactly one interface type is allowed (Entities → Applications, Interceptors, Assets →
Applications — all restricted to `openaiChatCompletions`), clicking "+ Add" SHALL create that type's
input directly, without ever showing a type-selection dropdown.

#### Scenario: Add creates the single allowed input with no dropdown
- **WHEN** an admin on an entity Application, Interceptor, or Assets → Application clicks "+ Add" with
  no interfaces yet configured
- **THEN** a labeled `openaiChatCompletions` input appears immediately, with no dropdown ever shown

#### Scenario: Add button hides once the single allowed type is configured
- **WHEN** the single allowed interface type has already been added
- **THEN** the "+ Add" button is no longer rendered

### Requirement: Removing a configured interface
Each configured interface row SHALL display a delete control (red `IconTrashX`) that removes that
interface entry from the entity's draft state when clicked.

#### Scenario: Deleting a row removes it and restores the add option
- **WHEN** an admin clicks the delete button on a configured interface row
- **THEN** that row is removed from the section, its type becomes selectable again (multi-type views) or
  the "+ Add" button reappears (single-type views)

### Requirement: Stripping empty interface values on save
Before persisting an entity (Model, entity Application, Interceptor, or Assets → Application), any
interface entry whose `base_url`/`baseUrl` value is empty or blank SHALL be removed from the payload
sent to the backend, so that reloading the entity afterward does not show a stale empty row.

#### Scenario: Empty interface entry is not persisted
- **WHEN** an admin adds an interface row, leaves its `base_url` value blank, and saves the entity
- **THEN** the save payload omits that interface entry entirely

#### Scenario: Entity reload shows no empty interface row
- **WHEN** an admin previously saved an entity with a blank interface value and then reloads the entity
  view
- **THEN** no empty interface row is present in the Interfaces section

#### Scenario: Non-empty interface entries are persisted unchanged
- **WHEN** an admin configures an interface with a non-empty `base_url` value and saves
- **THEN** the save payload includes that interface entry with its value intact

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
