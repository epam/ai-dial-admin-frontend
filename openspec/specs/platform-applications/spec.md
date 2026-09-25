# platform-applications Specification

## Purpose
Platform-bucket applications shown as a second, flat bucket in the existing `Assets ▸ Applications`
grid (`/assets-applications`), above the hierarchical, versioned `public` bucket. DIAL Core already
gives platform-bucket applications full field/tab parity with public-bucket ones (MCP, Parameters,
Features, external services, schema-rich apps — see `application-resources-core-api`'s platform
requirements for the write-path details); the differences this capability covers are structural
(flat, no folders, no versioning) and surface-level (a restricted action set, a dedicated detail
view). Created by archiving change `add-platform-applications`.
## Requirements
### Requirement: File root shown above physical buckets in the Assets Applications grid
The system SHALL display synthetic `file`, `platform`, and `public` roots in the existing `Assets ▸ Applications` grid when Catalog is enabled, using the same `BaseAssetList` instance. The order SHALL be `file`, `platform`, then `public`. When Catalog is disabled, the system SHALL omit `platform` and its resource requests but SHALL retain `file` and `public` roots. No new menu entry or top-level list route SHALL be introduced.

#### Scenario: All roots appear when Catalog is enabled
- **WHEN** a user opens `/assets-applications` with Catalog enabled
- **THEN** the grid shows `file`, `platform`, and `public` roots in that order

#### Scenario: File root remains when Catalog is disabled
- **WHEN** a user opens `/assets-applications` with Catalog disabled
- **THEN** the grid shows `file` and `public`, does not show `platform`, and makes no platform resource request

### Requirement: File-root applications are flat and read-only
The system SHALL treat Applications under the synthetic `file` root as name-only, flat, and read-only. It SHALL load their names from DIAL Core's config-file `applications` endpoint with the initial root batch. It SHALL offer no create, import, export, delete, bulk delete, duplicate, rename, move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: File-root application names load with the listing
- **WHEN** a user opens the Applications listing
- **THEN** the system requests config-file application names with the physical-root reads and renders them without resource metadata or per-name body reads

#### Scenario: File-root application actions are immutable
- **WHEN** a user browses the Applications `file` root
- **THEN** only open and open-in-new-tab are available for an application row

### Requirement: File-root application detail view
The system SHALL open a file-root application at `/assets-applications/{id}?configFile=true`, without a public-bucket `path` parameter. It SHALL preserve the existing config-file detail read and read-only presentation, including hidden ADMIN|CORE format selection.

#### Scenario: File-root application opens without public path
- **WHEN** a user opens an application row from the `file` root
- **THEN** the system navigates to `/assets-applications/{id}?configFile=true` and renders it read-only

#### Scenario: No separate platform applications list page exists
- **WHEN** the user looks for a platform applications entry in the sidebar navigation
- **THEN** no such entry exists — platform applications are reachable only through the existing
  `/assets-applications` grid

### Requirement: Platform bucket applications are flat
The system SHALL NOT offer folder creation, nested navigation, or versioning for applications under
the `platform` bucket, matching the flat treatment already given to the six existing platform-only
entities (models, app runners, interceptors, routes, roles, keys).

#### Scenario: No folder actions on the platform node
- **WHEN** the user opens the context menu on the `platform` top-level node or any application under it
- **THEN** no folder-create, move, or nested-navigation actions are offered

#### Scenario: No versioning on a platform application
- **WHEN** the user opens a platform-bucket application's detail view
- **THEN** no version history, publish, or version-switcher UI is shown

### Requirement: Platform bucket application rows use the restricted action set
The system SHALL restrict row and multi-select actions on `platform`-bucket application rows to
duplicate, delete, and open-in-new-tab — the same set already used by the six existing flat platform
views — while `public`-bucket rows and the folder tree keep their current, unrestricted action set.

#### Scenario: Platform row actions are restricted
- **WHEN** the user opens the row action menu for an application under the `platform` bucket
- **THEN** only duplicate, delete, and open-in-new-tab are offered

#### Scenario: Public row actions are unchanged
- **WHEN** the user opens the row action menu for an application under the `public` bucket
- **THEN** the full existing action set is offered, unchanged from current behavior

#### Scenario: Toolbar "New" menu offers a create action while browsing the platform bucket
- **WHEN** the user opens the "New" toolbar menu while the `platform` bucket or an item under it is the
  current context
- **THEN** the menu offers a single "Application" entry (the same label the `public` bucket's create
  entry uses), with no folder-create or import entries alongside it

### Requirement: Platform bucket application rows use the same column set as other platform entities
The system SHALL display the same flat column set the six existing platform-only views use — Name,
Author, Created time, Updated time — for `platform`-bucket application rows, instead of the `public`
bucket's Name/Version/Author/Updated time set.

#### Scenario: Platform-bucket rows show no Version column
- **WHEN** the user browses the `platform` bucket in the Assets Applications grid
- **THEN** the grid shows Name, Author, Created time, and Updated time columns, with no Version column

#### Scenario: Public-bucket rows are unaffected
- **WHEN** the user browses the `public` bucket in the Assets Applications grid
- **THEN** the grid keeps its existing Name, Version, Author, and Updated time columns

### Requirement: Creating a platform application has no version field
The system SHALL NOT display or require a version field on any create form whose destination is
the `platform` bucket — the list-page create form while browsing the `platform` bucket, and the
runner-seeded create modal opened from an app-runner detail view with the `platform` folder
selected — since the bucket has no versioning concept. Creating into the `public` bucket is
unaffected and keeps requiring a version. A create submitted with the `platform` bucket as its
destination SHALL write the flat, unversioned `platform/{name}` resource through the
platform-bucket create action, and the resulting application SHALL open from the post-create
navigation and from the Assets Applications grid's platform bucket without a 404.

#### Scenario: No version field when creating into the platform bucket
- **WHEN** the user opens the create form while browsing the `platform` bucket
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the public bucket
- **WHEN** the user opens the create form while browsing the `public` bucket
- **THEN** the version field is shown and required, unchanged from current behavior

#### Scenario: The runner-seeded create modal hides the version field for a platform destination
- **WHEN** the user opens the create-assets-application modal from an app-runner detail view and
  selects the `platform` folder
- **THEN** no version field is shown, the form can be submitted without one, and no version suffix
  is written into the created resource's path

#### Scenario: The runner-seeded create modal keeps the version field for a public destination
- **WHEN** the user opens the create-assets-application modal from an app-runner detail view and
  selects a `public` folder
- **THEN** the version field is shown and required, and the created resource keeps its
  `{folderId}{name}__{version}` path, unchanged from current behavior

#### Scenario: A platform-bucket application created from a runner opens without a 404
- **WHEN** a user creates an application from an app-runner detail view with the `platform`
  folder selected
- **THEN** the post-create navigation opens the new application's platform-bucket detail view, and
  clicking the application's row in the Assets Applications grid's `platform` bucket opens the
  same detail view — neither resolves to a 404 page

### Requirement: Platform application server actions
The system SHALL provide server actions to list, get, create, update, delete, and bulk-delete
applications in the `platform` bucket, calling the shared Core asset client with
`ResourceType.APPLICATION` against `platform/`-prefixed paths — no `ai-dial-core` change is required,
since Core already routes the `platform` bucket segment for applications to
`ConfigResourceController` ahead of the generic applications route.

#### Scenario: Listing platform applications
- **WHEN** the platform bucket node is expanded
- **THEN** the system fetches applications via the asset client with a `platform/`-prefixed path and
  displays them in the grid

#### Scenario: Creating a platform application omits version and folder placement
- **WHEN** the user creates a new platform application
- **THEN** the write payload sent to Core carries no `version` and no folder-derived path segment,
  unlike a public-bucket application create

#### Scenario: Deleting a platform application
- **WHEN** the user deletes a platform application
- **THEN** the system sends a delete request against its `platform/`-prefixed path, conditional on the
  caller's etag when supplied

### Requirement: Platform application writes strip read-only and derived fields
The system SHALL strip the merge layer's `_metadata` object — which holds the read-only and
derived fields `status`, `validationWarnings`, `author`, `createdAt`, `updatedAt`, `name`,
`path`, `folderId`, `version`, and `nodeType` (see the `core-resource-entity-metadata`
capability) — plus the client-only tracking field `reference`, before sending a create or update
write for a platform-bucket application. Unlike the `public` bucket's generic write path, the
`platform` bucket's write path deserializes strictly and rejects any unrecognized field.

#### Scenario: A platform application save round-trips without a parse failure
- **WHEN** the user edits and saves a platform-bucket application whose fetched entity carries
  `_metadata` and `reference`
- **THEN** the write succeeds, with neither `_metadata` nor `reference` present in the request
  body sent to Core

### Requirement: Platform application folderId identifies the platform bucket
The system SHALL identify a platform-bucket application's bucket explicitly on every shape that
carries one: listing rows carry `bucket: 'platform'` and no `folderId`, and a merged detail read
carries `'platform/'` as `_metadata.folderId` for write-path identity, matching what the write path
sets on create and update. No code path SHALL infer the bucket by applying a `platform/`-prefix
check to a `folderId`; the folderId-prefix check remains only as a path-level helper for the
browsed current path, not as a row or entity discriminator.

#### Scenario: A freshly-fetched platform application's bucket is identified explicitly
- **WHEN** the user opens a platform-bucket application that was not created or updated in the
  current session
- **THEN** the fetched resource identifies its bucket through its metadata shape, and every
  consumer answers "which bucket" from that explicit field — no `isPlatformBucketPath(asset.folderId)`
  check is performed on a freshly-fetched resource

#### Scenario: A platform listing row carries no folderId
- **WHEN** platform-bucket applications are listed into the folder tree
- **THEN** each row carries `bucket: 'platform'` and no `folderId`, and row-action handling (delete
  shaping, open-in-new-tab) selects the platform treatment from the row's bucket

### Requirement: Platform application name reflects the corrected dual-bucket identity
The system SHALL set both the flat `name` and `_metadata.name` on a platform-bucket application to
the name its Core resource URL encodes, overriding a divergent `content.name`, when the resource
is read from DIAL Core — the one documented exception to `core-resource-entity-metadata`'s
"content is never mutated by the merge" requirement.

#### Scenario: A platform application's stale content name is corrected on read
- **WHEN** a platform-bucket application's content response carries a `name` that no longer
  matches the name encoded in its Core resource URL
- **THEN** the merged entity's flat `name` and `_metadata.name` both hold the URL-derived name

### Requirement: Platform application header shows the platform bucket with no link
The system SHALL show `platform` as the value of the header's Folder Storage field for a
platform-bucket application, without the open-in-new-tab link shown for a `public`-bucket folder
path, since the platform bucket has no folder location to link to.

#### Scenario: Header Folder Storage names the platform bucket
- **WHEN** the user views a platform-bucket application's detail header
- **THEN** the Folder Storage field shows `platform`, with no open-in-new-tab affordance

#### Scenario: Public-bucket header Folder Storage is unaffected
- **WHEN** the user views a public-bucket application's detail header
- **THEN** the Folder Storage field shows the folder path with its existing open-in-new-tab link,
  unchanged from current behavior

### Requirement: Platform application detail view
The system SHALL provide a detail view for a platform-bucket application under
`src/components/Assets/Platform/Applications/`, distinct from the public Apps detail view, reusing the
public Apps `TabsContent`/tab components for full field/tab parity but showing no versioning/publish
UI and no folder-move control. Both buckets share the existing `/assets-applications/[id]` detail
route — a `?path=` query param present means public bucket; its absence means platform bucket.

#### Scenario: Opening a platform application shows the platform detail view
- **WHEN** the user clicks a platform-bucket application row
- **THEN** the system navigates to `/assets-applications/[id]` with no `?path=` query param, and
  renders the platform Apps view, not the public Apps view

#### Scenario: Platform application detail has no version tab
- **WHEN** the user views a platform-bucket application's detail
- **THEN** no version-history or publish tab is present

#### Scenario: Platform application detail has no folder-move control
- **WHEN** the user views a platform-bucket application's Properties tab
- **THEN** no folder-move control is shown, since the platform bucket has no folders to move into

### Requirement: Roles tab on platform application detail view
The system SHALL provide a Roles tab on the platform-bucket application detail view, matching the
layout of the config-entity Roles tab (`EntityRoles`/`RolesGrid`): a title with a live count of
granted roles, a "Make available to specific roles" toggle, and an Add-role control styled as a
primary button. The tab SHALL edit the resource's `user_roles` field, with the selectable roles read
from DIAL Core's own role population (the union of its API-written and configuration-file-declared
roles), not the admin-backend's role list. The public-bucket application detail view SHALL NOT gain
this tab.

`user_roles` SHALL be interpreted as three distinct states: an empty array means the application is
available to no user; a populated array means the application is available only to the listed roles;
`undefined` or `null` means the application is available to all users. The toggle SHALL reflect and
drive this: switching it on (from `undefined`/`null`) SHALL set `user_roles` to an empty array;
switching it off (from any array) SHALL clear `user_roles` to `undefined`.

When the grid has no granted roles, it SHALL show "No Roles" as its empty state, rather than a
warning message. When the application is available to no user (`user_roles` is an empty array), a
notification SHALL be shown below the grid stating the application is not available to any
end-users; this notification SHALL NOT be shown when `user_roles` is `undefined`/`null` or non-empty.

#### Scenario: Roles tab appears on the platform application detail view
- **WHEN** a user opens a platform-bucket application's detail view
- **THEN** a `Roles` tab is present alongside Properties, Features, Parameters, Interceptors,
  Dependencies, and App Routes

#### Scenario: Roles selection round-trips on the platform application resource
- **WHEN** a user selects roles on a platform application and saves
- **THEN** the selection persists to the resource's `user_roles` field and is rendered as selected
  when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built for a platform application
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's
  own role list cannot see it

#### Scenario: The public-bucket application detail view has no Roles tab
- **WHEN** a user opens a public-bucket application's detail view (its URL carries a `?path=` query
  param)
- **THEN** no `Roles` tab is shown, unchanged from current behavior

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list
  warning already used elsewhere on this surface (e.g. the Interceptors tab) is shown

#### Scenario: A read-only admin sees the Roles tab without mutating controls
- **WHEN** a read-only admin opens a platform application's Roles tab
- **THEN** the assigned roles are shown, and no add or remove control is offered

#### Scenario: The header shows a live role count
- **WHEN** a user grants or revokes a role on a platform application's Roles tab
- **THEN** the header's count updates immediately to match the number of currently granted roles

#### Scenario: Toggling availability on narrows to no one
- **WHEN** a user switches "Make available to specific roles" on for a platform application whose `user_roles` was `undefined` or `null`
- **THEN** `user_roles` becomes an empty array and the roles grid is available to start adding roles

#### Scenario: Toggling availability off restores available-to-all
- **WHEN** a user switches "Make available to specific roles" off for a platform application with any `user_roles` array
- **THEN** `user_roles` becomes `undefined` and, on save, the request body carries no `user_roles` property

#### Scenario: Empty roles grid shows "No Roles"
- **WHEN** a platform application's Roles tab has no granted roles
- **THEN** the grid's empty state reads "No Roles"

#### Scenario: Unavailable-to-all notification appears only when genuinely empty
- **WHEN** a platform application's `user_roles` is an empty array
- **THEN** a notification below the grid states the application is not available to any end-users

#### Scenario: No notification when available to all
- **WHEN** a platform application's `user_roles` is `undefined` or `null`
- **THEN** no "not available" notification is shown

### Requirement: New platform application defaults to unavailable
The system SHALL initialize a newly created platform-bucket application's `user_roles` to an empty
array, so it is unavailable to any end-user until roles are explicitly granted, rather than
defaulting to available to all by omission. Applications created in the public bucket (config
entities) are unaffected.

#### Scenario: A freshly created platform application starts with no granted roles
- **WHEN** a user creates a new platform-bucket application and opens its Roles tab before granting any role
- **THEN** the tab shows zero granted roles and the "not available to any end-users" notification is shown

### Requirement: A platform-bucket application exposes its catalog metadata

The system SHALL let an admin attach a catalog schema to a platform-bucket application and edit the
catalog values it describes, using the shared `catalog-properties-editing` mechanism. The
platform-application resource SHALL round-trip `catalog_schema_id` and `catalog_properties`.

A user-bucket application SHALL be offered the same editing, with one difference in who rejects an
invalid write: DIAL Core validates a user-bucket resource on write and answers `400`, whereas a
platform-bucket resource is only rejected later, when Core assembles its merged configuration. The
client-side gate applies to both.

#### Scenario: Catalog metadata is offered on an application

- **WHEN** an admin opens an application's detail view in either bucket
- **THEN** the catalog schema selection and, once a schema is selected, its values editor are offered

#### Scenario: The two fields survive a save

- **WHEN** an admin attaches a schema, fills in values, and saves the application
- **THEN** both `catalog_schema_id` and `catalog_properties` are written to Core and reappear on
  reload

#### Scenario: Core's own rejection is surfaced for a user-bucket application

- **WHEN** Core rejects a user-bucket application's catalog values with a `400`
- **THEN** the error notification carries Core's message rather than a generic failure

### Requirement: Switching App Runner preserves already-set applicationProperties
The `Assets` resource source editor SHALL, when the user switches the selected App Runner on a
platform/asset Application, merge the new runner's default `applicationProperties` under the
entity's existing `applicationProperties` rather than replacing them outright. For any key present
in both the entity's current `applicationProperties` and the new runner's defaults, the entity's
existing value SHALL win. A key present only in the new runner's defaults SHALL be added; a key
present only in the entity's existing values and not in the new runner's schema SHALL be preserved
unchanged.

#### Scenario: Switching to a runner with the same schema preserves a set value
- **WHEN** the user has set a value for a parameter (e.g. `openapi`) on an Application, then switches
  the selected App Runner to a different runner that defines the same parameter
- **THEN** the parameter's value on the Application is unchanged after the switch

#### Scenario: Switching runner still applies defaults for parameters not already set
- **WHEN** the user switches the selected App Runner to one that defines a parameter the Application
  does not already have a value for
- **THEN** that parameter is added with the new runner's default value

