## ADDED Requirements

### Requirement: Duplicating a platform-bucket toolset resets OAuth auth settings to NONE
The platform-bucket duplicate modal SHALL replace, when a `platform`-bucket toolset's
`auth_settings.authentication_type === OAUTH` is duplicated, that `auth_settings` with
`{ authentication_type: NONE }` before the duplicate is created, matching the existing
`public`-bucket toolset duplicate behavior. Core never returns a real `client_secret` on read, so an
OAuth `auth_settings` copied verbatim fails Core's write-time validation with a
missing-`CLIENT_SECRET` error. A toolset whose `authentication_type` is `API_KEY`, `NONE`,
`DIAL_NATIVE`, or unrecognised SHALL be carried over unchanged.

#### Scenario: Duplicating a platform toolset with OAuth auth settings
- **WHEN** the user duplicates a `platform`-bucket toolset with `auth_settings.authentication_type
  === OAUTH`
- **THEN** the created duplicate has `auth_settings` equal to `{ authentication_type: NONE }`
- **AND** the duplicate is created successfully, with no `CLIENT_SECRET`-required error from Core

#### Scenario: Duplicating a platform toolset with non-OAuth auth settings
- **WHEN** the user duplicates a `platform`-bucket toolset whose `authentication_type` is `API_KEY`,
  `NONE`, `DIAL_NATIVE`, or a value the frontend does not recognise
- **THEN** `auth_settings` is carried over to the duplicate unchanged
