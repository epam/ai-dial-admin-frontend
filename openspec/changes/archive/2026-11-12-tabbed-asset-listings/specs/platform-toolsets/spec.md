## MODIFIED Requirements

### Requirement: File-root toolsets are flat and read-only
The system SHALL treat Toolsets on the config.json tab as name-only, flat, and read-only. It SHALL load their names from DIAL Core's config-file `toolsets` endpoint when the listing mounts. It SHALL offer no create, import, export, delete, bulk delete, duplicate, rename, move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: config.json toolset names load with the listing
- **WHEN** a user opens the Toolsets listing
- **THEN** the system requests config-file toolset names once and renders them on the config.json tab without resource metadata or per-name body reads

#### Scenario: config.json toolset actions are immutable
- **WHEN** a user browses the Toolsets config.json tab
- **THEN** only open and open-in-new-tab are available for a toolset row

### Requirement: File-root toolset detail view
The system SHALL open a config.json toolset at `/assets-toolsets/{id}?configFile=true`, without a public-bucket `path` parameter. It SHALL preserve the existing config-file detail read and read-only presentation, including hidden ADMIN|CORE format selection.

#### Scenario: config.json toolset opens without public path
- **WHEN** a user opens a toolset row from the config.json tab
- **THEN** the system navigates to `/assets-toolsets/{id}?configFile=true` and renders it read-only

#### Scenario: No separate platform toolsets list page exists
- **WHEN** the user looks for a platform toolsets entry in the sidebar navigation
- **THEN** no such entry exists — platform toolsets are reachable only through the existing
  `/assets-toolsets` listing

### Requirement: Platform bucket toolsets are flat
The system SHALL NOT offer folder creation, nested navigation, or versioning for toolsets on the Platform tab,
matching the flat treatment already given to platform applications and the six existing platform-only entities.

#### Scenario: No folder actions on the Platform tab
- **WHEN** the user opens the Platform tab or the action menu of any toolset on it
- **THEN** no folder-create, move, or nested-navigation actions are offered

#### Scenario: No versioning on a platform toolset
- **WHEN** the user opens a platform-bucket toolset's detail view
- **THEN** no version history, publish, or version-switcher UI is shown

### Requirement: Platform bucket toolset rows use the restricted action set
The system SHALL restrict row and multi-select actions on Platform-tab toolset rows to duplicate, delete, and
open-in-new-tab — the same set already used by platform applications and the six existing flat platform views —
while the Public tab keeps the file manager's current, unrestricted action set.

#### Scenario: Platform row actions are restricted
- **WHEN** the user opens the row action menu for a toolset on the Platform tab
- **THEN** only duplicate, delete, and open-in-new-tab are offered

#### Scenario: Public row actions are unchanged
- **WHEN** the user opens the row action menu for a toolset on the Public tab
- **THEN** the full existing action set is offered, unchanged from current behavior

#### Scenario: Header Create offers a single Toolset entry on the Platform tab
- **WHEN** the user activates the header Create button while the Platform tab is active in the Toolsets listing
- **THEN** the create-toolset modal opens for a platform toolset, with no folder-create or import entries

### Requirement: Platform bucket toolset rows use the same column set as other platform entities
The system SHALL display the same flat column set platform applications and the six existing platform-only views
use — Name, Author, Created time, Updated time — for Platform-tab toolset rows, instead of the Public tab's
Name/Version/Author/Updated time set.

#### Scenario: Platform-tab rows show no Version column
- **WHEN** the user opens the Platform tab in the Assets Toolsets listing
- **THEN** the grid shows Name, Author, Created time, and Updated time columns, with no Version column

#### Scenario: Public-tab rows are unaffected
- **WHEN** the user opens the Public tab in the Assets Toolsets listing
- **THEN** the grid keeps its existing Name, Version, Author, and Updated time columns

### Requirement: Creating a platform toolset has no version field
The system SHALL NOT display or require a version field on any create form whose destination is the Platform
source — the header Create on the Platform tab of the Toolsets listing, and the container-seeded create-asset modal
opened from an MCP container detail view with its **Destination** set to Platform — since the platform bucket has
no versioning concept. Creating into Public is unaffected and keeps requiring a version. A create submitted with
Platform as its destination SHALL write the flat, unversioned `platform/{name}` resource through the
platform-bucket create action, and the resulting toolset SHALL open from the post-create navigation and from the
Platform tab without a 404.

#### Scenario: No version field when creating from the Platform tab
- **WHEN** the user opens the create form from the Platform tab of the Toolsets listing
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the Public tree
- **WHEN** the user opens the create form from the Public tab of the Toolsets listing
- **THEN** the version field is shown and required, unchanged from current behavior

#### Scenario: The container-seeded create modal hides the version field for a Platform destination
- **WHEN** the user opens the create-asset-toolset modal from an MCP container detail view and sets Destination to Platform
- **THEN** no folder picker or version field is shown, the form can be submitted without one, and no version suffix is written into the created resource's path

#### Scenario: The container-seeded create modal keeps the version field for a Public destination
- **WHEN** the user opens the create-asset-toolset modal from an MCP container detail view and sets Destination to Public with a folder
- **THEN** the version field is shown and required, and the created resource keeps its `{folderId}{name}__{version}` path, unchanged from current behavior

#### Scenario: A platform-bucket toolset created from a container opens without a 404
- **WHEN** a user creates a toolset from an MCP container detail view with Destination set to Platform
- **THEN** the post-create navigation opens the new toolset's platform-bucket detail view, and clicking the toolset's row on the Platform tab opens the same detail view — neither resolves to a 404 page

#### Scenario: A colon-named platform toolset opens through an encoded detail route
- **WHEN** a user creates a platform-bucket toolset with `:` in its name from either create entry point
- **THEN** the post-create redirect opens its detail view with `:` URL-encoded in the `[id]` segment and no `path` query parameter

## REMOVED Requirements

### Requirement: File root shown above physical buckets in the Assets Toolsets grid
**Reason**: The single file manager no longer shows `file`, `platform` and `public` roots; sources are tabs.
**Migration**: See `tabbed-asset-listings` — Public, Platform and config.json tabs on `/assets-toolsets`.
