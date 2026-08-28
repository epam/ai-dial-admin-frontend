## MODIFIED Requirements

### Requirement: Each option carries its origin and the reference form that origin requires
DIAL Core keys the five deployment/role entity types — models, interceptors, roles, applications, and toolsets — in its merged `Config` maps by their **bare short name**, for both the config-file and API-written (platform) populations alike (`MergedConfigStore.isShortNameKeyed` returns true for exactly those five). Core validates a reference with a plain `containsKey(ref)` against that one map. Routes and keys are not short-name-keyed: an API-written route is still referenced by its canonical id (`routes/<bucket>/<name>`) and an API-written key by `keys/<bucket>/<name>`, while their config-file entries keep bare names. The system SHALL attach an explicit origin discriminator to every option and SHALL derive the stored reference from the entity **type** (short-name form for the five short-name-keyed types; the existing origin-based form for routes and keys), rather than inferring either from the shape of a value.

#### Scenario: A short-name-keyed entity is referenced by bare name from either population
- **WHEN** an option of a short-name-keyed type (model, interceptor, role, application, or toolset) is selected, regardless of whether it originated in the config-file or API-written population
- **THEN** the value stored on the resource is that entity's bare name

#### Scenario: A route is referenced by its population-appropriate form
- **WHEN** an option originating in the config-file route population is selected
- **THEN** the value stored on the resource is that route's bare name
- **AND WHEN** an option originating in the API-written route population is selected
- **THEN** the value stored on the resource is that route's canonical id `routes/<bucket>/<name>`

#### Scenario: A key is referenced by its population-appropriate form
- **WHEN** an option originating in the config-file key population is selected
- **THEN** the value stored on the resource is that key's bare name
- **AND WHEN** an option originating in the API-written key population is selected
- **THEN** the value stored on the resource is that key's canonical id `keys/<bucket>/<name>`

#### Scenario: Origin is explicit, not inferred
- **WHEN** an option is built
- **THEN** it carries an origin discriminator as data, so a name that happens to contain a separator is never mistaken for a canonical id

### Requirement: A name present in both populations is offered once, with the platform entry winning
Because the five short-name-keyed types share one map key (the bare name) across both populations, a name present in both would yield two options with the same stored reference — a duplicate Core resolves by letting the blob (platform) entry supersede the file entry via ordinary `Map.put`. The system SHALL offer a name present in both populations as a single option, keeping the API-written (platform) option and dropping the config-file duplicate, and SHALL still carry the origin discriminator on the surviving option. Duplicates within a single population are still collapsed to one.

#### Scenario: A name in both populations yields one platform-origin option
- **WHEN** the same entity name of a short-name-keyed type exists in both the config-file and API-written populations
- **THEN** a single option is offered, carrying the `Api` (platform) origin, and selecting it stores the bare name
- **AND** the config-file entry of that name is not offered as a separate option

#### Scenario: Duplicates within one population are collapsed
- **WHEN** the same name appears more than once within a single population
- **THEN** it is offered once

#### Scenario: A name present in only one population is offered from that population
- **WHEN** an entity name exists in only the config-file or only the API-written population
- **THEN** it is offered as one option carrying its actual origin
