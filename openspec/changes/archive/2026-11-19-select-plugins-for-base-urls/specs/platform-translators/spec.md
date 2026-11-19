## MODIFIED Requirements

### Requirement: Properties tab content
The system SHALL render the translator asset's Properties tab with two fields sourced from the interface-type population, `in` and `out`, and one required `baseUrl` field offering Url and Plugin choices — no display name, description, icon, endpoint-list, or topics control, since none of those exist on `Translator`. The same base-URL choice and required validation SHALL be available in the standalone Translator create form. The field SHALL write the existing Core translator `baseUrl` property. Save, create, discard, read-only behavior and existing action success and error notifications SHALL remain unchanged.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits `in`, `out`, or `baseUrl` and saves
- **THEN** the value is stored on the translator resource and reappears on reload

#### Scenario: Create a translator referencing a plugin
- **WHEN** an admin selects `dial-plugin://example` as the required base URL in the standalone Translator create form and submits valid fields
- **THEN** the Core translator write carries `baseUrl: "dial-plugin://example"` and the existing create success behavior occurs

#### Scenario: Save a translator referencing a plugin
- **WHEN** an admin selects a plugin in an existing standalone Translator and saves
- **THEN** the existing `baseUrl` property is updated and reload displays Plugin mode with the saved reference

#### Scenario: A required base URL is missing
- **WHEN** an admin selects Plugin but does not select a plugin for a standalone Translator
- **THEN** the base-URL field shows a required error and create or save is blocked

#### Scenario: A read-only translator remains read-only
- **WHEN** an admin opens a read-only standalone Translator with a plugin base URL
- **THEN** the saved reference is visible without offering an editable source choice or selector

#### Scenario: Core rejects a write
- **WHEN** Core rejects creation or saving a translator with a plugin base URL
- **THEN** the existing error notification shows Core's message and the user's edits remain available
