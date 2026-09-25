## MODIFIED Requirements

### Requirement: File root shown above physical buckets in the Assets Toolsets grid
The system SHALL display synthetic `file`, `platform`, and `public` roots in the existing `Assets ▸ Toolsets` grid when Catalog is enabled, using the same `BaseAssetList` instance. The order SHALL be `file`, `platform`, then `public`. When Catalog is disabled, the system SHALL omit `platform` and its resource requests but SHALL retain `file` and `public` roots. No new menu entry or top-level list route SHALL be introduced.

#### Scenario: All roots appear when Catalog is enabled
- **WHEN** a user opens `/assets-toolsets` with Catalog enabled
- **THEN** the grid shows `file`, `platform`, and `public` roots in that order

#### Scenario: File root remains when Catalog is disabled
- **WHEN** a user opens `/assets-toolsets` with Catalog disabled
- **THEN** the grid shows `file` and `public`, does not show `platform`, and makes no platform resource request

### Requirement: File-root toolsets are flat and read-only
The system SHALL treat Toolsets under the synthetic `file` root as name-only, flat, and read-only. It SHALL lazily read their names from DIAL Core's config-file `toolsets` endpoint when the root is opened. It SHALL offer no create, import, export, delete, bulk delete, duplicate, rename, move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: File-root toolset names load on access
- **WHEN** a user opens the Toolsets `file` root
- **THEN** the system requests config-file toolset names and renders them without resource metadata or per-name body reads

#### Scenario: File-root toolset actions are immutable
- **WHEN** a user browses the Toolsets `file` root
- **THEN** only open and open-in-new-tab are available for a toolset row

### Requirement: File-root toolset detail view
The system SHALL open a file-root toolset at `/assets-toolsets/{id}?configFile=true`, without a public-bucket `path` parameter. It SHALL preserve the existing config-file detail read and read-only presentation, including hidden ADMIN|CORE format selection.

#### Scenario: File-root toolset opens without public path
- **WHEN** a user opens a toolset row from the `file` root
- **THEN** the system navigates to `/assets-toolsets/{id}?configFile=true` and renders it read-only
