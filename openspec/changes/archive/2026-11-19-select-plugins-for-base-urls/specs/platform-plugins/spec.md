## MODIFIED Requirements

### Requirement: Plugin entries are not connected to other entities in this version
The system SHALL provide plugin base-URL selection for platform models, their passthrough interfaces, and standalone Translator create and detail forms. Other surfaces, including applications, routers, interceptors, upstreams and custom inline translators, SHALL retain their existing controls and validation. The system SHALL NOT require an existing plugin entry to retain a previously saved reference or block plugin deletion because of a reference.

#### Scenario: Model and translator support plugin selection
- **WHEN** an admin edits a platform model base URL, its passthrough interface base URL, or a standalone Translator base URL
- **THEN** the field offers Url and Plugin choices

#### Scenario: Other URL fields are unchanged
- **WHEN** an admin edits an application, router, interceptor, upstream or custom inline translator base URL
- **THEN** no plugin-specific control is added to that field

## ADDED Requirements

### Requirement: Plugin base-URL selection
On each supported base-URL field the system SHALL show an accessible group of Url and Plugin radio choices after the field label. Url SHALL be selected for an empty field and SHALL show the existing URL text input. Plugin SHALL show a selector populated with plugin instance names, where each option label and value is `dial-plugin://<name>`. The system SHALL store the selected value in the existing base-URL field, not in a new persisted mode field. A source switch SHALL clear the active base-URL value; existing requiredness rules SHALL then apply.

#### Scenario: Select a plugin
- **WHEN** an admin selects Plugin and chooses the instance `example`
- **THEN** the selector displays `dial-plugin://example` and the existing base-URL field contains `dial-plugin://example`

#### Scenario: An empty field starts in Url mode
- **WHEN** an admin opens a supported base-URL field with no value
- **THEN** Url is selected and the URL text input is shown

#### Scenario: Switching away clears the prior source value
- **WHEN** an admin changes from Url to Plugin or from Plugin to Url
- **THEN** the former source value is not retained as the active field value and the field is validated according to its existing requiredness

#### Scenario: Radio controls are accessible
- **WHEN** a keyboard or screen-reader user navigates to the source choices
- **THEN** both radios have accessible names, expose their selected state and can be operated with the keyboard

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
