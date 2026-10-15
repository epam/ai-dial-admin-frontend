## ADDED Requirements

### Requirement: Stored client secret is represented by a masked placeholder
When an Assets OAuth auth-settings entity (an Assets toolset or an application external service) is
loaded with a `client_secret_hint`, the Client Secret field SHALL show a `••••` placeholder with an empty
value, SHALL NOT show the "This field is required" error, and SHALL NOT block Save while the field is empty.

#### Scenario: Saved OAuth toolset opens with a stored secret
- **WHEN** a user opens an Assets toolset whose OAuth auth settings carry a `client_secret_hint`
- **THEN** the Client Secret field is empty and shows the `••••` placeholder
- **AND** no "This field is required" error is shown for Client Secret
- **AND** the Save button is not disabled by the Client Secret field

#### Scenario: Application external service with a stored secret
- **WHEN** a user opens an application external service whose OAuth auth settings carry a `client_secret_hint`
- **THEN** its Client Secret field behaves as in the toolset scenario

#### Scenario: No stored secret
- **WHEN** the OAuth auth settings carry no `client_secret_hint` and the Client Secret is empty
- **THEN** the "This field is required" error is shown and Save is disabled

#### Scenario: Typing a new secret
- **WHEN** the user types a value into the Client Secret field of settings that carry a hint
- **THEN** the typed value is shown masked and treated as a new secret

#### Scenario: Clearing a typed secret
- **WHEN** the user clears a secret they typed into a field whose settings carry a hint
- **THEN** the field returns to the empty `••••` placeholder state with no error and Save is not blocked

#### Scenario: Signed-in lock unchanged
- **WHEN** the user is signed in to the toolset
- **THEN** the auth settings remain locked and the Client Secret field is disabled

### Requirement: A typed client secret has a minimum length
In the Assets OAuth auth settings, a non-empty Client Secret the user typed SHALL be at least 8
characters, matching core's write validation. A shorter value SHALL show an inline error and SHALL disable
Save. An empty value is governed by the stored-secret requirement above. The rule SHALL NOT apply to the
legacy Toolsets UI.

#### Scenario: Typed secret is too short
- **WHEN** the user types 1 to 7 characters into the Client Secret field
- **THEN** an error stating the 8-character minimum is shown and Save is disabled

#### Scenario: Typed secret reaches the minimum
- **WHEN** the user extends the value to 8 or more characters
- **THEN** the error clears and Save is no longer blocked by the field

#### Scenario: Short typed secret over a stored secret
- **WHEN** settings carry a `client_secret_hint` and the user types fewer than 8 characters
- **THEN** the minimum-length error is shown and Save is disabled until the value is cleared or lengthened

#### Scenario: Legacy Toolsets unaffected
- **WHEN** a user types a short Client Secret in the legacy Toolsets UI
- **THEN** no minimum-length error is shown

### Requirement: Client secret is omitted from the save payload unless the user typed one
When saving Assets OAuth auth settings, the system SHALL omit `client_secret` from the payload when it is
empty, and SHALL always omit `client_secret_hint`, so that core keeps the stored secret.

#### Scenario: Save without touching the secret
- **WHEN** the user saves a toolset whose settings carry a `client_secret_hint` without typing a secret
- **THEN** the request carries neither `client_secret` nor `client_secret_hint`

#### Scenario: Save with a new secret
- **WHEN** the user types a new secret and saves
- **THEN** the request carries the typed `client_secret` and no `client_secret_hint`

#### Scenario: External services in an application
- **WHEN** the user saves an application with OAuth external services
- **THEN** each service's auth settings follow the same omission rules

### Requirement: Duplicating an OAuth resource still resets its auth settings
Duplicating an Assets toolset or application whose auth type is OAuth SHALL continue to reset the copy's
auth settings to `NONE`, regardless of `client_secret_hint`, because a stored secret cannot be copied.

#### Scenario: Duplicate OAuth toolset with a hint
- **WHEN** the user duplicates an OAuth toolset whose settings carry a `client_secret_hint`
- **THEN** the copy's auth settings are `{ authentication_type: NONE }`
