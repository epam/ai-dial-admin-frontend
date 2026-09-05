# platform-toolsets Specification

## Purpose
Platform-bucket toolsets shown as a second, flat bucket in the existing `Assets ▸ Toolsets` grid
(`/assets-toolsets`), above the hierarchical, versioned `public` bucket. DIAL Core already gives
platform-bucket toolsets full field/tab/auth parity with public-bucket ones (auth-secret encryption
and credential-locator scope both derive from the resource's own bucket in `ToolSetService`,
discovered-tools/sign-in/sign-out all resolve by the toolset's path regardless of bucket — see
`toolset-resources-core-api`'s platform requirements for the write-path details); the differences
this capability covers are structural (flat, no folders, no versioning) and surface-level (a
restricted action set, a dedicated detail view). Created by archiving change `add-platform-toolsets`.

## Requirements

### Requirement: Platform bucket shown above public in the Assets Toolsets grid
The system SHALL display a `platform` bucket as a top-level node in the existing
`Assets ▸ Toolsets` grid (`/assets-toolsets`), positioned above the `public` bucket, using the same
`BaseAssetList` instance the public toolsets list already uses. No new menu entry and no new
top-level list route SHALL be introduced for this bucket.

#### Scenario: Platform bucket appears above public on first load
- **WHEN** the user navigates to `/assets-toolsets`
- **THEN** the grid shows a `platform` top-level node above the `public` top-level node, both fetched
  and rendered in the same tree

#### Scenario: No separate platform toolsets list page exists
- **WHEN** the user looks for a platform toolsets entry in the sidebar navigation
- **THEN** no such entry exists — platform toolsets are reachable only through the existing
  `/assets-toolsets` grid

### Requirement: Platform bucket toolsets are flat
The system SHALL NOT offer folder creation, nested navigation, or versioning for toolsets under the
`platform` bucket, matching the flat treatment already given to platform applications and the six
existing platform-only entities.

#### Scenario: No folder actions on the platform node
- **WHEN** the user opens the context menu on the `platform` top-level node or any toolset under it
- **THEN** no folder-create, move, or nested-navigation actions are offered

#### Scenario: No versioning on a platform toolset
- **WHEN** the user opens a platform-bucket toolset's detail view
- **THEN** no version history, publish, or version-switcher UI is shown

### Requirement: Platform bucket toolset rows use the restricted action set
The system SHALL restrict row and multi-select actions on `platform`-bucket toolset rows to
duplicate, delete, and open-in-new-tab — the same set already used by platform applications and the
six existing flat platform views — while `public`-bucket rows and the folder tree keep their current,
unrestricted action set.

#### Scenario: Platform row actions are restricted
- **WHEN** the user opens the row action menu for a toolset under the `platform` bucket
- **THEN** only duplicate, delete, and open-in-new-tab are offered

#### Scenario: Public row actions are unchanged
- **WHEN** the user opens the row action menu for a toolset under the `public` bucket
- **THEN** the full existing action set is offered, unchanged from current behavior

#### Scenario: Toolbar "New" menu offers a create action while browsing the platform bucket
- **WHEN** the user opens the "New" toolbar menu while the `platform` bucket or an item under it is
  the current context in the Toolsets view
- **THEN** the menu offers a single "Toolset" entry (the same label the `public` bucket's create
  entry uses), with no folder-create or import entries alongside it

### Requirement: Platform bucket toolset rows use the same column set as other platform entities
The system SHALL display the same flat column set platform applications and the six existing
platform-only views use — Name, Author, Created time, Updated time — for `platform`-bucket toolset
rows, instead of the `public` bucket's Name/Version/Author/Updated time set.

#### Scenario: Platform-bucket rows show no Version column
- **WHEN** the user browses the `platform` bucket in the Assets Toolsets grid
- **THEN** the grid shows Name, Author, Created time, and Updated time columns, with no Version
  column

#### Scenario: Public-bucket rows are unaffected
- **WHEN** the user browses the `public` bucket in the Assets Toolsets grid
- **THEN** the grid keeps its existing Name, Version, Author, and Updated time columns

### Requirement: Creating a platform toolset has no version field
The system SHALL NOT display or require a version field when creating a new toolset while browsing
the `platform` bucket, since the bucket has no versioning concept. Creating into the `public` bucket
is unaffected and keeps requiring a version.

#### Scenario: No version field when creating into the platform bucket
- **WHEN** the user opens the create form while browsing the `platform` bucket in the Toolsets view
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the public bucket
- **WHEN** the user opens the create form while browsing the `public` bucket in the Toolsets view
- **THEN** the version field is shown and required, unchanged from current behavior

### Requirement: Platform toolset server actions
The system SHALL provide server actions to list, get, create, update, delete, and bulk-delete
toolsets in the `platform` bucket, calling the shared Core asset client with `ResourceType.TOOLSET`
against `platform/`-prefixed paths — no `ai-dial-core` change is required, since Core already routes
the `platform` bucket segment for toolsets to `ConfigResourceController` ahead of the generic
toolsets route.

#### Scenario: Listing platform toolsets
- **WHEN** the platform bucket node is expanded in the Toolsets view
- **THEN** the system fetches toolsets via the asset client with a `platform/`-prefixed path and
  displays them in the grid

#### Scenario: Creating a platform toolset omits version and folder placement
- **WHEN** the user creates a new platform toolset
- **THEN** the write payload sent to Core carries no `version` and no folder-derived path segment,
  unlike a public-bucket toolset create

#### Scenario: Deleting a platform toolset
- **WHEN** the user deletes a platform toolset
- **THEN** the system sends a delete request against its `platform/`-prefixed path, conditional on
  the caller's etag when supplied

### Requirement: Platform toolset writes strip read-only and derived fields
The system SHALL strip fields the merge reader adds but that are not part of Core's `ToolSet` entity
— `status`, `validationWarnings`, `author`, `createdAt`, `updatedAt`, and `reference` — before sending
a create or update write for a platform-bucket toolset. Unlike the `public` bucket's generic write
path, the `platform` bucket's write path deserializes strictly and rejects any unrecognized field.

#### Scenario: A platform toolset save round-trips without a parse failure
- **WHEN** the user edits and saves a platform-bucket toolset whose fetched entity carries `status`,
  `author`, `createdAt`, `updatedAt`, and `reference`
- **THEN** the write succeeds, with none of those fields present in the request body sent to Core

### Requirement: A rejected platform toolset name surfaces through the existing error path
The system SHALL NOT pre-validate a toolset name against Core's stricter platform-bucket key pattern
before submitting a create or update. When Core rejects the write because the name fails that
pattern, the system SHALL surface the rejection through the existing error-notification path rather
than failing silently.

#### Scenario: An invalid platform toolset name is rejected with a visible error
- **WHEN** the user creates or renames a platform-bucket toolset with a name Core's key-pattern
  validation rejects
- **THEN** the write fails, and an error notification carrying Core's rejection message is shown

### Requirement: Platform toolset detail view
The system SHALL provide a detail view for a platform-bucket toolset under
`src/components/Assets/Platform/Toolsets/`, distinct from the public Toolsets detail view, reusing
the public Toolsets `TabsContent` (Properties, Tools, Audit) and its authentication controls
(sign-in/sign-out) for full field/tab/auth parity, but showing no versioning/publish UI and no
folder-move control. Both buckets share the existing `/assets-toolsets/[id]` detail route — a `?path=`
query param present means public bucket; its absence means platform bucket.

#### Scenario: Opening a platform toolset shows the platform detail view
- **WHEN** the user clicks a platform-bucket toolset row
- **THEN** the system navigates to `/assets-toolsets/[id]` with no `?path=` query param, and renders
  the platform Toolsets view, not the public Toolsets view

#### Scenario: Platform toolset detail has no version tab
- **WHEN** the user views a platform-bucket toolset's detail
- **THEN** no version-history or publish tab is present

#### Scenario: Platform toolset detail has no folder-move control
- **WHEN** the user views a platform-bucket toolset's Properties tab
- **THEN** no folder-move control is shown, since the platform bucket has no folders to move into

#### Scenario: Platform toolset sign-in and sign-out work the same as public
- **WHEN** the user signs in to or out of a platform-bucket toolset's external service
- **THEN** the sign-in/sign-out flow behaves identically to a public-bucket toolset, since Core scopes
  authentication credentials and secret encryption to the resource's own bucket

### Requirement: Roles tab on platform toolset detail view
The system SHALL provide a Roles tab on the platform-bucket toolset detail view, editing the
resource's `user_roles` field, with the selectable roles read from DIAL Core's own role population
(the union of its API-written and configuration-file-declared roles), not the admin-backend's role
list. The public-bucket toolset detail view SHALL NOT gain this tab.

#### Scenario: Roles tab appears on the platform toolset detail view
- **WHEN** a user opens a platform-bucket toolset's detail view
- **THEN** a `Roles` tab is present alongside Properties and Tools

#### Scenario: Roles selection round-trips on the platform toolset resource
- **WHEN** a user selects roles on a platform toolset and saves
- **THEN** the selection persists to the resource's `user_roles` field and is rendered as selected
  when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built for a platform toolset
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's
  own role list cannot see it

#### Scenario: The public-bucket toolset detail view has no Roles tab
- **WHEN** a user opens a public-bucket toolset's detail view (its URL carries a `?path=` query
  param)
- **THEN** no `Roles` tab is shown, unchanged from current behavior

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list
  warning already used elsewhere on this asset surface is shown

#### Scenario: A read-only admin sees the Roles tab without mutating controls
- **WHEN** a read-only admin opens a platform toolset's Roles tab
- **THEN** the assigned roles are shown, and no add or remove control is offered
