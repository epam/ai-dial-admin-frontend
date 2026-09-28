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

The shared create dispatch SHALL remove its transient `folderId` and merged-read `_metadata` fields before it invokes the model create server action. All remaining model content and identity fields SHALL be preserved for the server action's existing Core payload transformation.

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

#### Scenario: A created model with a colon in its name opens through an encoded detail route
- **WHEN** a user creates a Catalog model whose name contains `:` and Core returns the created identity under `_metadata.name`
- **THEN** the post-create redirect opens that model's detail view with `:` URL-encoded in the `[id]` segment, without a 404 page

#### Scenario: Platform create dispatch does not forward shared identity fields
- **WHEN** the shared asset-list create dispatch invokes a flat platform create action with `folderId` and `_metadata` present
- **THEN** the delegated model create server action receives neither field and retains the model's content and identity fields

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

The system SHALL render a model asset's detail view with `Properties`, `Features`, `Roles`, and
`Interceptors`, in that order, and SHALL append `Audit` as a fifth and last tab when the
`dashboardEnabled` feature flag is set. When that flag is unset the tab set SHALL remain exactly the
first four tabs.

There SHALL be no revision link, no rollback control, and no Core-sync banner, because DIAL Core
exposes no audit, revision, history, or snapshot surface for config resources — the rationale that
previously excluded the whole Audit tab still holds for those three, and for the Activities sub-tab
(see the Audit requirement below). It no longer excludes the Dashboard and Traces sub-tabs, which
query the analytics service and depend on nothing Core stores. There SHALL be no Tools or
Dependencies tab.

`dashboardEnabled` is derived once per request in `apps/ai-dial-admin/src/app/[lang]/layout.tsx` from
`DISABLE_MENU_ITEMS` not containing `dashboard`, and is the same flag that already gates the
`Assets ▸ Toolsets` Audit tab. No new flag or environment variable is introduced.

Gating the tab's *presence* is a known and accepted divergence from `Entities ▸ Models`, which lists
`Audit` unconditionally and, with `dashboardEnabled` unset, still shows it carrying only its
`Activities` sub-tab. `Catalog ▸ Models` has no `Activities` sub-tab to fall back on (see the Audit
requirement below), so an unconditional tab would be empty here. Consistency with `Entities ▸ Models`
therefore holds wherever the dashboard feature is enabled — the default — and the flag-unset
four-tab state below is deliberate, not an oversight to be "fixed" by rendering the tab always.

Two scenario headings below are retained from the previous wording of this requirement, because a
scenario's name is the identity a delta rewrites content under: `Detail view renders exactly four
tabs` is now the `dashboardEnabled`-unset case rather than the only case, and `No Audit tab or sync
banner` now prohibits only the revision/rollback/Core-sync surface it used to bundle the tab with.

#### Scenario: Audit is the fifth tab when the dashboard feature is enabled

- **WHEN** a user opens a model asset's detail view (`/platform-models/[id]`) in a deployment whose
  `dashboardEnabled` flag is set
- **THEN** the tab list reads `Properties`, `Features`, `Roles`, `Interceptors`, `Audit`, in that
  order

#### Scenario: Detail view renders exactly four tabs

Rescoped: the four-tab set is what a deployment with the dashboard feature disabled shows.

- **WHEN** a user opens a model asset's detail view in a deployment whose `dashboardEnabled` flag is
  unset (`DISABLE_MENU_ITEMS` includes `dashboard`)
- **THEN** the tab list contains exactly `Properties`, `Features`, `Roles`, and `Interceptors`, in
  that order, and no `Audit` tab is shown

#### Scenario: No Audit tab or sync banner

Rescoped: the prohibition now covers the revision/rollback/Core-sync surface only. The `Audit` tab
itself is prohibited only while `dashboardEnabled` is unset, per the scenario above.

- **WHEN** a user opens a model asset's detail view, with the `Audit` tab present or absent
- **THEN** no revision link, rollback control, or Core-sync status banner is rendered

#### Scenario: Sibling platform asset detail views gain no Audit tab

- **WHEN** a user opens the detail view of a platform App Runner, Interceptor, Route, Key, or Role
  with `dashboardEnabled` set
- **THEN** no `Audit` tab is shown on any of them, unchanged from current behaviour — the new tab is
  scoped to `Catalog ▸ Models` alone

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
Every field this surface writes is owned by DIAL Core. The system SHALL NOT require any admin-backend request in order to view or set a model's fields, or to read the Interceptors tab's selectable option list. Where a field's set of suggested values exists only in the admin backend, the field SHALL remain directly editable rather than offering selection alone.

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

#### Scenario: The Interceptors tab's option list comes from Core, both populations
- **WHEN** a user opens the Interceptors tab on a model asset
- **THEN** the selectable interceptors are read from DIAL Core as the union of its API-written and configuration-file populations, exactly as `Assets > App Runners` already does, and no admin-backend request contributes to the list

#### Scenario: A Core read failure still renders the tab
- **WHEN** DIAL Core's interceptor population cannot be read
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used on `Assets > App Runners` is shown

### Requirement: Roles tab
The system SHALL provide a Roles tab on the model asset detail view, matching the layout of the
config-entity Roles tab (`EntityRoles`/`RolesGrid`): a title with a live count of granted roles, a
"Make available to specific roles" toggle, and an Add-role control styled as a primary button. The
tab SHALL edit the resource's `userRoles`, with the selectable roles read from DIAL Core's own role
population (the union of its API-written and configuration-file-declared roles), not the
admin-backend's role list.

`userRoles` SHALL be interpreted as three distinct states: an empty array means the model is
available to no user; a populated array means the model is available only to the listed roles;
`undefined` or `null` means the model is available to all users. The toggle SHALL reflect and drive
this: switching it on (from `undefined`/`null`) SHALL set `userRoles` to an empty array; switching it
off (from any array) SHALL clear `userRoles` to `undefined`.

When the grid has no granted roles, it SHALL show "No Roles" as its empty state, rather than a
warning message. When the model is available to no user (`userRoles` is an empty array), a
notification SHALL be shown below the grid stating the model is not available to any end-users;
this notification SHALL NOT be shown when `userRoles` is `undefined`/`null` or non-empty.

#### Scenario: Roles selection round-trips on the model resource
- **WHEN** a user selects roles on a model asset and saves
- **THEN** the selection persists to the resource's `userRoles` and is rendered as selected when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's own role list cannot see it

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used on `Assets > App Runners`/the Interceptors tab is shown

#### Scenario: The header shows a live role count
- **WHEN** a user grants or revokes a role on a model asset's Roles tab
- **THEN** the header's count updates immediately to match the number of currently granted roles

#### Scenario: Toggling availability on narrows to no one
- **WHEN** a user switches "Make available to specific roles" on for a model whose `userRoles` was `undefined` or `null`
- **THEN** `userRoles` becomes an empty array and the roles grid is available to start adding roles

#### Scenario: Toggling availability off restores available-to-all
- **WHEN** a user switches "Make available to specific roles" off for a model with any `userRoles` array
- **THEN** `userRoles` becomes `undefined` and, on save, the request body carries no `userRoles` property

#### Scenario: Empty roles grid shows "No Roles"
- **WHEN** a model asset's Roles tab has no granted roles
- **THEN** the grid's empty state reads "No Roles"

#### Scenario: Unavailable-to-all notification appears only when genuinely empty
- **WHEN** a model asset's `userRoles` is an empty array
- **THEN** a notification below the grid states the model is not available to any end-users

#### Scenario: No notification when available to all
- **WHEN** a model asset's `userRoles` is `undefined` or `null`
- **THEN** no "not available" notification is shown

### Requirement: New platform model defaults to unavailable
The system SHALL initialize a newly created model asset's `userRoles` to an empty array, so it is
unavailable to any end-user until roles are explicitly granted, rather than defaulting to available
to all by omission.

#### Scenario: A freshly created model starts with no granted roles
- **WHEN** a user creates a new model asset and opens its Roles tab before granting any role
- **THEN** the tab shows zero granted roles and the "not available to any end-users" notification is shown

### Requirement: Interceptors tab
The system SHALL provide an Interceptors tab on the model asset detail view, editing the resource's `interceptors`, with a `Source` column distinguishing the two Core populations an option can come from, matching the same column on `Assets > App Runners`.

#### Scenario: Interceptor selection round-trips on the model resource
- **WHEN** a user selects interceptors on a model asset and saves
- **THEN** the selection persists to the resource's `interceptors` and is rendered as selected when the view is reopened

#### Scenario: An unresolvable interceptor reference is reported
- **WHEN** a save is rejected by Core because a selected interceptor does not resolve in the merged config
- **THEN** the validation warnings Core returns are surfaced to the user, identifying the offending reference rather than reporting a generic failure

#### Scenario: Each option's population is labelled
- **WHEN** the Interceptors tab renders its option list
- **THEN** each option's `Source` column reads which of Core's two populations it came from

### Requirement: The canonical deployment identity is visible
Because DIAL Core keys API-written models by their **bare short name** and sets the deployment's name from that key, the identifier callers use to invoke a model created through this surface is the bare name — the same value the list displays, not a `models/platform/{name}` canonical id. The system SHALL surface that deployment identifier on the model asset's detail view.

#### Scenario: The detail view shows the deployment identifier
- **WHEN** a user opens a model asset's detail view
- **THEN** the deployment identifier — the model's bare name — is shown and can be copied

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

### Requirement: The Catalog model detail view exposes its catalog metadata

The system SHALL let an admin attach a catalog schema to a Catalog model and edit the catalog values
it describes, using the shared `catalog-properties-editing` mechanism. The model resource SHALL
round-trip `catalog_schema_id` and `catalog_properties` through its Core read and write.

Placement SHALL be consistent across every surface the mechanism is offered on, so an admin finds
catalog metadata in the same place on a model as on an interceptor, application, or toolset.

#### Scenario: Catalog metadata is offered on a Catalog model

- **WHEN** an admin opens a Catalog model's detail view
- **THEN** the catalog schema selection and, once a schema is selected, its values editor are offered

#### Scenario: The two fields survive a save

- **WHEN** an admin attaches a schema, fills in values, and saves the model
- **THEN** both `catalog_schema_id` and `catalog_properties` are written to Core and reappear on
  reload

#### Scenario: A model with no catalog schema is unchanged

- **WHEN** an admin opens a Catalog model carrying no `catalog_schema_id`
- **THEN** every other tab behaves exactly as before, and no values editor is shown

### Requirement: Model asset Audit tab exposes Dashboard and Traces only

The system SHALL render the model asset's `Audit` tab with the shared
`EntityTabs/Audit/EntityAudit` component addressed as `ApplicationRoute.PlatformModels`, offering
exactly two sub-tabs — `Dashboard` and `Traces`, in that order — and SHALL NOT offer the `Activities`
or `Conversations` sub-tabs that `Entities ▸ Models` offers. `Activities` is excluded because it reads
the admin backend's activity/revision trail, which has no rows for a DIAL Core config resource;
`Conversations` is excluded because this surface follows the `Assets ▸ Toolsets` Audit precedent,
which offers neither.

Both sub-tabs read from the analytics-data-access-service (`DIAL_ANALYTICS_API_URL`) through the
existing `Telemetry/Dashboard` and `UsageLog/UsageLog` components, unchanged. No admin-backend
request and no additional DIAL Core request is introduced by this tab, and no new user action is
added — so no new success or error notification is defined; a failed analytics read surfaces through
those components' existing error handling.

#### Scenario: Audit opens on Dashboard with Traces alongside

- **WHEN** a user selects the `Audit` tab on a model asset's detail view
- **THEN** the sub-tab list reads `Dashboard` and `Traces`, with `Dashboard` selected and its content
  rendered

#### Scenario: No Activities sub-tab

- **WHEN** a user views the model asset's `Audit` tab
- **THEN** no `Activities` sub-tab is offered, since a Core config resource has no admin-backend
  activity/revision trail to list

#### Scenario: No Conversations sub-tab

- **WHEN** a user views the model asset's `Audit` tab
- **THEN** no `Conversations` sub-tab is offered, unlike the `Entities ▸ Models` Audit tab

#### Scenario: Audit reads are keyed by the model's deployment name

- **WHEN** the `Dashboard` or `Traces` sub-tab builds its analytics query for a model asset
- **THEN** the query's entity filter is the model's bare name — the same deployment identifier the
  detail view already surfaces — with no `toolsets/`-style deployment prefix and no
  `models/platform/{name}` canonical id

#### Scenario: The Entities > Models Audit tab is unchanged

- **WHEN** a user opens the `Audit` tab on an `Entities ▸ Models` detail view with `dashboardEnabled`
  set
- **THEN** its sub-tabs are `Dashboard`, `Traces`, `Conversations`, and `Activities`, unchanged from
  current behaviour

