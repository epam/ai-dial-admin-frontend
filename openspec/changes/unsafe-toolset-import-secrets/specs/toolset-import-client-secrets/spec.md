## ADDED Requirements

### Requirement: Feature flag gates the behavior

The system SHALL enable the client-secret handling only when the server env variable
`ENABLE_UNSAFE_TOOLSET_IMPORT` is truthy, the import is opened from the toolsets list, and the selected
file type is JSON. In every other case the import modal SHALL behave exactly as before.

#### Scenario: Flag off
- **WHEN** `ENABLE_UNSAFE_TOOLSET_IMPORT` is unset or falsy and a JSON file with OAUTH toolsets reaches the Properties step
- **THEN** no warning is shown, no `Client secret` column is rendered, and Finish sends the toolsets unchanged

#### Scenario: Archive import
- **WHEN** the flag is on and the user selects the ZIP archive file type
- **THEN** no warning or `Client secret` column is shown and the archive is imported unchanged

#### Scenario: Other routes
- **WHEN** the flag is on and the import modal is opened for prompts, applications or files
- **THEN** the modal behaves exactly as before

### Requirement: Warning for OAUTH toolsets on the Properties step

The system SHALL show a warning notification under the Conflict Resolution radios when the behavior is
enabled and the parsed JSON contains at least one toolset whose `auth_settings.authentication_type` is
`OAUTH`. The notification title SHALL read "Client secrets aren’t included in imports. Add them manually to activate the imported toolsets.". The notification SHALL show its
details — that the real secret can be entered in the table now or changed later on the toolset page, that
`REPLACE_WITH_REAL_SECRET` can be edited or left for now, and that OAuth sign-in will not work until a real
secret is set — in a tooltip while the user hovers it, and SHALL also expose the same details to screen
readers without hovering. When no parsed toolset is OAUTH the notification SHALL NOT be shown.

#### Scenario: Warning shown
- **WHEN** the flag is on and the JSON file contains an OAUTH toolset
- **THEN** the warning with the title above is visible under the Conflict Resolution radios

#### Scenario: Details on hover
- **WHEN** the user hovers the warning
- **THEN** a tooltip shows the details, and before hovering the details are not visible on screen

#### Scenario: No OAUTH toolsets
- **WHEN** the flag is on and the JSON file contains only toolsets with other authentication types
- **THEN** the warning is not shown

### Requirement: Override warning

While the Override resolution is selected, the warning SHALL include an additional line stating that
overriding an existing toolset with the placeholder replaces its stored secret (and converts a
dynamically-registered toolset to a static one). The line SHALL also explain that clearing the secret
value tells the system the secret already exists in Core and must not be rewritten, and that clearing it
for a toolset that does not exist yet makes the import of that toolset fail. It SHALL mention that the
user can alternatively choose Skip. The line SHALL NOT be shown while Skip is selected.

#### Scenario: Override selected
- **WHEN** the warning is visible and the user selects Override
- **THEN** the additional Override line is shown, including that a cleared value means the secret already exists in Core and is kept, and that clearing it for a new toolset makes its import fail

#### Scenario: Skip selected
- **WHEN** the warning is visible and the user selects Skip
- **THEN** the additional Override line is not shown

### Requirement: Masked Client secret column

When the warning applies, the preview grid SHALL include an editable `Client secret` column. Rows of OAUTH
toolsets SHALL show a masked input with a reveal toggle, defaulting to `REPLACE_WITH_REAL_SECRET` unless
the file already carries a non-blank `client_secret`. Rows of other toolsets SHALL show an empty,
non-editable cell. The input SHALL have an accessible name, SHALL NOT be autofilled by the browser, and
SHALL NOT reveal its value in a tooltip. The column SHALL be absent when no parsed toolset is OAUTH.

#### Scenario: Default value
- **WHEN** the Properties step shows an OAUTH toolset exported without a secret
- **THEN** its Client secret cell holds `REPLACE_WITH_REAL_SECRET`, masked, and revealing it shows that text

#### Scenario: User enters a secret
- **WHEN** the user types a value into an OAUTH row's Client secret cell
- **THEN** that value is kept for that toolset and is not shown in clear text unless revealed

#### Scenario: Non-OAUTH row
- **WHEN** a toolset in the file has authentication type `API_KEY` or `NONE`
- **THEN** its Client secret cell is empty and cannot be edited

### Requirement: Client secret applied on Finish

When the user clicks Finish with the behavior enabled, the system SHALL, for every OAUTH toolset in the
JSON payload, send `auth_settings.client_secret` as follows: a non-blank value (entered or already in the
file) is sent unchanged; an untouched, absent value is sent as `REPLACE_WITH_REAL_SECRET`; a blank value
(cleared by the user) is sent as `REPLACE_WITH_REAL_SECRET` under Skip and omitted under Override.
`client_secret_hint` SHALL be removed from those toolsets. Toolsets with any other authentication type
SHALL be sent unchanged. The fill SHALL apply whether the payload comes from the grid's recorded edits or from the parsed file.

#### Scenario: Untouched OAUTH toolset
- **WHEN** the user clicks Finish without editing the Client secret cell
- **THEN** the toolset is imported with `client_secret` equal to `REPLACE_WITH_REAL_SECRET` and without `client_secret_hint`

#### Scenario: Entered secret
- **WHEN** the user entered `my-real-secret-123` for an OAUTH toolset and clicks Finish
- **THEN** the toolset is imported with `client_secret` equal to `my-real-secret-123`

#### Scenario: Cleared cell under Override
- **WHEN** the user cleared an OAUTH row's cell, selected Override, and clicks Finish
- **THEN** the toolset is sent without `client_secret`

#### Scenario: Cleared cell under Skip
- **WHEN** the user cleared an OAUTH row's cell, selected Skip, and clicks Finish
- **THEN** the toolset is sent with `client_secret` equal to `REPLACE_WITH_REAL_SECRET`

#### Scenario: Finish with no grid edits recorded
- **WHEN** the user clicks Finish and the preview grid has recorded no edits (the import falls back to the parsed file)
- **THEN** each OAUTH toolset is still sent with the placeholder secret

#### Scenario: Other authentication types
- **WHEN** the payload contains an `API_KEY` toolset
- **THEN** it is sent unchanged

### Requirement: Flag documented

The system SHALL document `ENABLE_UNSAFE_TOOLSET_IMPORT` in the README environment-variable table
(optional, boolean, default false, with the consequence of enabling it) and as a commented entry in
`.env.template`.

#### Scenario: Documentation present
- **WHEN** a maintainer reads the README env table or `.env.template`
- **THEN** `ENABLE_UNSAFE_TOOLSET_IMPORT` is listed with its default and a note that imported OAUTH toolsets need a real client secret afterwards
