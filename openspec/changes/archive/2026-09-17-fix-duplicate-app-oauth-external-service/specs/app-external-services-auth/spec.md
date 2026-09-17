## ADDED Requirements

### Requirement: Duplicating an application resets OAuth external services to NONE
The duplicate modal SHALL replace, for every entry in `external_services` whose
`auth_settings.authentication_type === OAUTH`, that entry's `auth_settings` with
`{ authentication_type: NONE }` before the duplicate is created. This applies
in both the `public`-bucket duplicate modal and the `platform`-bucket duplicate modal. An entry whose
`authentication_type` is `API_KEY`, `DIAL_NATIVE`, `NONE`, or unrecognised SHALL be carried over
unchanged — Core never returns a real `client_secret` on read, so an OAuth entry copied verbatim
fails Core's write-time validation with a missing-`CLIENT_SECRET` error; the other types carry no
secret in `auth_settings` and are unaffected by that validation. A service's `display_name` and
`description` are preserved; only its `auth_settings` is replaced.

#### Scenario: Duplicating a public-bucket application with an OAuth external service
- **WHEN** the user duplicates a `public`-bucket application whose `external_services` map contains
  an entry with `auth_settings.authentication_type === OAUTH`
- **THEN** the created duplicate's entry for that service has `auth_settings` equal to
  `{ authentication_type: NONE }`
- **AND** the duplicate is created successfully, with no `CLIENT_SECRET`-required error from Core

#### Scenario: Duplicating a platform-bucket application with an OAuth external service
- **WHEN** the user duplicates a `platform`-bucket application whose `external_services` map contains
  an entry with `auth_settings.authentication_type === OAUTH`
- **THEN** the created duplicate's entry for that service has `auth_settings` equal to
  `{ authentication_type: NONE }`
- **AND** the duplicate is created successfully, with no `CLIENT_SECRET`-required error from Core

#### Scenario: Duplicating an application with a non-OAuth external service
- **WHEN** the user duplicates an application whose `external_services` map contains an entry with
  `auth_settings.authentication_type` set to `API_KEY`, `DIAL_NATIVE`, `NONE`, or a value the
  frontend does not recognise
- **THEN** that entry's `auth_settings` is carried over to the duplicate unchanged

#### Scenario: Duplicating an application with multiple external services
- **WHEN** the user duplicates an application whose `external_services` map contains both an `OAUTH`
  entry and a non-`OAUTH` entry
- **THEN** only the `OAUTH` entry's `auth_settings` is reset to `{ authentication_type: NONE }`
- **AND** the non-`OAUTH` entry is unchanged
- **AND** each entry's `display_name` and `description` are preserved

#### Scenario: Duplicating an application with no external services
- **WHEN** the user duplicates an application whose `external_services` map is empty or absent
- **THEN** the duplicate is created with no `external_services` changes
