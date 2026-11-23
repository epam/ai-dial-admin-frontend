## ADDED Requirements

### Requirement: Discovery URL is a valid http(s) URL, required only for automatic registration
The Discovery URL field SHALL accept an absolute `http` or `https` URL. A non-empty value that is not one SHALL
show an inline URL error and SHALL disable Apply and Save. An empty value SHALL be valid in "Existing client" mode
and SHALL be invalid in "Register automatically" mode, where the field is required. The field SHALL be disabled
while the user is signed in to the service, like the other auth fields.

#### Scenario: Optional for an existing client
- **WHEN** the registration type is "Existing client" and the Discovery URL is empty
- **THEN** no error is shown and Apply is not blocked by it

#### Scenario: Required for automatic registration
- **WHEN** the registration type is "Register automatically" and the Discovery URL is empty
- **THEN** a required-field error is shown and Apply is disabled

#### Scenario: Not a valid URL
- **WHEN** the user types a value that is not an absolute http(s) URL
- **THEN** an inline URL error is shown and Apply is disabled

#### Scenario: Signed-in lock
- **WHEN** the user is signed in to the service
- **THEN** the Discovery URL field is disabled

### Requirement: Discovery URL is saved as typed, with a blank value meaning clear
When saving external service OAuth settings the system SHALL send `discovery_url` as held in the form: an unchanged
value as loaded, a changed value as typed, and a field the user cleared as a blank string. It SHALL NOT convert a
blank value to an omitted key, because Core keeps the stored value when the key is omitted. Settings that never
had a `discovery_url` and were not given one SHALL carry no `discovery_url` key.

#### Scenario: Clearing a stored value
- **WHEN** the user empties the Discovery URL of a stored service and saves
- **THEN** the request carries `discovery_url` as an empty string

#### Scenario: Never had one
- **WHEN** the user saves a service that has no Discovery URL without filling the field
- **THEN** the request carries no `discovery_url` key

### Requirement: Automatic registration does not require client credentials
Automatic registration SHALL NOT require client credentials: while the registration type is "Register automatically"
the Client ID, Client Secret, Authorization endpoint and Token endpoint controls SHALL NOT be mounted, and their
validation entries SHALL NOT block Apply or Save, by the same rule as "Inactive OAuth credentials do not block
saving". Switching to "Existing client" SHALL validate those
controls with the existing rules. Choosing "Use an existing client instead" on a registered client SHALL require a
non-empty Client ID and a Client Secret that meets the minimum length before Apply is enabled.

#### Scenario: Empty client fields do not block automatic registration
- **WHEN** the registration type is "Register automatically" with a valid Discovery URL
- **THEN** Apply is enabled although no client id, secret or endpoint is entered

#### Scenario: Switching back validates the client fields
- **WHEN** the user switches from "Register automatically" to "Existing client" with the fields empty
- **THEN** the empty required fields are reported and block Apply

#### Scenario: Converting a registered client
- **WHEN** the user chooses "Use an existing client instead"
- **THEN** Client ID and Client Secret are empty and required, and Apply is disabled until both are valid

### Requirement: Token endpoint authentication method "None" is stored as `none`
The token endpoint authentication method "None" SHALL be saved as `none` on every OAuth form that offers it, for
Assets toolsets and application external services alike, and a stored `none` SHALL be shown as "None". The value
`client_secret_none` SHALL NOT be sent.

#### Scenario: Choosing None
- **WHEN** the user selects "None" as the token endpoint authentication method and saves
- **THEN** the request carries `token_endpoint_auth_method: "none"`

#### Scenario: Stored none is shown
- **WHEN** a service or toolset is loaded with `token_endpoint_auth_method: "none"`
- **THEN** the selector shows "None"
