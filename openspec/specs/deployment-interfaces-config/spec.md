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
Before persisting an entity, an interface entry's empty or blank `base_url`/`baseUrl` value SHALL
be omitted from that entry in the payload sent to the backend (stored as absent in draft state, so
no empty string ever reaches the wire); the entry itself SHALL be retained, whatever else it
carries. An empty string on the wire is not an absent value to DIAL Core — it is a present, broken
base URL — so the field is omitted rather than sent blank. The same SHALL hold for an upstream
interface entry's `endpoint` value (the per-upstream interface override in the upstream endpoints
editor): an empty or blank `endpoint` SHALL be stored absent in draft state, because Core dials a
present-but-empty `endpoint` for that interface instead of falling back to the upstream's own
`baseUrl`, and every completion to the model then fails.

#### Scenario: Empty interface base_url is omitted while the entry is kept
- **WHEN** an admin saves a platform model whose entity-level `base_url` is set with a passthrough
  interface whose `base_url` is empty
- **THEN** the save payload includes that interface entry with no `base_url`/`baseUrl` field on it

#### Scenario: An empty upstream interface endpoint is omitted while the entry is kept
- **WHEN** an admin adds an interface to a model's upstream in the upstream endpoints editor, leaves
  its Endpoint field empty, and saves
- **THEN** the saved interface entry carries no `endpoint` field, so Core serves that interface from
  the upstream's own base URL

#### Scenario: An entry carrying only an omitted base_url is persisted
- **WHEN** an admin adds an interface row, leaves its `base_url` empty, changes nothing else on the
  row, and saves
- **THEN** the payload includes the interface entry (it declares the interface served by the
  entity-level base URL), and reloading the entity shows that row with an empty `base_url` input

#### Scenario: Non-base_url values are persisted unchanged
- **WHEN** an interface entry carries a translator, defaults, features, or default headers and its
  `base_url` is empty
- **THEN** the save payload includes the entry with those values intact and no `base_url`/`baseUrl`
  field

#### Scenario: Non-empty interface entries are persisted unchanged
- **WHEN** an admin configures an interface with a non-empty `base_url` value and saves
- **THEN** the save payload includes that interface entry with its value intact

### Requirement: Interface base_url required only without an entity-level fallback
A passthrough interface row's `base_url` input SHALL be required only while the entity-level
`base_url` is empty, on the views that render an entity-level `base_url` field — Assets → Models
(platform models), Assets → Applications, and Assets → Platform Applications. The label's required
marker SHALL follow the same condition. Views with no entity-level `base_url` (Entities → Models,
Entities → Applications, Entities → Interceptors, Assets → Platform Interceptors) SHALL keep the
interface `base_url` unconditionally required.

This mirrors DIAL Core: `passthroughBaseUrl` falls back to the deployment-level base URL, and Core's
config validation flags a passthrough interface only when both the interface `base_url` and the
deployment base URL are absent.

#### Scenario: Interface base_url optional when entity base_url is set
- **WHEN** an admin opens a platform model whose entity-level `base_url` is populated, adds a
  passthrough interface with an empty `base_url`, and saves
- **THEN** no required error is shown on the interface row, its label carries no required marker,
  and the save succeeds

#### Scenario: Interface base_url required when entity base_url is empty
- **WHEN** the entity-level `base_url` is empty and an interface row's `base_url` is empty
- **THEN** the interface `base_url` input shows the required error, its label carries the required
  marker, and saving is blocked until either the interface `base_url` or the entity-level `base_url`
  is filled

#### Scenario: Clearing the entity base_url re-flags an existing empty interface row
- **WHEN** an interface row with an empty `base_url` is valid (entity-level `base_url` populated)
  and the admin clears the entity-level `base_url`
- **THEN** the interface row immediately shows the required error and saving is blocked

#### Scenario: Refilling the entity base_url clears the interface row's required error
- **WHEN** an interface row shows the required error because the entity-level `base_url` was empty,
  and the admin fills the entity-level `base_url`
- **THEN** the interface row's required error clears and the row is valid with its `base_url` still
  empty

#### Scenario: Entity-backed views keep the unconditional requirement
- **WHEN** an admin leaves an interface `base_url` empty on Entities → Models, Entities →
  Applications, Entities → Interceptors, or Assets → Platform Interceptors
- **THEN** the required error is shown regardless of any other field on the form, and saving is
  blocked

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
When an interface row's `mode` is `passthrough`, the row SHALL show its base-URL control and hide any translator-selection control. On platform models and routers, the control SHALL offer Url and Plugin choices; on other entity surfaces it SHALL remain the existing `base_url` text input. The interface's explicit base URL SHALL take precedence over its entity's base URL, and an absent interface value SHALL retain the existing fallback and requiredness behavior.

#### Scenario: Switching back to passthrough restores the base_url input
- **WHEN** an admin switches a `translator`-mode row back to `passthrough`
- **THEN** the row shows its base-URL control and no translator selector

#### Scenario: A platform model or router interface uses a plugin
- **WHEN** an admin selects `dial-plugin://example` on a platform model or router passthrough interface and saves
- **THEN** the interface's existing `base_url` field carries that reference and the interface mode remains `passthrough`

#### Scenario: An empty interface inherits the entity plugin
- **WHEN** a platform model or router has `dial-plugin://example` as its base URL and its passthrough interface has no base URL
- **THEN** the interface remains valid and saves without its own base-URL field

#### Scenario: Other interface passthrough surfaces remain unchanged
- **WHEN** an admin edits a passthrough interface on an application or interceptor
- **THEN** the existing URL input is shown without a plugin selector

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
Selecting `Custom` in the translator selector SHALL reveal an additional line with a `base_url` control and an `out` select listing the available interface types excluding `Custom` and excluding the interface type the row itself is configured for — a translator cannot translate an interface into itself. On platform models and routers, the base-URL control SHALL offer the existing Url and Plugin choices with the caller's available plugin options. On other surfaces it SHALL retain the existing URL-only control. The translator's existing inline object and `out` value SHALL be retained; the system SHALL NOT introduce a new persisted mode. The existing field validation, read-only behavior, save/discard flow, and success/error notification behavior for the owning entity SHALL apply.

#### Scenario: Custom reveals base_url and out
- **WHEN** an admin selects `Custom` in the translator selector
- **THEN** a base-URL control and an `out` select appear on the next line, with no `in` control shown

#### Scenario: Custom translator is stored inline
- **WHEN** an admin fills in `base_url` and `out` for a `Custom` translator and saves
- **THEN** the interface's `translator` value is saved as an inline object containing `baseUrl` and `out`, not a name reference

#### Scenario: Plugin options reach model and router custom translators
- **WHEN** an admin opens a custom translator on a platform model or router
- **THEN** its Plugin selector offers the available plugin instances from the existing Core option sources

#### Scenario: Other custom translators remain URL-only
- **WHEN** an admin opens a custom translator on an application or interceptor
- **THEN** the existing URL input is shown without a plugin selector

#### Scenario: Selecting a plugin retains the inline translator
- **WHEN** an admin selects `dial-plugin://example` for a model or router custom translator and saves
- **THEN** the inline translator retains its chosen `out` and its base URL is saved as that reference through the owning entity's existing mapping

#### Scenario: out excludes Custom and the row's own interface type
- **WHEN** an admin opens the `out` select on an interface row of type `X`
- **THEN** the options list the remaining three interface types and include neither a `Custom` entry
  nor `X` itself

### Requirement: Plugin-served passthrough interfaces reject override paths
On a platform model or router, the system SHALL validate each passthrough interface's effective base URL: use its own URL when present, otherwise the entity's URL. If the effective URL is a `dial-plugin://` URL and the interface has nonempty `overridePaths`, the system SHALL show an actionable localized error and prevent save until the conflict is resolved. It SHALL preserve the paths rather than clearing them automatically and SHALL recompute validity when the entity URL, interface URL, interface mode, or paths change.

#### Scenario: An interface plugin conflicts with override paths
- **WHEN** an admin selects a plugin for a passthrough interface with existing override paths
- **THEN** the paths remain present, an error is shown and save is blocked

#### Scenario: An inherited plugin conflicts with override paths
- **WHEN** a passthrough interface with override paths has no own base URL and the admin changes its model or router base URL to a plugin
- **THEN** the interface shows an error and save is blocked without removing its paths

#### Scenario: An HTTP override avoids the inherited conflict
- **WHEN** the entity base URL names a plugin but a passthrough interface has its own HTTP base URL and valid override paths
- **THEN** the plugin-specific override-path error is not shown for that interface

#### Scenario: Resolving the conflict clears the error
- **WHEN** the admin removes all conflicting override paths or changes the effective URL to HTTP
- **THEN** the plugin-specific error clears and that validation no longer blocks save

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

#### Scenario: Toggling a feature preserves the popup's scroll position
- **WHEN** an admin toggles a feature after scrolling within the Features popup
- **THEN** the popup remains at the same scroll position

#### Scenario: Confirming the popup saves the override to draft state
- **WHEN** an admin toggles a feature in the popup and confirms
- **THEN** the interface's `features` value in the entity's draft state reflects the change, without
  altering the entity-level `features` value

### Requirement: Per-interface override paths editor
Each passthrough interface row SHALL render an override paths editor on Assets → Models, Assets →
Applications (platform) and Assets → Platform Interceptors. The editor SHALL list only the operations
the admin has added, and SHALL offer only the Core operations the row's interface type supports. The
supported operations SHALL be: `openaiChatCompletions` → `postAzureOpenaiChatCompletions`;
`openaiEmbeddings` → `postAzureOpenaiEmbeddings`; `openaiResponses` → `postOpenaiResponses`,
`getOpenaiResponsesById`, `deleteOpenaiResponsesById`, `postOpenaiResponsesCancel`; `anthropicMessages`
→ `postAnthropicMessages`, `postAnthropicMessagesCountTokens`. Values SHALL be stored under the camelCase
`overridePaths` field of the interface entry on every surface.

#### Scenario: No path inputs are shown until one is added
- **WHEN** an admin views an interface row that has no override paths
- **THEN** no path input is shown, only an "Add override path" button

#### Scenario: Add with several available operations opens a dropdown
- **WHEN** an admin clicks "Add override path" on an `openaiResponses` row
- **THEN** a dropdown lists the Responses operations not yet added, and no operation of another
  interface type

#### Scenario: Selecting an operation adds its input
- **WHEN** an admin selects `getOpenaiResponsesById` in the dropdown
- **THEN** the dropdown closes, a path input for that operation appears, and that operation is no longer
  offered

#### Scenario: A single available operation is added directly
- **WHEN** an admin clicks "Add override path" and only one operation is available (for example on an
  `openaiChatCompletions` row)
- **THEN** its input appears immediately with no dropdown, and the add button is hidden once every
  operation has been added

#### Scenario: Entering a path stores it under overridePaths
- **WHEN** an admin enters `/v1/chat/completions` for `postAzureOpenaiChatCompletions` and saves
- **THEN** the payload's interface entry carries
  `overridePaths: { postAzureOpenaiChatCompletions: '/v1/chat/completions' }`

#### Scenario: Emptying an input keeps the row but sends no value
- **WHEN** an admin empties a path input
- **THEN** the input stays on screen, and no value for that operation reaches the payload

#### Scenario: Deleting a row removes the operation
- **WHEN** an admin clicks the delete control on an added operation
- **THEN** its input is removed, the operation is offered again, and `overridePaths` is cleared when no
  operation remains

#### Scenario: Unknown keys survive a round trip
- **WHEN** an entity is loaded whose `overridePaths` contains a key this editor has no input for, an
  admin edits another field, and saves
- **THEN** the saved `overridePaths` still contains the unknown key with its original value

### Requirement: Override path `{id}` validation
The editor SHALL validate `{id}` per operation: a path input for an operation that carries no id
(`postOpenaiResponses`, `postAnthropicMessages`, `postAnthropicMessagesCountTokens`) SHALL show a field
error and block save when its value contains the literal `{id}`. Operations that carry an id SHALL accept
`{id}` and `{overrideName}`. No other token SHALL be validated.

#### Scenario: `{id}` rejected on an id-less operation
- **WHEN** an admin enters `/v1/{id}/responses` for `postOpenaiResponses`
- **THEN** the input shows an error and the entity cannot be saved

#### Scenario: `{id}` accepted on an id operation
- **WHEN** an admin enters `/v1/responses/{id}` for `getOpenaiResponsesById`
- **THEN** no error is shown

### Requirement: Translator mode clears override paths
Switching an interface row to `translator` mode SHALL remove its `overridePaths` from draft state and
hide the override path editor, because Core rejects `overridePaths` on a translated interface.

#### Scenario: Switching to translator drops the paths
- **WHEN** an admin switches a row that has override paths to `translator` mode and saves
- **THEN** the saved interface entry carries no `overridePaths`

### Requirement: Skills switch in the per-interface Features popup
The per-interface Features popup SHALL include the `skills_supported` switch in the tools group, for the
same surfaces as the entity-level Features tab (Assets → Models and Assets → Applications).

#### Scenario: Popup shows the skills switch
- **WHEN** an admin opens the Features popup on an interface row on Assets → Models
- **THEN** a `skills_supported` switch is shown in the tools group

### Requirement: Interfaces section on Platform Routers
`Platform > Routers` SHALL render the "Interfaces" section with the same title, bordered container, and
per-row fields as `Platform > Models`, allowing the four types `openaiChatCompletions`, `openaiResponses`,
`anthropicMessages`, and `openaiEmbeddings`. This is the sixth supported view.

#### Scenario: Section renders on a router
- **WHEN** an admin opens the properties of a router
- **THEN** an "Interfaces" section with title and bordered container is visible alongside `baseUrl`

#### Scenario: All four types can be added
- **WHEN** a router has all four interface types configured
- **THEN** the "+ Add" button is no longer rendered

### Requirement: Translator mode is unavailable while a router is in decision mode
An interface row SHALL offer only the Passthrough mode when its owning view disables translators, and a
router SHALL disable them while its `mode` is `decision`. Changing a router's `mode` to `decision` SHALL
switch every interface row in Translator mode to Passthrough and remove its `translator`. Views that do not
disable translators SHALL render the mode selector as before.

#### Scenario: Mode selector offers only Passthrough in decision mode
- **WHEN** a router is in `decision` mode and an interface row's mode selector is opened
- **THEN** Passthrough is the only option

#### Scenario: Switching to decision clears translated rows
- **WHEN** a router has a Translator-mode interface and the user switches its `mode` to `decision`
- **THEN** that interface becomes Passthrough with no `translator` and an empty required base URL, unless
  the router's own `baseUrl` is set

#### Scenario: Proxy mode keeps the translator option
- **WHEN** a router is in `proxy` mode
- **THEN** the interface mode selector offers both Passthrough and Translator

#### Scenario: Other views are unchanged
- **WHEN** an admin opens an interface row of a Platform Model
- **THEN** the mode selector still offers both Passthrough and Translator
