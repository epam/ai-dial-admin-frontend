## Purpose

The `Assets > Roles` admin surface: a flat, unversioned list and Properties-only detail view over
DIAL Core's `roles/platform` config resources, read and written directly through Core rather than the
admin backend.

## Requirements

### Requirement: Assets > Roles menu entry
The system SHALL add a `Roles` menu item to the Assets section of the admin menu, directly after
`Routes`, linking to a new `/assets-roles` route.

#### Scenario: Roles follows Routes in the Assets section
- **WHEN** the Assets section of the menu renders
- **THEN** `Roles` appears immediately after `Routes`

### Requirement: Role asset list is flat with create and delete actions
The system SHALL render the role asset list as a single, non-nested list of entries under the
`platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and
no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/assets-roles`
- **THEN** all role resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the role asset list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action opens the role create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting only the role's name — no display name or description field,
  since `Role` has neither — and submitting it creates the resource and navigates to its detail view

#### Scenario: Bulk delete removes the selected roles
- **WHEN** a user selects several roles and confirms bulk delete
- **THEN** each selected role is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the role asset list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Role asset list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for role assets, all sourced
from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the role asset list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps come from Core metadata
- **WHEN** the role asset list renders
- **THEN** the created-at and updated-at columns are populated from the Core metadata node's
  `createdAt` and `updatedAt` fields, each rendered as a localized date rather than raw epoch
  milliseconds

### Requirement: Role names follow Core's plain entity-name rule
The system SHALL treat a role's name as a plain Core entity name — using the same shared name field
and validation the `Assets > Models` create form already uses — and SHALL NOT apply any URI-encoding
or `$id`-style handling to it.

#### Scenario: The create form uses the shared name field
- **WHEN** a user opens the role create form
- **THEN** the same name field and validation `Assets > Models`/`Assets > Routes` use is shown, with
  no display-name or description field alongside it, since `Role` has neither

#### Scenario: A valid name creates the resource
- **WHEN** a user submits a valid name
- **THEN** the resource is created under `roles/platform/{name}` and the list/detail view address it
  by that plain name

### Requirement: Role asset detail view tab set
The system SHALL render a role asset's detail view with exactly one tab, `Properties`, and SHALL NOT
include an `Entities`, `Keys`, or `Audit` tab, or an Admin/CORE-format toggle.

#### Scenario: Detail view renders exactly Properties
- **WHEN** a user opens a role asset's detail view
- **THEN** the tab list contains exactly `Properties`

#### Scenario: No Entities, Keys, or Audit tab, and no format toggle
- **WHEN** a user opens a role asset's detail view
- **THEN** no `Entities` tab, no `Keys` tab, no `Audit` tab, and no Admin/CORE-format toggle is shown

### Requirement: Properties tab content
The system SHALL render the role asset's Properties tab with a cost-limit toggle and, when enabled,
minute/day/week/month cost-limit number inputs, plus a sharing grid (invitation TTL and max accepted
users per shareable resource type with a reset-to-default action). Cost-limit values SHALL be plain
numbers, not strings. A token whose Core-side value is too large for JavaScript to represent exactly
(DIAL Core's `Long.MAX_VALUE` "unlimited" default) SHALL be treated as absent — shown as unset and
omitted from the write — rather than displayed or persisted as an approximate, rounded number.

#### Scenario: Cost limits are editable and persist
- **WHEN** a user enables the cost-limit toggle, sets a value for a token, and saves
- **THEN** the value is stored on the role resource's `costLimit` as a number and reappears on reload

#### Scenario: Disabling the cost-limit toggle clears every token
- **WHEN** a user disables the cost-limit toggle
- **THEN** every cost-limit token is removed from the resource's `costLimit`, rather than being set to
  an explicit sentinel value

#### Scenario: An out-of-range cost-limit token is treated as unlimited, not an approximate number
- **WHEN** a cost-limit token's stored value is too large for JavaScript to represent exactly
- **THEN** the field is shown as unset rather than a rounded number, and saving without changing it
  leaves that token unset on the resource

#### Scenario: Sharing settings are editable and persist
- **WHEN** a user sets an invitation TTL or max-accepted-users value for a resource type and saves
- **THEN** the value is stored on the role resource's `share` map and reappears on reload

#### Scenario: Resetting a sharing row clears its override
- **WHEN** a user resets a sharing row to default
- **THEN** that resource type's entry is removed from the `share` map

### Requirement: Core validates a write; the client adds no meta-schema layer
The system SHALL rely on Core's own server-side validation — Core deserializes a role write into its
`Role` entity class and rejects an invalid one itself — rather than adding a client-side
meta-schema-validation layer, and SHALL surface Core's rejection message to the user verbatim.

#### Scenario: A rejected write surfaces Core's message
- **WHEN** a save is rejected by Core
- **THEN** an error notification shows Core's error message rather than a generic failure

### Requirement: Configuring a role asset requires no admin-backend call
Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any
admin-backend request in order to view, create, edit, or delete a role asset.

#### Scenario: The surface is configurable without the admin backend
- **WHEN** a user opens a role asset and edits any field this surface exposes
- **THEN** no admin-backend request is required for the edit to be made or saved

### Requirement: Entities > Roles is unaffected
The system SHALL leave the admin-BE-backed `Entities > Roles` surface — its route, storage, Entities,
Keys, and Audit tabs, and the existing Admin/CORE-format toggle — unchanged by this capability.

#### Scenario: Entity role view keeps all of its tabs and behavior
- **WHEN** a user opens an entity-side role
- **THEN** its Properties, Entities, Keys, and Audit tabs, and the Admin/CORE-format toggle, all
  behave exactly as before

### Requirement: Role asset list offers a duplicate action

The system SHALL offer a `duplicate` row action for role assets. Activating it SHALL open the
shared `DuplicatePlatformAsset` modal, which for roles collects only the new name — no Display
Name field, since `Role` has no `displayName` — and SHALL create a copy of the selected role
under the new name.

#### Scenario: Duplicate action opens a name-only modal

- **WHEN** a user activates the duplicate row action on a role
- **THEN** a modal opens with only a name field (pre-filled with a copy-suffixed name) and no Display
  Name field

#### Scenario: Submitting creates the copy under the new name

- **WHEN** a user enters a valid name and submits the duplicate modal
- **THEN** a new role resource is created as a copy of the original under the new name, and the list
  refreshes to include it

#### Scenario: Save is blocked until the name field is non-empty

- **WHEN** the duplicate modal opens with an empty name field
- **THEN** the submit button is disabled until the user enters a valid name

#### Scenario: A read-only admin is not offered the duplicate action

- **WHEN** a read-only admin views the role asset list
- **THEN** no duplicate action is offered in row menus
