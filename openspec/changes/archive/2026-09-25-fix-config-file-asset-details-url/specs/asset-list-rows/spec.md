## MODIFIED Requirements

### Requirement: Row action handling resolves the bucket explicitly
Move, delete, update, and open-in-new-tab handling SHALL resolve a row's bucket from the row's explicit `bucket` field, and SHALL resolve the browsed surface from the existing view-level helpers (`isFlatPlatformView`, `isPlatformDualBucketView`) when the view and current path are in scope — never by inferring either from a `folderId` value. When a config-file-sourced asset row opens a detail URL that already contains query parameters, navigation SHALL append `configFile=true` as a separate query parameter without changing the resource `path` value.

#### Scenario: Delete shaping reads the bucket
- **WHEN** a delete confirmation grid or success toast is shaped for a row
- **THEN** platform-bucket rows get the flat name-only treatment because their `bucket` is `'platform'`, and public rows get the versioned treatment, with no `folderId` inspection

#### Scenario: Open-in-new-tab resolves the route segment from the row flavor
- **WHEN** a row is opened in a new tab
- **THEN** a platform row resolves to the flat name-only detail segment and a movable row to the `?path=`-carrying URL, selected by the row's flavor/bucket rather than by prefix-sniffing `folderId`

#### Scenario: Config-file public asset details preserve path query
- **WHEN** a config-file-sourced versioned public application or toolset row opens details and its detail URL contains `?path=`
- **THEN** the URL retains the original `path` value and appends `&configFile=true` as a separate query parameter

#### Scenario: Config-file asset action menu opens the corrected URL
- **WHEN** a config-file-sourced versioned public application or toolset row is opened through the action-menu new-tab control
- **THEN** the new tab opens a URL whose `path` and `configFile=true` values are separate query parameters

#### Scenario: Detail-page bucket detection stays one stated contract
- **WHEN** an asset application or toolset detail page decides which bucket it is rendering
- **THEN** it applies the existing URL contract (presence of `?path=` means public) through a single named helper, not an inverted raw-path check duplicated per page
