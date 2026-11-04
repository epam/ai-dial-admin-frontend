## ADDED Requirements

### Requirement: Assets OAuth settings expose an optional Resource field
The Assets OAuth auth-settings editor (shared by Assets toolsets and application external services) SHALL show
an optional "Resource" field after the Token endpoint. A non-empty value SHALL be a valid http(s) URL; an
invalid value SHALL show an inline error and SHALL disable Save, and an empty value SHALL be valid. The field
SHALL be disabled while the user is signed in to the toolset, like the other auth fields. The field SHALL NOT
exist in the legacy Toolsets UI.

#### Scenario: Field is shown and optional
- **WHEN** a user opens the OAuth auth settings of an Assets toolset or an application external service
- **THEN** a Resource field is shown after the Token endpoint
- **AND** leaving it empty shows no error and does not block Save

#### Scenario: Stored value is shown
- **WHEN** the loaded auth settings carry a `resource`
- **THEN** the Resource field shows that value

#### Scenario: Invalid value
- **WHEN** the user types a value that is not a valid http(s) URL into the Resource field
- **THEN** an inline URL error is shown and Save is disabled

#### Scenario: Signed-in lock
- **WHEN** the user is signed in to the toolset
- **THEN** the Resource field is disabled

#### Scenario: Legacy Toolsets unaffected
- **WHEN** a user opens the OAuth settings of a legacy (config) toolset
- **THEN** no Resource field is shown

### Requirement: Resource is saved as typed, with a blank value meaning clear
When saving Assets OAuth auth settings, the system SHALL send `resource` exactly as held in the form: an
unchanged value as loaded, a changed value as typed, and a field the user cleared as a blank string. It SHALL
NOT convert a blank `resource` to an omitted key, and SHALL NOT strip it the way an empty `client_secret` is
stripped.

#### Scenario: Save without touching the field
- **WHEN** the user saves settings that were loaded with a `resource` without editing it
- **THEN** the request carries the same `resource`

#### Scenario: Clearing the field
- **WHEN** the user empties the Resource field and saves
- **THEN** the request carries `resource` as an empty string

#### Scenario: Changing the field
- **WHEN** the user replaces the value and saves
- **THEN** the request carries the new `resource`

#### Scenario: Settings never had a resource
- **WHEN** the user saves settings loaded without `resource` and does not fill the field
- **THEN** the request carries no `resource` key

#### Scenario: External services in an application
- **WHEN** the user saves an application with OAuth external services
- **THEN** each service's auth settings keep their `resource` under the same rules
