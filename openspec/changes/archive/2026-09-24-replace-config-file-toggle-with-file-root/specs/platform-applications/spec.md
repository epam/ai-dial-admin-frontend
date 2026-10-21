## MODIFIED Requirements

### Requirement: File root shown above physical buckets in the Assets Applications grid
The system SHALL display synthetic `file`, `platform`, and `public` roots in the existing `Assets ▸ Applications` grid when Catalog is enabled, using the same `BaseAssetList` instance. The order SHALL be `file`, `platform`, then `public`. When Catalog is disabled, the system SHALL omit `platform` and its resource requests but SHALL retain `file` and `public` roots. No new menu entry or top-level list route SHALL be introduced.

#### Scenario: All roots appear when Catalog is enabled
- **WHEN** a user opens `/assets-applications` with Catalog enabled
- **THEN** the grid shows `file`, `platform`, and `public` roots in that order

#### Scenario: File root remains when Catalog is disabled
- **WHEN** a user opens `/assets-applications` with Catalog disabled
- **THEN** the grid shows `file` and `public`, does not show `platform`, and makes no platform resource request

### Requirement: File-root applications are flat and read-only
The system SHALL treat Applications under the synthetic `file` root as name-only, flat, and read-only. It SHALL lazily read their names from DIAL Core's config-file `applications` endpoint when the root is opened. It SHALL offer no create, import, export, delete, bulk delete, duplicate, rename, move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: File-root application names load on access
- **WHEN** a user opens the Applications `file` root
- **THEN** the system requests config-file application names and renders them without resource metadata or per-name body reads

#### Scenario: File-root application actions are immutable
- **WHEN** a user browses the Applications `file` root
- **THEN** only open and open-in-new-tab are available for an application row

### Requirement: File-root application detail view
The system SHALL open a file-root application at `/assets-applications/{id}?configFile=true`, without a public-bucket `path` parameter. It SHALL preserve the existing config-file detail read and read-only presentation, including hidden ADMIN|CORE format selection.

#### Scenario: File-root application opens without public path
- **WHEN** a user opens an application row from the `file` root
- **THEN** the system navigates to `/assets-applications/{id}?configFile=true` and renders it read-only
