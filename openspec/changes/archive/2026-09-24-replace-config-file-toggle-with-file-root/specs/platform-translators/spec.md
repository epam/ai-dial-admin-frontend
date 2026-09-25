## MODIFIED Requirements

### Requirement: Translator asset list is flat with create and delete actions
The system SHALL render the translator asset list with flat `platform` and synthetic `file` roots, built on the shared asset list. The `platform` root SHALL retain create, delete, and bulk-delete actions; the `file` root SHALL list config-file-defined translators and expose no mutating or folder action.

#### Scenario: Translator resource list remains mutable
- **WHEN** a user browses the `platform` root on `/platform-translators`
- **THEN** create, delete, and bulk-delete actions remain available according to the user's permissions

#### Scenario: Translator file root is read-only
- **WHEN** a user opens the `file` root on `/platform-translators`
- **THEN** config-file translator names are listed and no create, delete, bulk-delete, duplicate, move, rename, or folder action is offered

### Requirement: Translator asset detail view tab set
The system SHALL render a translator detail view with exactly one `Properties` tab for both resource and file-defined translators. A file-defined translator opened from the `file` root SHALL be read through DIAL Core's config-file read endpoint and rendered read-only; it SHALL hide the ADMIN|CORE JSON format selector.

#### Scenario: File-defined Translator opens read-only
- **WHEN** a user opens a Translator from the `file` root
- **THEN** the system opens `/platform-translators/{id}?configFile=true`, reads it from the config-file endpoint, and renders all detail fields read-only

#### Scenario: File-defined Translator hides format selection
- **WHEN** a user opens the JSON editor for a file-defined Translator
- **THEN** no ADMIN|CORE format selector is rendered

### Requirement: Translators are readable through the config-file client
The system SHALL include `translators` in the config-file client entity-type enum and readable-type allow-list so the translator file root and its detail route can read DIAL Core configuration-file entities. This SHALL not widen unrelated attach-picker behavior.

#### Scenario: Translator config-file read is accepted
- **WHEN** the translator list or detail route requests a config-file entity of type `translators`
- **THEN** the config-file client accepts the type and reads Core's corresponding endpoint
