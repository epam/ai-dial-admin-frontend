## ADDED Requirements

### Requirement: Read-only access to DIAL Core's config-file entities
The system SHALL provide a server-side client for DIAL Core's config-file entity surface (`GET /v1/admin/config/file/{type}` to list, `GET /v1/admin/config/file/{type}/{name}` to read one), authenticated with the caller's JWT through the existing Core client pipeline. This is a separate route family from the resource and metadata routes the asset client covers, and it is the only surface exposing entities defined in Core's configuration files.

#### Scenario: Config-file entities are listed from Core
- **WHEN** the config-file entities of a supported type are requested
- **THEN** the request goes to DIAL Core's config-file route, never to the admin backend

#### Scenario: The surface is read-only
- **WHEN** any operation on this client is invoked
- **THEN** only reads are available; the client SHALL NOT offer create, update, or delete, because Core's config-file entities are owned by whoever deploys the configuration

#### Scenario: A type Core refuses is surfaced as a failure, not an empty list
- **WHEN** a config-file read targets a type Core declines to serve
- **THEN** the client reports a failure distinguishable from a successful empty result, so a caller cannot mistake "forbidden" for "none defined"

### Requirement: Entity types this client may be asked for are constrained
Core does not serve every type on this route family to every caller — reading the key type is refused outright for all callers, admin included, because the file map's keys are themselves secrets. The system SHALL therefore treat the readable set as an explicit allow-list rather than assuming any type accepted by the route pattern is retrievable.

#### Scenario: A non-readable type is rejected before the request
- **WHEN** a caller requests a config-file type that Core does not serve
- **THEN** the client refuses without issuing the request, rather than surfacing Core's refusal as a generic error

### Requirement: The two Core populations of one entity type are read as a union
DIAL Core keeps the entities of a given type in two places, and its merged runtime configuration is the union of both: entities written through its API, listed by the metadata route, and entities defined in configuration files, listed by the config-file route. Core validates a reference against that merged set. The system SHALL therefore compose both reads when offering an entity as a selectable option, so the offered set matches the set Core will accept.

#### Scenario: Both populations appear as options
- **WHEN** options of a given entity type are requested for a picker
- **THEN** the result contains entries from both the API-written population and the config-file population

#### Scenario: The union is not sourced from the admin backend
- **WHEN** the union is composed
- **THEN** both halves come from DIAL Core, and no admin-backend request contributes to it — an admin-backend list may contain entities not yet present in Core, which would be offered and then rejected on write

#### Scenario: One population failing does not empty the picker
- **WHEN** one of the two reads fails and the other succeeds
- **THEN** the successful population is still offered, and the failure is reported rather than silently reducing the option set

#### Scenario: Both populations failing is reported
- **WHEN** both reads fail
- **THEN** the caller receives a failure rather than an empty option set

### Requirement: The union normalises to the fields both populations provide
The two populations do not carry the same data, and neither carries a description. The metadata route returns per-entry author and timestamps; the config-file listing returns a name and nothing else. The system SHALL normalise an option to the fields available from both — its name and its origin — rather than issuing a per-entity read to fill fields a listing omits.

#### Scenario: An option carries a name and an origin, and no descriptive fields
- **WHEN** an option is built from either population
- **THEN** it carries its name and origin, and any column neither listing provides renders empty rather than triggering an additional request per entry

#### Scenario: Listing either population costs one request
- **WHEN** a population of a type is listed
- **THEN** the whole population is retrieved without a per-entry follow-up read

#### Scenario: An empty descriptive field is explained by the origin
- **WHEN** a user sees an option with no description
- **THEN** that option's origin is visible, so the absence reads as a property of its source rather than as missing data

### Requirement: Each option carries its origin and the reference form that origin requires
The two populations are referenced differently: a config-file entity by its bare name, an API-written entity by its canonical id (`{type}/platform/{name}`). The same display name may exist in both. The system SHALL attach an explicit origin discriminator to every option and SHALL derive the stored reference from that origin, rather than inferring either from the shape of a value.

#### Scenario: A config-file entity is referenced by bare name
- **WHEN** an option originating in the config-file population is selected
- **THEN** the value stored on the resource is that entity's bare name

#### Scenario: An API-written entity is referenced by canonical id
- **WHEN** an option originating in the API-written population is selected
- **THEN** the value stored on the resource is that entity's canonical id

#### Scenario: Origin is explicit, not inferred
- **WHEN** an option is built
- **THEN** it carries an origin discriminator as data, so a name that happens to contain a separator is never mistaken for a canonical id

### Requirement: A name present in both populations is offered once per origin and distinguishable
Because the same name can exist in both populations and the two are referenced differently, collapsing them would make the stored reference ambiguous. The system SHALL keep both entries and SHALL make their origin visible to the user.

#### Scenario: A name in both populations yields two distinguishable options
- **WHEN** the same entity name exists in both the config-file and API-written populations
- **THEN** both are offered, each showing which population it came from, and selecting one stores that population's reference form

#### Scenario: Duplicates within one population are collapsed
- **WHEN** the same name appears more than once within a single population
- **THEN** it is offered once
