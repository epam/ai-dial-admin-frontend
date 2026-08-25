## Purpose

The `Assets > Routes` admin surface: a flat, unversioned list and Properties-only detail view over
DIAL Core's `routes/platform` config resources — a first-class, server-validated Core resource type —
read and written directly through Core rather than the admin backend. Unlike an interceptor, no
entity surface attaches a route to itself by name, so this capability introduces no attach-picker
widening.

## Requirements

### Requirement: Assets > Routes menu entry
The system SHALL add a `Routes` menu item to the Assets section of the admin menu, directly after
`Interceptors`, linking to a new `/assets-routes` route.

#### Scenario: Routes follows Interceptors in the Assets section
- **WHEN** the Assets section of the menu renders
- **THEN** `Routes` appears immediately after `Interceptors`

### Requirement: Route asset list is flat with create and delete actions
The system SHALL render the route asset list as a single, non-nested list of entries under the
`platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and
no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/assets-routes`
- **THEN** all route resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the route asset list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action opens the route create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting only the route's name — no display name or description field,
  since `Route` has neither — and submitting it creates the resource and navigates to its detail view

#### Scenario: Bulk delete removes the selected routes
- **WHEN** a user selects several routes and confirms bulk delete
- **THEN** each selected route is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the route asset list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Route asset list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for route assets, all sourced
from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the route asset list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps come from Core metadata
- **WHEN** the route asset list renders
- **THEN** the created-at and updated-at columns are populated from the Core metadata node's
  `createdAt` and `updatedAt` fields, each rendered as a localized date rather than raw epoch
  milliseconds

### Requirement: Route names follow Core's plain entity-name rule
The system SHALL treat a route's name as a plain Core entity name — using the same shared name field
and validation the `Assets > Models` create form already uses — and SHALL NOT apply any URI-encoding
or `$id`-style handling to it.

#### Scenario: The create form uses the shared name field
- **WHEN** a user opens the route create form
- **THEN** the same name field and validation `Assets > Models`/`Assets > Interceptors` use is shown,
  with no display-name or description field alongside it, since `Route` has neither

#### Scenario: A valid name creates the resource
- **WHEN** a user submits a valid name
- **THEN** the resource is created under `routes/platform/{name}` and the list/detail view address it
  by that plain name

### Requirement: Route asset detail view tab set
The system SHALL render a route asset's detail view with exactly one tab, `Properties`, and SHALL NOT
include a `Roles`, `Features`, `Configuration`, or `Audit` tab, a Core-sync status banner, or any
reverse-index tab showing which other entities reference this route.

#### Scenario: Detail view renders exactly Properties
- **WHEN** a user opens a route asset's detail view
- **THEN** the tab list contains exactly `Properties`

#### Scenario: No Roles, Features, Configuration, or Audit tab
- **WHEN** a user opens a route asset's detail view
- **THEN** no `Roles`, `Features`, `Configuration`, or `Audit` tab is shown

### Requirement: Properties tab content
The system SHALL render the route asset's Properties tab with paths, rewrite-path, methods, a
response/upstreams output choice (status and body when response is selected, upstream endpoints
otherwise), max-retry-attempts, order, and request/response attachment paths, composed from the same
individual controls `Entities > Routes`' Properties tab uses.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits a Properties field and saves
- **THEN** the value is stored on the route resource and reappears on reload

#### Scenario: Output choice governs which fields are shown
- **WHEN** a user selects the "Response" output on a route
- **THEN** the status and body fields are shown and the upstream endpoints editor is hidden

#### Scenario: Upstream endpoints are shown when output is Upstreams
- **WHEN** a user selects the "Upstreams" output on a route
- **THEN** the upstream endpoints editor is shown and the status/body fields are hidden

### Requirement: Editing an upstream endpoint without its secret warns before save
The system SHALL warn a user when an edit to a route's upstream endpoint would drop its previously
stored secret, using the same detection and warning `Assets > Models` already applies to its own
upstream endpoints, since a route's `upstreams` field is the same shape as a model's.

#### Scenario: Changing an upstream endpoint without re-entering its secret warns
- **WHEN** a user changes an upstream's endpoint URL without re-entering its authentication secret
- **THEN** a warning names the affected endpoint before the change is saved

### Requirement: Core validates a write; the client adds no meta-schema layer
The system SHALL rely on Core's own server-side validation — Core deserializes a route write into its
`Route` entity class and rejects an invalid one itself — rather than adding a client-side
meta-schema-validation layer, and SHALL surface Core's rejection message to the user verbatim.

#### Scenario: A rejected write surfaces Core's message
- **WHEN** a save is rejected by Core
- **THEN** an error notification shows Core's error message rather than a generic failure

### Requirement: Configuring a route asset requires no admin-backend call
Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any
admin-backend request in order to view, create, edit, or delete a route asset.

#### Scenario: The surface is configurable without the admin backend
- **WHEN** a user opens a route asset and edits any field this surface exposes
- **THEN** no admin-backend request is required for the edit to be made or saved

### Requirement: Entities > Routes is unaffected
The system SHALL leave the admin-BE-backed `Entities > Routes` surface — its route, storage, Roles and
Audit tabs, and the existing Admin/CORE-format toggle — unchanged by this capability.

#### Scenario: Entity route view keeps all of its tabs and behavior
- **WHEN** a user opens an entity-side route
- **THEN** its Properties, Roles, and Audit tabs, and the Admin/CORE-format toggle, all behave exactly
  as before

### Requirement: No route-attach picker widening
Unlike an interceptor, no entity surface attaches a route to itself by name — DIAL Core resolves a
route by matching a request's path and method against its global `routes` map rather than through a
per-entity reference list. The system SHALL NOT introduce a route-origin dimension or widen any
existing picker as part of this capability.

#### Scenario: No existing picker changes behavior
- **WHEN** any existing entity-attach picker in the admin console renders
- **THEN** its option list and columns are unaffected by the existence of `Assets > Routes`
