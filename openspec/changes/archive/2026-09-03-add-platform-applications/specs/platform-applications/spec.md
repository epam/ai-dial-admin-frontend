## ADDED Requirements

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

#### Scenario: Toolbar "New" menu offers a platform-specific create action
- **WHEN** the user opens the "New" toolbar menu while the `platform` bucket or an item under it is the
  current context
- **THEN** the menu offers "New Platform Application", distinct from the existing "New Application"
  entry used for the `public` bucket

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

### Requirement: Platform application detail view
The system SHALL provide a detail view for a platform-bucket application under
`src/components/Assets/Platform/Apps/`, distinct from the public Apps detail view, showing a Properties
tab for the fields Core persists for a platform-bucket application and omitting versioning/publish tabs
entirely.

#### Scenario: Opening a platform application shows the platform detail view
- **WHEN** the user clicks a platform-bucket application row
- **THEN** the system navigates to that application's detail route and renders the platform Apps view,
  not the public Apps view

#### Scenario: Platform application detail has no version tab
- **WHEN** the user views a platform-bucket application's detail
- **THEN** no version-history or publish tab is present
