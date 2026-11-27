# platform-routers Specification

## Purpose
The `AI Gateway > Routers` surface — menu entry, flat asset list with `platform` and read-only `file` roots, and a detail
view (Properties, Features, Parameters, Catalog, Roles) over DIAL Core's `routers/platform` resources, read and written
directly through Core. A router is a deployment that picks the deployment serving a request, in `proxy` or `decision`
mode; the view covers mode and decision settings, an optional app-type schema with its properties, and the shared
interfaces editor. Core validates cross-entity rules and its message is surfaced verbatim. Created by archiving change
`add-platform-routers`.
## Requirements
### Requirement: AI Gateway > Routers menu entry
The system SHALL show an `Auto Routers` menu item in the AI Gateway section of the admin menu, directly after
`Toolsets` and before `Translators`, linking to `/platform-routers`, with an icon distinct from
the AI Gateway group icon and from the `Routes` entry's icon.

#### Scenario: Routers follows Toolsets in AI Gateway
- **WHEN** the AI Gateway section of the menu renders
- **THEN** `Auto Routers` appears immediately after `Toolsets` and before `Translators`

### Requirement: Router asset list is flat with create and delete actions
The system SHALL render the router asset list with a flat Platform tab and a config.json tab, built on the
shared tabbed listing. The Platform tab SHALL offer create (Create button), duplicate, and delete actions and no
create-folder, move, or rename action. The config.json tab SHALL list config-file-defined routers and
expose no mutating action.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-routers`
- **THEN** all router resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: Create opens a modal with identity fields
- **WHEN** a user activates the Create button
- **THEN** a modal opens requesting the router's id, display name, display version, and description, and submitting
  it creates the resource under `routers/platform/{name}` and navigates to its detail view

#### Scenario: config.json tab is read-only
- **WHEN** a user opens the config.json tab on `/platform-routers`
- **THEN** config-file router names are listed and no create, delete, duplicate, move,
  rename, or folder action is offered

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the router asset list
- **THEN** no create or delete action is offered

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
schema selected, or while it has a non-empty `editorUrl` and the `UI` view is offered (see "Embedded router
UI"). The view SHALL NOT render an `Interceptors` or `Audit` tab. A
router opened from the `file` root SHALL be read from DIAL Core's config-file endpoint and rendered read-only,
with the ADMIN|CORE JSON format selector hidden.

#### Scenario: Detail view without a schema
- **WHEN** a user opens a router that has no `applicationTypeSchemaId` and no `editorUrl`
- **THEN** the tab list reads `Properties`, `Features`, `Catalog`, `Roles`

#### Scenario: Detail view with a schema
- **WHEN** a user opens a router that has an `applicationTypeSchemaId`
- **THEN** the tab list reads `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`

#### Scenario: Detail view with an editor URL and no schema
- **WHEN** a user opens a router that has an `editorUrl` and no `applicationTypeSchemaId`
- **THEN** the tab list reads `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`

#### Scenario: Clearing the editor URL removes the tab
- **WHEN** a user clears the `Editor URL` field of a router that has no schema
- **THEN** the `Parameters` tab disappears, and the view stays on or returns to `Properties`

#### Scenario: No Interceptors or Audit tab
- **WHEN** a user opens any router's detail view
- **THEN** no `Interceptors` and no `Audit` tab is shown

#### Scenario: File-defined router opens read-only
- **WHEN** a user opens a router from the `file` root
- **THEN** the system opens `/platform-routers/{id}?configFile=true`, reads it from the config-file
  endpoint, renders every field read-only, and shows no ADMIN|CORE format selector

### Requirement: Properties tab content
The system SHALL render the Properties tab with name, display name, display version, icon, description,
intro, `baseUrl`, `editorUrl`, `forwardAuthToken`, `maxRetryAttempts`, `overrideName`, `mode`, the app-type
schema picker, and the shared Interfaces editor. The tab SHALL NOT render `upstreams`, `limits`, `pricing`,
`interceptors`, `endpoint`, or `responsesEndpoint` controls, since Core rejects those fields on a router.
The `editorUrl` field SHALL be optional, SHALL apply the URL check the application `Editor URL` field
applies, and SHALL block save with a field error while the value fails it. An empty `editorUrl` field SHALL
be written as an absent `editorUrl`.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits `baseUrl`, saves, and reloads
- **THEN** the new `baseUrl` is stored on the router resource and shown again

#### Scenario: Editor URL persists
- **WHEN** a user enters a valid URL in `Editor URL`, saves, and reloads
- **THEN** the router resource has that `editorUrl` and the field shows it again

#### Scenario: Invalid editor URL blocks save
- **WHEN** a user enters a value in `Editor URL` that fails the URL check
- **THEN** the field shows an error and the save action is disabled

#### Scenario: Emptied editor URL is not written
- **WHEN** a user empties the `Editor URL` field of a router that had one, and saves
- **THEN** the saved router has no `editorUrl` field

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
The system SHALL render the Interfaces section on the Properties tab with the four types `openaiChatCompletions`, `openaiResponses`, `anthropicMessages`, and `openaiEmbeddings`. The router's `baseUrl` SHALL make each interface's own `base_url` optional. Router passthrough interface base URLs SHALL offer the Url and Plugin choices and SHALL retain the explicit-interface-over-entity fallback and plugin override-path validation.

#### Scenario: Add offers four types
- **WHEN** a router has no interface and the user activates "+ Add"
- **THEN** the dropdown lists all four interface types

#### Scenario: Interface base URL falls back to the router base URL
- **WHEN** a router has a `baseUrl` and an interface row has no base URL
- **THEN** the row raises no required-field error

#### Scenario: Passthrough interface selects a plugin
- **WHEN** an admin selects a plugin for a router passthrough interface and saves
- **THEN** the router's interface carries the plugin reference in its existing base URL and remains in passthrough mode

### Requirement: Router base URL supports plugin selection
The router Properties `baseUrl` SHALL offer Url and Plugin choices using the existing plugin option sources and validation. It SHALL remain optional and use the existing Core router resource field and save/discard flow. Config-file and read-only routers SHALL remain non-mutating; existing success and error notifications SHALL remain unchanged, including Core validation messages and retained drafts on rejection.

#### Scenario: Router saves a plugin base URL
- **WHEN** an admin selects `dial-plugin://example` as a router's base URL and saves
- **THEN** the router resource's existing `baseUrl` contains that reference and reload displays it

#### Scenario: Read-only router displays its reference
- **WHEN** an admin opens a read-only or config-file router with a plugin base URL
- **THEN** the reference is visible and cannot be edited

#### Scenario: Router save is rejected
- **WHEN** Core rejects a router save after the base URL changes
- **THEN** the existing error notification shows Core's message and the user's draft remains available

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
validation errors for `mode`, the decision settings, and the schema picker, and tab labels. Frontend-owned
references to the router entity SHALL use `Auto Router` or `Auto Routers`, with sentence-appropriate casing.

#### Scenario: Menu and group description mention routers
- **WHEN** the AI Gateway menu group renders
- **THEN** the `Auto Routers` label and the group description (which names auto routers among the entities it holds) come from i18n

#### Scenario: Empty list shows localized guidance
- **WHEN** a user opens `/platform-routers` with no routers
- **THEN** the localized empty-state title and description name auto routers

#### Scenario: Notifications and modals use router wording
- **WHEN** a user creates, updates, or deletes a router
- **THEN** frontend-owned notification and modal text name an Auto Router, not a Route, translator or model

#### Scenario: Decision field errors are localized
- **WHEN** a user enters an out-of-range `timeoutMs` or `maxDecisions`
- **THEN** the field error text comes from i18n

#### Scenario: Duplicate and bulk-delete wording
- **WHEN** a user duplicates a router or opens the bulk-delete confirmation for routers
- **THEN** the frontend-owned dialog text identifies the entity as an Auto Router or Auto Routers

#### Scenario: Core error text remains verbatim
- **WHEN** Core rejects a router write with a validation message naming a router
- **THEN** the existing error notification shows that message verbatim and retains the user's draft

#### Scenario: Other frontend descriptions identify auto routers
- **WHEN** a frontend-owned description elsewhere in the app refers to the router entity, including the session deployment description
- **THEN** it uses auto router terminology without changing the names of other entities

### Requirement: Router role references open their Core role details

The Core-direct router Roles tab SHALL offer Open in a new tab for each displayed role, following `core-role-reference-navigation`, without changing `userRoles` membership behavior.

#### Scenario: Open a router role

- **WHEN** a user selects Open in a new tab on a router role row
- **THEN** the unqualified platform-role detail address for that role opens in a new tab

### Requirement: Embedded router UI
The router's `Parameters` tab SHALL offer a `UI` view that embeds the router's editor URL in an iframe, as
the Applications `Parameters` tab does. The editor URL SHALL resolve as for an application: the picked
app-type schema's `dial:applicationTypeEditorUrl` when it has one, otherwise the router's `editorUrl`. When
an editor URL resolves, the tab SHALL open in the `UI` view. The header save and discard actions SHALL act on
the iframe while it reports unsaved changes, and leaving the tab with unsaved iframe changes SHALL ask for
confirmation, as for applications. A successful iframe save SHALL show the router update notification; a
failed one SHALL show an error notification with the iframe's message. A router without a schema SHALL offer
the `UI` view only. The `UI` view SHALL NOT be offered to a read-only admin or for a router opened from the
`file` root.

#### Scenario: Router with an editor URL opens the UI view
- **WHEN** a user opens the `Parameters` tab of a router that has an `editorUrl`
- **THEN** the tab shows the `UI` view with an iframe loaded from that URL

#### Scenario: Schema editor URL takes precedence
- **WHEN** a router has an `editorUrl` and its picked schema declares a different
  `dial:applicationTypeEditorUrl`
- **THEN** the iframe loads the schema's URL

#### Scenario: Router without a schema offers only the UI view
- **WHEN** a user opens the `Parameters` tab of a router that has an `editorUrl` and no schema
- **THEN** no view selector, no table, and no add-property action is shown

#### Scenario: Router with a schema offers every view
- **WHEN** a user opens the `Parameters` tab of a router that has a schema and an `editorUrl`
- **THEN** the view selector offers `Table`, `Form`, and `UI`

#### Scenario: Header save goes to the iframe
- **WHEN** the iframe reports unsaved changes and the user activates the header save action
- **THEN** the save is sent to the iframe, and its success shows the router update notification

#### Scenario: Leaving the tab with unsaved iframe changes
- **WHEN** the iframe reports unsaved changes and the user switches to another tab
- **THEN** a confirmation modal asks whether to save or discard before the tab switches

#### Scenario: File-defined router has no UI view
- **WHEN** a user opens a router from the `file` root that has an `editorUrl` and a schema, and opens its
  `Parameters` tab
- **THEN** no iframe is rendered and the `UI` view is not offered

#### Scenario: Read-only router with only an editor URL has no Parameters tab
- **WHEN** a read-only admin, or a user on the `file` root, opens a router that has an `editorUrl` and no
  schema
- **THEN** the tab list reads `Properties`, `Features`, `Catalog`, `Roles`

