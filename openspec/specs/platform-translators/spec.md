# platform-translators Specification

## Purpose
The `Catalog > Translators` surface — menu entry, flat asset list with create and delete actions,
and a detail view with a single Properties tab exposing `in`, `out`, and `baseUrl` fields, sourced
entirely from DIAL Core. Translators are flat platform resources with no folder nesting, no
display-name field, no Roles tab, and no dependency on the admin backend. `in` and `out` select
from the shared `DeploymentInterfaceType` values; Core validates the write and surfaces any
rejection message verbatim. Created by archiving change `add-platform-translators`.

## Requirements

### Requirement: Catalog > Translators menu entry
The system SHALL add a `Translators` menu item to the Catalog section of the admin menu, directly
after `Interceptors`, linking to a new `/platform-translators` route.

#### Scenario: Translators follows Interceptors in the Catalog section
- **WHEN** the Catalog section of the menu renders
- **THEN** `Translators` appears immediately after `Interceptors` and before `Routes`

### Requirement: Translator asset list is flat with create and delete actions
The system SHALL render the translator asset list with flat `platform` and synthetic `file` roots, built on the shared asset list. The `platform` root SHALL retain create, delete, and bulk-delete actions; the `file` root SHALL list config-file-defined translators and expose no mutating or folder action.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-translators`
- **THEN** all translator resources are shown as direct entries with no folder-expand affordance

#### Scenario: Translator resource list remains mutable
- **WHEN** a user browses the `platform` root on `/platform-translators`
- **THEN** create, delete, and bulk-delete actions remain available according to the user's permissions

#### Scenario: Translator file root is read-only
- **WHEN** a user opens the `file` root on `/platform-translators`
- **THEN** config-file translator names are listed and no create, delete, bulk-delete, duplicate, move, rename, or folder action is offered

#### Scenario: No create-folder, move, or duplicate action is present
- **WHEN** a user opens the translator asset list toolbar and row actions
- **THEN** no create-folder, move-to-folder, or duplicate action is offered

#### Scenario: Create action opens the translator create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting only the translator's name — no display name or description
  field, since `Translator` has neither — and submitting it creates the resource and navigates to its
  detail view

#### Scenario: Bulk delete removes the selected translators
- **WHEN** a user selects several translators and confirms bulk delete
- **THEN** each selected translator is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the translator asset list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Translator asset list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for translator assets, all
sourced from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the translator asset list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps come from Core metadata
- **WHEN** the translator asset list renders
- **THEN** the created-at and updated-at columns are populated from the Core metadata node's
  `createdAt` and `updatedAt` fields, each rendered as a localized date rather than raw epoch
  milliseconds

### Requirement: Translator names follow Core's plain entity-name rule
The system SHALL treat a translator's name as a plain Core entity name — using the same shared name
field and validation the `Assets > Models` create form already uses — and SHALL NOT apply any
URI-encoding or `$id`-style handling to it.

#### Scenario: The create form uses the shared name field
- **WHEN** a user opens the translator create form
- **THEN** the same name field and validation `Assets > Models`/`Assets > Routes` use is shown, with
  no display-name or description field alongside it, since `Translator` has neither

#### Scenario: A valid name creates the resource
- **WHEN** a user submits a valid name
- **THEN** the resource is created under `translators/platform/{name}` and the list/detail view
  address it by that plain name

### Requirement: Translator asset detail view tab set
The system SHALL render a translator asset's detail view with exactly one tab, `Properties`, and SHALL NOT include a `Features`, `Configuration`, `Roles`, or `Audit` tab, a Core-sync status banner, or any reverse-index tab showing which other entities reference this translator. A file-defined translator opened from the `file` root SHALL be read through DIAL Core's config-file read endpoint and rendered read-only; it SHALL hide the ADMIN|CORE JSON format selector.

#### Scenario: Detail view renders exactly Properties
- **WHEN** a user opens a translator asset's detail view
- **THEN** the tab list contains exactly `Properties`

#### Scenario: File-defined Translator opens read-only
- **WHEN** a user opens a Translator from the `file` root
- **THEN** the system opens `/platform-translators/{id}?configFile=true`, reads it from the config-file endpoint, and renders all detail fields read-only

#### Scenario: File-defined Translator hides format selection
- **WHEN** a user opens the JSON editor for a file-defined Translator
- **THEN** no ADMIN|CORE format selector is rendered

#### Scenario: No Features, Configuration, Roles, or Audit tab
- **WHEN** a user opens a translator asset's detail view
- **THEN** no `Features`, `Configuration`, `Roles`, or `Audit` tab is shown

### Requirement: No Roles tab, as a structural absence
The system SHALL NOT render a Roles tab on the translator asset detail view, and SHALL NOT add a
`userRoles` field to the translator model. Core's `Translator` class carries no `userRoles` field —
it extends neither `Deployment` nor `RoleBasedEntity` — so there is no membership data for a Roles
tab to bind to.

#### Scenario: No Roles tab is present
- **WHEN** a user opens a translator asset's detail view
- **THEN** no Roles tab is shown

### Requirement: Properties tab content
The system SHALL render the translator asset's Properties tab with two fields sourced from the
interface-type population, `in` and `out`, and one URL field, `baseUrl`, composed from the same
individual controls other platform entities' Properties tabs use — no display name, description,
icon, endpoint-list, or topics control, since none of those exist on `Translator`.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits `in`, `out`, or `baseUrl` and saves
- **THEN** the value is stored on the translator resource and reappears on reload

### Requirement: `in`/`out` selects share the deployment interface-type population
The system SHALL populate the `in` and `out` selects from the same `DeploymentInterfaceType` values
already used by `Assets > Models`'/`Assets > Interceptors`' `interfaces` field (all four: OpenAI Chat
Completions, OpenAI Responses, Anthropic Messages, OpenAI Embeddings) — introducing no
translator-specific interface-type enum.

#### Scenario: Both selects offer the same four interface types
- **WHEN** a user opens the `in` or `out` select on a translator's Properties tab
- **THEN** both list exactly the four `DeploymentInterfaceType` values

### Requirement: Core validates a write; the client adds no meta-schema layer
The system SHALL rely on Core's own server-side validation — Core deserializes a translator write into
its `Translator` entity class and validates it (`ConfigPostProcessor.validateTranslator`) rather than
adding a client-side meta-schema-validation or cross-reference-validation layer (no client-side check
that `in` differs from `out`, that either names a known interface type, or that the deployment
referencing this translator serves `out` pass-through), and SHALL surface Core's rejection message —
including `validationWarnings` field/message pairs, when present — to the user verbatim.

#### Scenario: A rejected write surfaces Core's message
- **WHEN** a save is rejected by Core with a 422 and `validationWarnings`
- **THEN** an error notification shows Core's message rather than a generic failure, and the client
  performs no equivalent check of its own before submitting

### Requirement: Configuring a translator asset requires no admin-backend call
Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any
admin-backend request in order to view, create, edit, or delete a translator asset.

#### Scenario: The surface is configurable without the admin backend
- **WHEN** a user opens a translator asset and edits any field this surface exposes
- **THEN** no admin-backend request is required for the edit to be made or saved

### Requirement: No translator-attach picker widening
The system SHALL leave every existing entity-attach picker unchanged, introducing no
translator-origin dimension or widened picker as part of this capability. A translator is referenced
by name only from a model's or interceptor's own `interfaces.<type>.translator` field, a
config-authoring concern this capability does not surface any editor for.

#### Scenario: No existing picker changes behavior
- **WHEN** any existing entity-attach picker in the admin console renders
- **THEN** its option list and columns are unaffected by the existence of `Catalog > Translators`

### Requirement: Translators are readable through the config-file client
The system SHALL include `translators` in the config-file client entity-type enum and readable-type allow-list so the translator file root and its detail route can read DIAL Core configuration-file entities. This SHALL not widen unrelated attach-picker behavior.

#### Scenario: Translator config-file read is accepted
- **WHEN** the translator list or detail route requests a config-file entity of type `translators`
- **THEN** the config-file client accepts the type and reads Core's corresponding endpoint

