## ADDED Requirements

### Requirement: Interfaces section rendering
Each of the four supported views (Entities → Models, Entities → Applications, Entities → Interceptors,
Assets → Applications) SHALL render an "Interfaces" section, consisting of a title and a bordered
container, as a sibling of the existing endpoint/source configuration — not nested inside it.

#### Scenario: Section renders on all four supported views
- **WHEN** an admin opens the properties of a Model, an entity Application, an Interceptor, or an
  Assets → Application
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
interface values using the camelCase `baseUrl` field. The Assets → Applications view, backed directly
by the ai-dial-core DTO, SHALL read and write interface values using the snake_case `base_url` field.

#### Scenario: Entity-backed view uses camelCase field
- **WHEN** a Model's interface value is saved
- **THEN** the payload sent to ai-dial-admin-backend uses `{ interfaces: { <type>: { baseUrl } } }`

#### Scenario: Core-backed view uses snake_case field
- **WHEN** an Assets → Application's interface value is saved
- **THEN** the payload sent to ai-dial-core uses `{ interfaces: { <type>: { base_url } } }`
