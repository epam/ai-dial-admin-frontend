# deployment-interfaces-config delta

## ADDED Requirements

### Requirement: Interface base_url required only without an entity-level fallback
A passthrough interface row's `base_url` input SHALL be required only while the entity-level
`base_url` is empty, on the views that render an entity-level `base_url` field — Assets → Models
(platform models), Assets → Applications, and Assets → Platform Applications. The label's required
marker SHALL follow the same condition. Views with no entity-level `base_url` (Entities → Models,
Entities → Applications, Entities → Interceptors, Assets → Platform Interceptors) SHALL keep the
interface `base_url` unconditionally required.

This mirrors DIAL Core: `passthroughBaseUrl` falls back to the deployment-level base URL, and Core's
config validation flags a passthrough interface only when both the interface `base_url` and the
deployment base URL are absent.

#### Scenario: Interface base_url optional when entity base_url is set
- **WHEN** an admin opens a platform model whose entity-level `base_url` is populated, adds a
  passthrough interface with an empty `base_url`, and saves
- **THEN** no required error is shown on the interface row, its label carries no required marker,
  and the save succeeds

#### Scenario: Interface base_url required when entity base_url is empty
- **WHEN** the entity-level `base_url` is empty and an interface row's `base_url` is empty
- **THEN** the interface `base_url` input shows the required error, its label carries the required
  marker, and saving is blocked until either the interface `base_url` or the entity-level `base_url`
  is filled

#### Scenario: Clearing the entity base_url re-flags an existing empty interface row
- **WHEN** an interface row with an empty `base_url` is valid (entity-level `base_url` populated)
  and the admin clears the entity-level `base_url`
- **THEN** the interface row immediately shows the required error and saving is blocked

#### Scenario: Refilling the entity base_url clears the interface row's required error
- **WHEN** an interface row shows the required error because the entity-level `base_url` was empty,
  and the admin fills the entity-level `base_url`
- **THEN** the interface row's required error clears and the row is valid with its `base_url` still
  empty

#### Scenario: Entity-backed views keep the unconditional requirement
- **WHEN** an admin leaves an interface `base_url` empty on Entities → Models, Entities →
  Applications, Entities → Interceptors, or Assets → Platform Interceptors
- **THEN** the required error is shown regardless of any other field on the form, and saving is
  blocked

## MODIFIED Requirements

### Requirement: Stripping empty interface values on save
Before persisting an entity, an interface entry's empty or blank `base_url`/`baseUrl` value SHALL
be omitted from that entry in the payload sent to the backend (stored as absent in draft state, so
no empty string ever reaches the wire); the entry itself SHALL be retained, whatever else it
carries. An empty string on the wire is not an absent value to DIAL Core — it is a present, broken
base URL — so the field is omitted rather than sent blank.

#### Scenario: Empty interface base_url is omitted while the entry is kept
- **WHEN** an admin saves a platform model whose entity-level `base_url` is set with a passthrough
  interface whose `base_url` is empty
- **THEN** the save payload includes that interface entry with no `base_url`/`baseUrl` field on it

#### Scenario: An entry carrying only an omitted base_url is persisted
- **WHEN** an admin adds an interface row, leaves its `base_url` empty, changes nothing else on the
  row, and saves
- **THEN** the payload includes the interface entry (it declares the interface served by the
  entity-level base URL), and reloading the entity shows that row with an empty `base_url` input

#### Scenario: Non-base_url values are persisted unchanged
- **WHEN** an interface entry carries a translator, defaults, features, or default headers and its
  `base_url` is empty
- **THEN** the save payload includes the entry with those values intact and no `base_url`/`baseUrl`
  field

#### Scenario: Non-empty interface entries are persisted unchanged
- **WHEN** an admin configures an interface with a non-empty `base_url` value and saves
- **THEN** the save payload includes that interface entry with its value intact
