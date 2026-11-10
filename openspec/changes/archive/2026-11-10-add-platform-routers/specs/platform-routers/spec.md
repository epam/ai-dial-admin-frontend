## ADDED Requirements

### Requirement: AI Gateway > Routers menu entry
The system SHALL add a `Routers` menu item to the AI Gateway section of the admin menu, directly after
`Toolsets` and before `Translators`, linking to a new `/platform-routers` route, with an icon distinct from
the AI Gateway group icon and from the `Routes` entry's icon.

#### Scenario: Routers follows Toolsets in AI Gateway
- **WHEN** the AI Gateway section of the menu renders
- **THEN** `Routers` appears immediately after `Toolsets` and before `Translators`

### Requirement: Router asset list is flat with create and delete actions
The system SHALL render the router asset list with flat `platform` and synthetic `file` roots, built on the
shared asset list. The `platform` root SHALL offer create, duplicate, delete, and bulk-delete actions and no
create-folder, move, or rename action. The `file` root SHALL list config-file-defined routers and
expose no mutating or folder action.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-routers`
- **THEN** all router resources are shown as direct entries with no folder-expand affordance

#### Scenario: Create opens a name-only modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting only the router's name, and submitting it creates the resource under
  `routers/platform/{name}` and navigates to its detail view

#### Scenario: Bulk delete removes the selected routers
- **WHEN** a user selects several routers and confirms bulk delete
- **THEN** each selected router is deleted and the list refreshes without them

#### Scenario: File root is read-only
- **WHEN** a user opens the `file` root on `/platform-routers`
- **THEN** config-file router names are listed and no create, delete, bulk-delete, duplicate, move,
  rename, or folder action is offered

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the router asset list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Router asset list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for router assets, all sourced from
Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the router asset list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps are localized dates
- **WHEN** the router asset list renders
- **THEN** created-at and updated-at come from the Core metadata node and render as localized dates

### Requirement: Router names follow Core's plain entity-name rule
The system SHALL treat a router's name as a plain Core entity name, using the same shared name field and
validation the Models create form uses, and SHALL NOT apply URI-encoding or `$id`-style handling to it.

#### Scenario: A valid name creates the resource
- **WHEN** a user submits a valid router name
- **THEN** the resource is created under `routers/platform/{name}` and the list and detail view address it
  by that plain name

### Requirement: Router detail view tab set
The system SHALL render a router's detail view with the tabs `Properties`, `Features`, `Catalog`, and
`Roles`, in that order, and SHALL insert `Parameters` after `Features` only while the router has an app-type
schema selected. The view SHALL NOT render an `Interceptors` or `Audit` tab. A router opened from the `file`
root SHALL be read from DIAL Core's config-file endpoint and rendered read-only, with the ADMIN|CORE JSON
format selector hidden.

#### Scenario: Detail view without a schema
- **WHEN** a user opens a router that has no `applicationTypeSchemaId`
- **THEN** the tab list reads `Properties`, `Features`, `Catalog`, `Roles`

#### Scenario: Detail view with a schema
- **WHEN** a user opens a router that has an `applicationTypeSchemaId`
- **THEN** the tab list reads `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`

#### Scenario: No Interceptors or Audit tab
- **WHEN** a user opens any router's detail view
- **THEN** no `Interceptors` and no `Audit` tab is shown

#### Scenario: File-defined router opens read-only
- **WHEN** a user opens a router from the `file` root
- **THEN** the system opens `/platform-routers/{id}?configFile=true`, reads it from the config-file
  endpoint, renders every field read-only, and shows no ADMIN|CORE format selector

### Requirement: Properties tab content
The system SHALL render the Properties tab with name, display name, display version, icon, description,
intro, `baseUrl`, `forwardAuthToken`, `maxRetryAttempts`, `overrideName`, `mode`, the app-type schema picker,
and the shared Interfaces editor. The tab SHALL NOT render `upstreams`, `limits`, `pricing`, `interceptors`,
`endpoint`, or `responsesEndpoint` controls, since Core rejects those fields on a router.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits `baseUrl`, saves, and reloads
- **THEN** the new `baseUrl` is stored on the router resource and shown again

#### Scenario: No fields of another deployment kind
- **WHEN** a user opens the Properties tab
- **THEN** no upstream, limits, pricing, interceptor, or endpoint control is present

#### Scenario: Router with no mode is shown as proxy
- **WHEN** a user opens a router whose stored content has no `mode`
- **THEN** the mode control shows `proxy`, and saving without touching it does not write a `mode` field

### Requirement: Decision mode settings
The system SHALL offer `mode` as `proxy` or `decision`. While `mode` is `decision` the Properties tab SHALL
render the `decision` settings: `body` as a switch, `timeoutMs` and `maxDecisions` as numeric inputs showing
Core's defaults (5000 and 3) as placeholders. `timeoutMs` MUST be a positive integer and `maxDecisions` MUST
be an integer from 1 to 10; an out-of-range value SHALL block save with a field error. Switching `mode` back
to `proxy` SHALL remove the whole `decision` object from the edited router.

#### Scenario: Decision settings appear only in decision mode
- **WHEN** a user switches `mode` from `proxy` to `decision`
- **THEN** the `body`, `timeoutMs`, and `maxDecisions` controls appear, and they are absent in proxy mode

#### Scenario: Out-of-range maxDecisions blocks save
- **WHEN** a user enters `0` or `11` in `maxDecisions`
- **THEN** the field shows an error and the save action is disabled

#### Scenario: Non-positive timeout blocks save
- **WHEN** a user enters `0` in `timeoutMs`
- **THEN** the field shows an error and the save action is disabled

#### Scenario: Switching back to proxy drops the decision object
- **WHEN** a user sets decision settings, switches `mode` to `proxy`, and saves
- **THEN** the saved router has no `decision` field

### Requirement: Schema and properties are set and cleared together
The system SHALL offer an optional app-type schema picker on the Properties tab, populated from the same
config-file and platform app-type schemas the application source picker offers. Picking a schema SHALL set
`applicationTypeSchemaId` and seed `applicationProperties` with the schema's defaults. Clearing the schema
SHALL remove both fields. The `Parameters` tab SHALL edit `applicationProperties` against the picked schema
and SHALL block leaving the tab or saving while the values are invalid, as the Applications Parameters tab
does.

#### Scenario: Picking a schema seeds properties
- **WHEN** a user picks a schema that declares a property default
- **THEN** `applicationTypeSchemaId` is the schema id, `applicationProperties` holds that default, and the
  `Parameters` tab appears

#### Scenario: Clearing the schema removes both fields
- **WHEN** a user clears a previously picked schema and saves
- **THEN** the saved router has neither `applicationTypeSchemaId` nor `applicationProperties`

#### Scenario: A router without a schema is valid
- **WHEN** a user saves a router that never had a schema
- **THEN** the picker raises no required-field error

#### Scenario: A schema that declares no endpoints is offered
- **WHEN** an app-type schema declares no completion or MCP endpoint
- **THEN** it is still listed in the router's schema picker

### Requirement: Router interfaces
The system SHALL render the Interfaces section on the Properties tab with the four types
`openaiChatCompletions`, `openaiResponses`, `anthropicMessages`, and `openaiEmbeddings`. The router's
`baseUrl` SHALL make each interface's own `base_url` optional.

#### Scenario: Add offers four types
- **WHEN** a router has no interface and the user activates "+ Add"
- **THEN** the dropdown lists all four interface types

#### Scenario: Interface base URL falls back to the router base URL
- **WHEN** a router has a `baseUrl` and an interface row has no base URL
- **THEN** the row raises no required-field error

### Requirement: Features, Catalog, and Roles tabs
The system SHALL render the router's `Features`, `Catalog`, and `Roles` tabs with the same controls
`Platform > Models` uses, bound to the router's `features`, `catalogSchemaId`/`catalogProperties`, and
`userRoles`. The per-interface Features popup SHALL offer the model feature set for a router.

#### Scenario: Roles tab edits userRoles
- **WHEN** a user assigns a role on the `Roles` tab and saves
- **THEN** the router's `userRoles` contains that role after reload

#### Scenario: Per-interface features use the model feature set
- **WHEN** a user opens the Features popup of a router interface row
- **THEN** the popup lists the same feature controls it lists for a Platform Model interface row

### Requirement: Core validation is surfaced, not duplicated
The system SHALL NOT re-implement Core's cross-entity router validation. A rejected write SHALL surface
Core's message through the existing error-notification path and leave the edited router unchanged.

#### Scenario: Core rejects a write
- **WHEN** Core answers a router save with a validation error
- **THEN** an error notification shows Core's message, and the form keeps the user's edits

### Requirement: Every router string is localized
The system SHALL render every user-facing router string through the i18n layer, with its key in the
matching i18n enum and its text in `en.ts`, and SHALL NOT hardcode display text. This covers the menu label
and the AI Gateway group description, breadcrumbs, create, update, duplicate, and delete notifications and
modal titles, bulk-delete labels, list empty-state title and description, field labels, placeholders and
validation errors for `mode`, the decision settings, and the schema picker, and tab labels.

#### Scenario: Menu and group description mention routers
- **WHEN** the AI Gateway menu group renders
- **THEN** the `Routers` label and the group description (which names the entities it holds) come from i18n,
  and the description names routers

#### Scenario: Empty list shows localized guidance
- **WHEN** a user opens `/platform-routers` with no routers
- **THEN** the empty-state title and description are localized strings that name routers

#### Scenario: Notifications and modals use router wording
- **WHEN** a user creates, updates, or deletes a router
- **THEN** the notification and modal text name a router, not a translator or model

#### Scenario: Decision field errors are localized
- **WHEN** a user enters an out-of-range `timeoutMs` or `maxDecisions`
- **THEN** the field error text comes from i18n
