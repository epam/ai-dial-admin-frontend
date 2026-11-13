## MODIFIED Requirements

### Requirement: File-root applications are flat and read-only
The system SHALL treat Applications on the config.json tab as name-only, flat, and read-only. It SHALL load their names from DIAL Core's config-file `applications` endpoint when the listing mounts. It SHALL offer no create, import, export, delete, bulk delete, duplicate, rename, move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: config.json application names load with the listing
- **WHEN** a user opens the Applications listing
- **THEN** the system requests config-file application names once and renders them on the config.json tab without resource metadata or per-name body reads

#### Scenario: config.json application actions are immutable
- **WHEN** a user browses the Applications config.json tab
- **THEN** only open and open-in-new-tab are available for an application row

### Requirement: File-root application detail view
The system SHALL open a config.json application at `/assets-applications/{id}?configFile=true`, without a public-bucket `path` parameter. It SHALL preserve the existing config-file detail read and read-only presentation, including hidden ADMIN|CORE format selection.

#### Scenario: config.json application opens without public path
- **WHEN** a user opens an application row from the config.json tab
- **THEN** the system navigates to `/assets-applications/{id}?configFile=true` and renders it read-only

#### Scenario: No separate platform applications list page exists
- **WHEN** the user looks for a platform applications entry in the sidebar navigation
- **THEN** no such entry exists — platform applications are reachable only through the existing
  `/assets-applications` listing

### Requirement: Platform bucket applications are flat
The system SHALL NOT offer folder creation, nested navigation, or versioning for applications on the Platform tab,
matching the flat treatment already given to the six existing platform-only entities (models, app runners,
interceptors, routes, roles, keys).

#### Scenario: No folder actions on the Platform tab
- **WHEN** the user opens the Platform tab or the action menu of any application on it
- **THEN** no folder-create, move, or nested-navigation actions are offered

#### Scenario: No versioning on a platform application
- **WHEN** the user opens a platform-bucket application's detail view
- **THEN** no version history, publish, or version-switcher UI is shown

### Requirement: Platform bucket application rows use the restricted action set
The system SHALL restrict row and multi-select actions on Platform-tab application rows to duplicate, delete, and
open-in-new-tab — the same set already used by the six existing flat platform views — while the Public tab keeps
the file manager's current, unrestricted action set.

#### Scenario: Platform row actions are restricted
- **WHEN** the user opens the row action menu for an application on the Platform tab
- **THEN** only duplicate, delete, and open-in-new-tab are offered

#### Scenario: Public row actions are unchanged
- **WHEN** the user opens the row action menu for an application on the Public tab
- **THEN** the full existing action set is offered, unchanged from current behavior

#### Scenario: Header Create offers a single Application entry on the Platform tab
- **WHEN** the user activates the header Create button while the Platform tab is active
- **THEN** the create-application modal opens for a platform application, with no folder-create or import entries

### Requirement: Platform bucket application rows use the same column set as other platform entities
The system SHALL display the same flat column set the six existing platform-only views use — Name, Author, Created
time, Updated time — for Platform-tab application rows, instead of the Public tab's Name/Version/Author/Updated
time set.

#### Scenario: Platform-tab rows show no Version column
- **WHEN** the user opens the Platform tab in the Assets Applications listing
- **THEN** the grid shows Name, Author, Created time, and Updated time columns, with no Version column

#### Scenario: Public-tab rows are unaffected
- **WHEN** the user opens the Public tab in the Assets Applications listing
- **THEN** the grid keeps its existing Name, Version, Author, and Updated time columns

### Requirement: Creating a platform application has no version field
The system SHALL NOT display or require a version field on any create form whose destination is the Platform
source — the header Create on the Platform tab, and the runner-seeded create modal opened from an app-runner detail
view with its **Destination** set to Platform — since the platform bucket has no versioning concept. Creating into
Public is unaffected and keeps requiring a version. A create submitted with Platform as its destination SHALL
write the flat, unversioned `platform/{name}` resource through the platform-bucket create action, and the resulting
application SHALL open from the post-create navigation and from the Platform tab without a 404.

#### Scenario: No version field when creating from the Platform tab
- **WHEN** the user opens the create form from the Platform tab
- **THEN** no version field is shown, and the form can be submitted without one

#### Scenario: Version field unchanged when creating into the Public tree
- **WHEN** the user opens the create form from the Public tab
- **THEN** the version field is shown and required, unchanged from current behavior

#### Scenario: The runner-seeded create modal hides the version field for a Platform destination
- **WHEN** the user opens the create-assets-application modal from an app-runner detail view and sets Destination to Platform
- **THEN** no folder picker or version field is shown, the form can be submitted without one, and no version suffix is written into the created resource's path

#### Scenario: The runner-seeded create modal keeps the version field for a Public destination
- **WHEN** the user opens the create-assets-application modal from an app-runner detail view and sets Destination to Public with a folder
- **THEN** the version field is shown and required, and the created resource keeps its `{folderId}{name}__{version}` path, unchanged from current behavior

#### Scenario: A platform-bucket application created from a runner opens without a 404
- **WHEN** a user creates an application from an app-runner detail view with Destination set to Platform
- **THEN** the post-create navigation opens the new application's platform-bucket detail view, and clicking the application's row on the Platform tab opens the same detail view — neither resolves to a 404 page

#### Scenario: A colon-named platform application opens through an encoded detail route
- **WHEN** a user creates a platform-bucket application with `:` in its name from either create entry point
- **THEN** the post-create redirect opens its detail view with `:` URL-encoded in the `[id]` segment and no `path` query parameter

## REMOVED Requirements

### Requirement: File root shown above physical buckets in the Assets Applications grid
**Reason**: The single file manager no longer shows `file`, `platform` and `public` roots; sources are tabs.
**Migration**: See `tabbed-asset-listings` — Public, Platform and config.json tabs on `/assets-applications`.
