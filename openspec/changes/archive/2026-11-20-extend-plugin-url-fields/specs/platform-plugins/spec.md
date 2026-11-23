## MODIFIED Requirements

### Requirement: Creating a plugin requires a name and a type
The system SHALL open a create modal from the Create button with a name field, a required `type` text input and a `settings` JSON input that defaults to `{}`. The name SHALL use the shared entity-name field and validation and SHALL be rejected when it contains `/`. `type` SHALL be required and trimmed, and the form SHALL NOT offer a list of types, because Core lists none. Its create-form placeholder SHALL be the localized `Enter type`. Submitting SHALL create the resource and navigate to its detail view.

#### Scenario: Submit is blocked without a type
- **WHEN** a user fills the name and leaves `type` empty or blank
- **THEN** the form reports `type` as required and nothing is sent to Core

#### Scenario: Create type placeholder
- **WHEN** a user opens the plugin create modal
- **THEN** the type input shows the localized placeholder `Enter type`

#### Scenario: A name containing a slash is rejected
- **WHEN** a user enters a name containing `/`
- **THEN** the name field shows a validation error and nothing is sent to Core

#### Scenario: A taken name is refused
- **WHEN** a user submits a name that already exists on the Platform tab
- **THEN** the unique-name error is shown and no write is made

#### Scenario: Settings default to an empty object
- **WHEN** a user creates a plugin without touching `settings`
- **THEN** the write carries `settings: {}`

#### Scenario: Create navigates to the detail view
- **WHEN** Core accepts the create
- **THEN** the user lands on the new plugin's detail view

### Requirement: Plugin entries are not connected to other entities in this version
The system SHALL provide plugin base-URL selection for platform models, their passthrough interfaces and custom inline translators, platform routers and their passthrough interfaces and custom inline translators, and standalone Translator create and detail forms. Other entity and interface URL fields, including application and interceptor custom translators, passthrough fields and upstreams, SHALL retain their existing controls and validation. The system SHALL NOT require an existing plugin entry to retain a previously saved reference or block plugin deletion because of a reference.

#### Scenario: Supported fields offer plugin selection
- **WHEN** an admin edits a platform model or router base URL, its passthrough interface base URL or custom inline translator base URL, or a standalone Translator base URL
- **THEN** the field offers Url and Plugin choices

#### Scenario: Other URL fields remain unchanged
- **WHEN** an admin edits an application or interceptor entity or passthrough base URL, custom inline translator base URL, or an upstream URL
- **THEN** no plugin-specific control is added to that field

## ADDED Requirements

### Requirement: Plugin base-URL selection
On each supported base-URL field the system SHALL show an accessible group of Url and Plugin radio choices after the field label. Url SHALL be selected for an empty field and SHALL show the existing URL text input. Plugin SHALL show a selector populated with plugin instance names, where each option label and value is `dial-plugin://<name>`. The system SHALL store the selected value in the existing base-URL field, not in a new persisted mode field. A source switch SHALL clear the active base-URL value; existing requiredness rules SHALL then apply. The selected input or selector SHALL have an accessible localized name without a redundant visible Url or Plugin label duplicating the radio caption. The field label, required indication, validation errors and keyboard operation SHALL remain available.

#### Scenario: Select a plugin
- **WHEN** an admin selects Plugin and chooses the instance `example`
- **THEN** the selector displays `dial-plugin://example` and the existing base-URL field contains `dial-plugin://example`

#### Scenario: An empty field starts in Url mode
- **WHEN** an admin opens a supported base-URL field with no value
- **THEN** Url is selected and the URL text input is shown

#### Scenario: Switching away clears the prior source value
- **WHEN** an admin changes from Url to Plugin or from Plugin to Url
- **THEN** the former source value is not retained as the active field value and the field is validated according to its existing requiredness

#### Scenario: Source and active control remain accessible without duplicate labels
- **WHEN** a keyboard or screen-reader user navigates either source choice and its active input or selector
- **THEN** the radio group, both radios and the active control have accessible names, the selected state is exposed, and all controls are keyboard-operable
- **AND** the visible field label and radio captions appear without a second visible Url or Plugin label on the active control

### Requirement: Plugin options use both Core configuration sources
The system SHALL obtain plugin names with the caller's credentials from Core's Platform metadata (`GET /v1/metadata/plugins/platform/`, including all pages) and config-file names (`GET /v1/admin/config/file/plugins`). It SHALL combine the successful results, deduplicate names and use Platform precedence for duplicate names. A partial or total source failure SHALL be reported through an accessible localized warning; successfully read names SHALL remain selectable. A failed read SHALL NOT be presented as a successful empty population or clear an existing reference.

#### Scenario: Both sources contribute options
- **WHEN** Platform contains `one` and config.json contains `two`
- **THEN** the selector offers `dial-plugin://one` and `dial-plugin://two`

#### Scenario: Duplicate names yield one option
- **WHEN** both sources contain a plugin named `one`
- **THEN** the selector offers one `dial-plugin://one` option corresponding to Core's Platform-precedence resolution

#### Scenario: One source fails
- **WHEN** one plugin source fails and the other succeeds
- **THEN** a warning identifies unavailable options, the successful source's names remain selectable, and the current base URL is unchanged

#### Scenario: Neither source can be read
- **WHEN** both plugin sources fail to load
- **THEN** a warning is shown and the existing base URL remains unchanged

### Requirement: Existing plugin references round trip without loss
A value beginning with the exact `dial-plugin://` prefix SHALL open in Plugin mode. The system SHALL interpret the instance name as the characters before the first subsequent slash and preserve the complete stored value, including any suffix, unless the user explicitly changes source or selects a different plugin. A syntactically valid reference absent from the option list SHALL remain visible and SHALL NOT fail existence validation. The system SHALL NOT offer suffix editing in Plugin mode. A blank plugin name SHALL be invalid.

#### Scenario: Preserve an existing suffix
- **WHEN** the stored value is `dial-plugin://example/v2` and the user saves an unrelated edit
- **THEN** the saved base URL remains exactly `dial-plugin://example/v2` and no suffix editor is shown

#### Scenario: Select a different plugin
- **WHEN** the stored value is `dial-plugin://example/v2` and the user selects `dial-plugin://other`
- **THEN** the base URL becomes `dial-plugin://other`

#### Scenario: Referenced plugin is missing
- **WHEN** the stored value names a plugin absent from the loaded options
- **THEN** the reference remains visible and unchanged and does not fail existence validation

#### Scenario: Empty plugin name is invalid
- **WHEN** a stored plugin URL has no nonblank instance name
- **THEN** the field shows a validation error and save is blocked until corrected or cleared where optional

#### Scenario: Discard restores source and value
- **WHEN** the user changes a URL or plugin reference and then discards the edit
- **THEN** the original value and its corresponding Url or Plugin choice are restored
