## ADDED Requirements

### Requirement: Toolset resources served directly by DIAL Core
The system SHALL route toolset-resource list, get, create, update, delete, bulk-delete, and move operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag for these operations. The cutover SHALL NOT change the `/assets-toolsets` routes, `Toolsets/List`/`Toolsets/View` components, the server-action signatures in `assets-toolsets/actions.ts`, or the `Toolset`/`AssetToolset` models.

#### Scenario: Toolset-resource CRUD and move operations call Core
- **WHEN** any of `getToolsets`, `createToolset`, `getToolset`, `updateToolset`, `removeToolset`, `bulkDeleteToolsets`, `moveToolsets` runs
- **THEN** it calls DIAL Core via the shared asset client, not the admin BE

#### Scenario: Contract unchanged
- **WHEN** the toolsets list page or a single toolset page renders
- **THEN** the data shape passed to `Toolsets/List`/`Toolsets/View` is identical to what the admin-BE path returned previously

### Requirement: Toolset-resource list has no default path or limit
The system SHALL NOT apply a default path or default limit to toolset-resource list reads — the caller's supplied path and limit (or absence thereof) pass through unchanged, matching the BE's `ToolSetResourceService`.

#### Scenario: Listing without an explicit path is not defaulted
- **WHEN** `getToolsets` is called without a path
- **THEN** no default path is substituted, unlike conversation and prompt list reads

### Requirement: Toolset-resource get resolves path via folder listing, then conditional GET
The system SHALL resolve a toolset's storage path by listing its folder and matching on `name` and `version`, then fetch that resolved path via the shared Core asset client's conditional GET.

#### Scenario: Get resolves by name and version
- **WHEN** `getToolset(folderId, name, version, etag)` is called
- **THEN** the folder is listed, the item matching both `name` and `version` is selected, and its resolved path is fetched with the supplied etag

### Requirement: Toolset-resource create rejects on conflict; update requires the current etag
The system SHALL create a toolset-resource with `If-None-Match: *` (rejecting if a resource already exists at that path) and SHALL update with `If-Match` set to the caller's etag.

#### Scenario: Create conflicts with an existing toolset
- **WHEN** `createToolset` targets a path that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateToolset(toolset, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

### Requirement: Toolset-resource delete and move preserve existing conditional/duplicate semantics
The system SHALL send `If-Match` for single toolset delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item; move SHALL preserve the existing duplicate-with-renamed-version behavior when a duplicate name is supplied.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removeToolset(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name renames the version suffix
- **WHEN** `moveToolsets` is called with a `duplicateName`
- **THEN** the destination path carries the duplicate name with the source's version suffix reapplied, unchanged from current behavior
