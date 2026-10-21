## MODIFIED Requirements

<!--
The first scenario of `Properties tab content` below is authored under its superseded heading
`Entity type offers exactly the five supported kinds`, because a MODIFIED requirement may not drop a
scenario the current spec still has and REMOVED + ADDED of one requirement is rejected outright —
neither route could rename it.

When this delta is synced into the consolidated spec, rename that scenario to
`Entity type offers exactly the four offerable kinds`.

Every other requirement and scenario heading in this delta is already accurate and keeps its name.
-->

### Requirement: Properties tab content

The system SHALL render the catalog-schema Properties tab with the resource info header, the
read-only `$id`, a required entity-type selection, a required display name, and an optional default
locale.

The entity-type selection SHALL offer exactly `model`, `agent`, `toolset`, and `interceptor`.
`skill` SHALL NOT be offered: a skill cannot carry a catalog schema, because `Skill` does not extend
`Deployment` in DIAL Core and the console's Skills view has no catalog surface to feed, so offering it
would invite authoring a schema nothing can reference.

What the selection offers is deliberately narrower than what a save accepts. DIAL Core's catalog
meta-schema allows five values — `model`, `agent`, `toolset`, `skill`, `interceptor` — and `required`s
the field, so a configuration file may legally declare a schema typed `skill`. The save gate SHALL
therefore continue to accept all five, as `Client-side validation replaces Core's absent write-time
checks` requires. Narrowing both halves together is the Issue #4880 regression: the console offered
and accepted the same shortened list, so a legally-typed schema opened and then could never be saved.

When the schema being edited declares an entity kind outside the offered four, the selection SHALL
also offer that kind, so the field shows the schema's real value rather than appearing blank and
discarding it on the next edit.

The entity type SHALL be presented as a declaration of which catalog entity kind the schema is
written for. DIAL Core validates a deployment's `catalog_properties` against the schema its
`catalog_schema_id` names and never checks the deployment's kind against the schema's entity type, so
this value SHALL NOT be enforced as a constraint on save.

#### Scenario: The four fields are shown with the id fixed

- **WHEN** a user opens an existing schema's Properties tab
- **THEN** the read-only `$id`, the entity-type selection, the display name, and the default locale
  are shown

#### Scenario: Entity type offers exactly the five supported kinds

- **WHEN** a user opens the entity-type selection on a schema declaring one of the offered kinds, or
  none
- **THEN** the options are exactly `model`, `agent`, `toolset`, and `interceptor`
- **AND** `skill` is not among them

#### Scenario: Edits round-trip on the resource

- **WHEN** a user edits the display name, entity type, or default locale and saves
- **THEN** a success notification naming the updated schema is shown and the values reappear on
  reload

#### Scenario: A failed save keeps the pending edits

- **WHEN** a save request fails
- **THEN** an error notification carrying the server's message is shown and the edited values are
  still present for a retry

### Requirement: Client-side validation replaces Core's absent write-time checks

DIAL Core SHALL store this resource's body verbatim and validate only the `$id`, so a schema that
violates the catalog meta-schema is accepted on write and only surfaces later — as an `invalid`
status on read, and as a rejected deployment when something references it. The system SHALL block
such a save and SHALL surface the reason to the user.

The enforced rules are: a non-blank `$id`; an entity type within the five values Core's catalog
meta-schema allows; a non-blank display name; a default locale matching `^[a-z]{2}(-[A-Z]{2})?$` when
present; and, for any property declared file-valued, the string type and encoded-file format the
meta-schema requires alongside it.

The entity-type rule SHALL mirror Core's meta-schema exactly — `model`, `agent`, `toolset`, `skill`,
`interceptor` — and SHALL NOT be narrowed to the four kinds the Properties tab offers for authoring.
A schema a configuration file types `skill` SHALL keep saving. Enforcing the narrower offered list
here is the Issue #4880 regression, where a legally-typed schema opened in the console and then failed
every save with a message listing fewer kinds than Core allows.

#### Scenario: A missing display name blocks save

- **WHEN** a user attempts to save a schema with a blank display name
- **THEN** the save action is disabled or rejected and no request reaches Core

#### Scenario: A missing or unsupported entity type blocks save

- **WHEN** a schema carries no entity type, or one outside the five values Core's meta-schema allows
- **THEN** the save is blocked with a message identifying the field
- **AND** a schema typed `skill` is not blocked, even though the Properties tab does not offer that
  kind for authoring

#### Scenario: A malformed default locale blocks save

- **WHEN** a user enters a default locale that is not a BCP-47 language or language-region tag
- **THEN** the save is blocked with a message identifying the expected form

#### Scenario: An inconsistent file-valued property blocks save

- **WHEN** a property is declared file-valued without the string type and encoded-file format the
  meta-schema requires
- **THEN** the save is blocked with a message identifying the offending property

#### Scenario: The raw JSON editor is gated by the same rules

- **WHEN** a user edits the schema through the raw JSON editor and introduces any of the violations
  above
- **THEN** the save is blocked with the same message, rather than the editor bypassing validation
