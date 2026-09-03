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

### Requirement: Platform bucket shown above public in the Assets Applications grid
The system SHALL display a `platform` bucket as a top-level node in the existing
`Assets ▸ Applications` grid (`/assets-applications`), positioned above the `public` bucket, using the
same `BaseAssetList` instance the public applications list already uses. No new menu entry and no new
top-level list route SHALL be introduced for this bucket.

#### Scenario: Platform bucket appears above public on first load
- **WHEN** the user navigates to `/assets-applications`
- **THEN** the grid shows a `platform` top-level node above the `public` top-level node, both fetched
  and rendered in the same tree

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
The system SHALL NOT display or require a version field when creating a new application while
browsing the `platform` bucket, since the bucket has no versioning concept. Creating into the
`public` bucket is unaffected and keeps requiring a version.

#### Scenario: No version field when creating into the platform bucket
- **WHEN** the user opens the create form while browsing the `platform` bucket
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the public bucket
- **WHEN** the user opens the create form while browsing the `public` bucket
- **THEN** the version field is shown and required, unchanged from current behavior

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
The system SHALL strip fields the merge reader adds but that are not part of Core's `Application`
entity — `status`, `validationWarnings`, `author`, `createdAt`, `updatedAt`, and `reference` — before
sending a create or update write for a platform-bucket application. Unlike the `public` bucket's
generic write path, the `platform` bucket's write path deserializes strictly and rejects any
unrecognized field.

#### Scenario: A platform application save round-trips without a parse failure
- **WHEN** the user edits and saves a platform-bucket application whose fetched entity carries
  `status`, `author`, `createdAt`, `updatedAt`, and `reference`
- **THEN** the write succeeds, with none of those fields present in the request body sent to Core

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
