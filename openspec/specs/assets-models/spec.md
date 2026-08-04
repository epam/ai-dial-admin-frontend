## Purpose

The `Assets > Models` admin surface: a flat, unversioned list and detail view over DIAL Core's `models/platform` config resources, read and written directly through Core rather than the admin backend.

## Requirements

### Requirement: Assets > Models menu entry
The system SHALL add a `Models` menu item as the first entry in the Assets section of the admin menu, linking to a new `/assets-models` route.

#### Scenario: Models is the first Assets entry
- **WHEN** the Assets section of the menu renders
- **THEN** `Models` is its first item, appearing before App Runners/Apps/Toolsets/Conversations/Prompts/Files

### Requirement: Model asset list is flat with create and delete actions
The system SHALL render the model asset list as a single, non-nested list of entries under the `platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and no folder-create, rename-folder, or move-into-folder controls — unlike the Apps asset list, which supports arbitrary nested folders.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens the `/assets-models` list
- **THEN** all model resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the model asset list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered, unlike the Apps asset list

#### Scenario: The folder tree offers no folder actions
- **WHEN** a user opens the context menu on the model asset folder tree's root
- **THEN** no add-sibling, add-child, rename, move, or manage-permissions action is offered, since the namespace is flat and a folder create would submit a placeholder asset Core cannot store

#### Scenario: A rejected folder create never fails silently
- **WHEN** a folder-create submission for this resource kind is rejected
- **THEN** the rejection is surfaced to the user as an error, rather than the pending tree node disappearing with no message

#### Scenario: Create action opens the model create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting the model's name, and submitting it creates the model resource and navigates to its detail view

#### Scenario: Bulk delete removes the selected models
- **WHEN** a user selects several model resources and confirms bulk delete
- **THEN** each selected model is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the model asset list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Model asset list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for model assets, all sourced from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the model asset list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps come from Core metadata
- **WHEN** the model asset list renders
- **THEN** the created-at and updated-at columns are populated from the Core metadata node's `createdAt` and `updatedAt` fields

#### Scenario: Both timestamp columns render as localized dates
- **WHEN** the model asset list renders its created-at and updated-at columns
- **THEN** each shows a locale-formatted date, not the raw epoch-milliseconds value Core returns

### Requirement: Model asset detail view tab set
The system SHALL render exactly four tabs on a model asset's detail view — `Properties`, `Features`, `Roles`, and `Interceptors`, in that order. There SHALL be no Audit tab, revision link, rollback control, or Core-sync banner, because DIAL Core exposes no audit, revision, history, or snapshot surface for config resources. There SHALL be no Tools or Dependencies tab.

#### Scenario: Detail view renders exactly four tabs
- **WHEN** a user opens a model asset's detail view
- **THEN** the tab list contains exactly `Properties`, `Features`, `Roles`, and `Interceptors`, in that order

#### Scenario: No Audit tab or sync banner
- **WHEN** a user opens a model asset's detail view
- **THEN** no Audit tab, revision link, rollback control, or Core-sync banner is shown

### Requirement: Properties exposes the routing-critical Core deployment fields
The model asset's Properties tab SHALL expose every field DIAL Core's `Model`/`Deployment` accepts that this surface is scoped to edit, so that a model created here is routable without recourse to the raw JSON editor. This SHALL include `endpoint`, `upstreams`, `type`, `tokenizerModel`, `overrideName`, `forwardAuthToken`, and `displayVersion`, alongside the already-present display name, description, intro, icon, topics (persisted as `descriptionKeywords`), interfaces, attachments, completion defaults, max retry attempts, limits, and pricing.

Controls that already exist for the entity surfaces SHALL be reused or extracted for shared use, never duplicated — a second implementation of the same field would drift from the first.

#### Scenario: Display name and version validation behave identically on both surfaces
- **WHEN** the shared display-name and version controls are rendered on either the entity or the asset surface
- **THEN** each surface validates against its own name population, and the entity surface's rendering and validation behaviour is unchanged from before the controls were shared

#### Scenario: A model can be given an endpoint without editing raw JSON
- **WHEN** a user opens a model asset's Properties tab
- **THEN** an `endpoint` field is editable, and saving a value persists it to the model resource

#### Scenario: Endpoint is presented as the fallback to interfaces
- **WHEN** a user views the `endpoint` and interfaces controls together
- **THEN** `endpoint` is labelled as the legacy path used only when no interface base URL is declared, matching Core's resolution precedence

#### Scenario: Upstreams are editable
- **WHEN** a user opens a model asset's Properties tab
- **THEN** the upstream endpoints editor is present and its entries persist to the model resource's `upstreams`

#### Scenario: Model type is editable and gates embedding dimensions
- **WHEN** a user sets the model's `type` to `EMBEDDING`
- **THEN** an embedding-dimensions control is shown, and it is absent for `CHAT` and `COMPLETION`

#### Scenario: There is no source field
- **WHEN** a user opens a model asset's Properties tab
- **THEN** no container/adapter/endpoints source selector is offered, since Core's model resource carries no `source` property

### Requirement: Responses defaults are shown when the model can serve the Responses API
The system SHALL render the responses-defaults editor when the model declares support for the OpenAI Responses interface — an `openaiResponses` entry with a base URL in `interfaces`, or a set `responsesEndpoint` — mirroring the condition DIAL Core itself evaluates. The entity view's source-type-derived condition SHALL NOT be ported, since Core's model resource has no source.

#### Scenario: Responses defaults appear for a Responses-capable model
- **WHEN** a user opens the Properties tab of a model whose `responsesEndpoint` is set, or whose `interfaces` declares an `openaiResponses` base URL
- **THEN** the responses-defaults editor is shown alongside the completion-defaults editor

#### Scenario: Responses defaults are hidden for a model that cannot serve Responses
- **WHEN** a user opens the Properties tab of a model with neither `responsesEndpoint` nor an `openaiResponses` interface entry
- **THEN** the responses-defaults editor is not shown

### Requirement: The upstream secret fields never overwrite a stored credential with an empty value
DIAL Core never returns an upstream's `key` or `secretExtraData` on read, so those inputs render empty for every previously saved upstream. The system SHALL omit an empty or unset secret from the write payload rather than sending an empty string, because Core preserves an omitted secret but treats a literal empty string as a real value and overwrites the stored credential with it.

#### Scenario: An untouched secret field is omitted from the write
- **WHEN** a user saves a model whose existing upstream's key field was left blank
- **THEN** the request body's upstream entry carries no `key` property at all, and the stored credential is preserved

#### Scenario: A cleared secret field is omitted, not blanked
- **WHEN** a user types into an upstream's key field and then clears it before saving
- **THEN** the request body's upstream entry carries no `key` property, rather than `key` set to an empty string

#### Scenario: A supplied secret is written
- **WHEN** a user enters a value in an upstream's key field and saves
- **THEN** the request body's upstream entry carries that value

#### Scenario: Renaming an endpoint with a blank key is flagged
- **WHEN** a user changes an existing upstream's endpoint while its key field is empty
- **THEN** the user is warned that the stored credential cannot be carried over, because Core matches stored secrets to request entries by endpoint

### Requirement: Configuring a model requires no admin-backend call
Every field this surface writes is owned by DIAL Core. The system SHALL NOT require any admin-backend request in order to view or set a model's fields. Where a field's set of suggested values exists only in the admin backend, the field SHALL remain directly editable rather than offering selection alone.

#### Scenario: The tokenizer model is typed, not selected
- **WHEN** a user sets a model's tokenizer
- **THEN** the value can be entered directly, without any list being fetched, since DIAL Core treats it as an opaque string it neither validates nor enumerates

#### Scenario: Clearing the tokenizer stores it as unset
- **WHEN** a user clears the tokenizer field and saves
- **THEN** the property is absent from the write payload rather than sent as an empty string

#### Scenario: Topics need no catalogue
- **WHEN** a user opens the topics control on a model asset
- **THEN** no topic catalogue is requested, and topics can still be added and saved

#### Scenario: Entity surfaces keep their catalogues
- **WHEN** a user opens the topics control on an admin-backend-backed entity surface
- **THEN** the topic catalogue is still requested, unchanged

### Requirement: Roles tab
The system SHALL provide a Roles tab on the model asset detail view, editing the resource's `userRoles`, with the selectable roles read from the role list.

#### Scenario: Roles selection round-trips on the model resource
- **WHEN** a user selects roles on a model asset and saves
- **THEN** the selection persists to the resource's `userRoles` and is rendered as selected when the view is reopened

### Requirement: Interceptors tab
The system SHALL provide an Interceptors tab on the model asset detail view, editing the resource's `interceptors`.

#### Scenario: Interceptor selection round-trips on the model resource
- **WHEN** a user selects interceptors on a model asset and saves
- **THEN** the selection persists to the resource's `interceptors` and is rendered as selected when the view is reopened

#### Scenario: An unresolvable interceptor reference is reported
- **WHEN** a save is rejected by Core because a selected interceptor does not resolve in the merged config
- **THEN** the validation warnings Core returns are surfaced to the user, identifying the offending reference rather than reporting a generic failure

### Requirement: The canonical deployment identity is visible
Because DIAL Core keys API-written models by their canonical id and sets the deployment's name from that key, the identifier callers use to invoke a model created through this surface is `models/platform/{name}`, not the bare name the list displays. The system SHALL surface that canonical identifier on the model asset's detail view.

#### Scenario: The detail view shows the canonical identifier
- **WHEN** a user opens a model asset's detail view
- **THEN** the canonical deployment identifier `models/platform/{name}` is shown and can be copied

### Requirement: A model rejected from the merged config is distinguishable, with its reasons
DIAL Core serves a valid model and an invalid one through two different projections: a successful read reports a valid status, while an entity that failed validation during the merged-config rebuild is served with an invalid status and, for admin callers, an accompanying list of validation warnings naming the offending fields. The system SHALL distinguish the two states in the detail view and SHALL surface the warnings when present.

#### Scenario: An invalid model is marked as such
- **WHEN** a user opens a model asset that Core reports as invalid
- **THEN** the view indicates that the model is not part of the served configuration

#### Scenario: Validation warnings are shown, not discarded
- **WHEN** Core's response for an invalid model carries validation warnings
- **THEN** those warnings are shown to the user, naming the fields responsible

### Requirement: Model asset Features tab mirrors the Models-entity feature set, not the Applications-entity set
The system SHALL render the model asset Features tab with a dedicated component whose switch groups match the Models-entity feature set: sampling/output control, tools/function calling, prompt/message composition, attachments, caching, session access (without `consent_required`), and feedback. It SHALL NOT reuse `Assets/Resources/ResourceFeatures`, whose switch groups mirror the Applications-entity feature set (session access with `consent_required`, no caching group) and whose app-runner-scheme-inherited-readonly logic does not apply to models.

#### Scenario: Caching group is present
- **WHEN** a user opens a model asset's Features tab
- **THEN** a caching group with `cache_supported` and `auto_caching_supported` switches is shown

#### Scenario: consent_required is absent
- **WHEN** a user opens a model asset's Features tab
- **THEN** the session-access group does not include a `consent_required` switch, unlike the Apps asset Features tab

#### Scenario: Text features match the Apps asset Features tab
- **WHEN** a user opens a model asset's Features tab
- **THEN** the same four text-endpoint fields (`rate_endpoint`, `tokenize_endpoint`, `truncate_prompt_endpoint`, `configuration_endpoint`) are shown, unchanged from the Apps asset Features tab

### Requirement: Topics are editable and persisted
The model asset's Properties tab SHALL expose a topics control whose selection is persisted on the model resource.

#### Scenario: Topic selection round-trips
- **WHEN** a user edits a model asset's topics and saves
- **THEN** the selection persists on the resource and is rendered when the view is reopened

### Requirement: The detail route addresses the resource by its listed path without re-decoding it
The listing row's path is already in the form the detail read requires, and the routing layer decodes the query parameter once. The system SHALL NOT decode it a second time.

#### Scenario: The detail read uses the path as routed
- **WHEN** a user opens a model asset from the list
- **THEN** the detail read targets the resource named by the row's path, with no additional decoding applied to the routed value
