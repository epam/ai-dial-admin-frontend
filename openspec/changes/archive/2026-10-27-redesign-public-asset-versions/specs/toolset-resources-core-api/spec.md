## MODIFIED Requirements

### Requirement: Toolset-resource get resolves path via folder listing, then conditional GET

The system SHALL fetch a toolset's supplied complete storage path directly through the shared Core asset client's conditional content/metadata read. Opening an existing toolset SHALL NOT require a folder listing to choose a matching sibling name/version or populate a version selector. The supplied etag and existing merged resource shape SHALL be retained.

#### Scenario: Get resolves by name and version
- **WHEN** `getToolset(path, etag)` is called with the complete path containing the resource's name and version
- **THEN** that supplied path is fetched directly with the supplied etag, without listing the folder to choose a sibling

#### Scenario: Get uses the supplied complete path
- **WHEN** `getToolset(path, etag)` is called for `public/team/assistant__release candidate`
- **THEN** that complete path is fetched with the supplied etag and no folder listing is performed to resolve a sibling version

### Requirement: Toolset-resource create rejects on conflict; update requires the current etag

The system SHALL create a toolset-resource with `If-None-Match: *` (rejecting if a resource already exists at that complete path) and SHALL update with `If-Match` set to the caller's etag. Public creation SHALL accept text versions according to `public-asset-versions`, check folder/name/version uniqueness rather than name alone, and synchronize content `display_version` to the create version. Ordinary existing-resource updates SHALL preserve the supplied independent `display_version` and original path version instead of resynchronizing or creating a sibling version. Public payloads SHALL use the Core-native `display_version` field and strip frontend identity metadata before PUT; toolset authentication transformations and existing platform identity semantics SHALL remain unchanged.

#### Scenario: Create conflicts with an existing toolset
- **WHEN** `createToolset` targets a path that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateToolset(toolset, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

#### Scenario: Same-name text versions can be created independently
- **WHEN** `assistant__stable` exists and public creation targets `assistant__release candidate`
- **THEN** the new path is permitted and content `display_version` is synchronized to `release candidate`

#### Scenario: Ordinary update preserves independent display version
- **WHEN** a toolset at `assistant__stable` is saved with `display_version` of `Spring release` or an empty string
- **THEN** the PUT keeps that content value and addresses the original `assistant__stable` path without creating another version

### Requirement: Toolset-resource delete and move preserve existing conditional/duplicate semantics

The system SHALL send `If-Match` for single toolset delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item. Single-resource moves/deletes initiated from lists or details SHALL use exactly the selected/opened resource path, without collecting sibling versions by name. Move SHALL preserve the source version suffix when a duplicate base name is supplied, using consolidated final-leaf parsing and appending the suffix exactly once. Existing Core toolset reference and credential transformations SHALL remain intact.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removeToolset(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name renames the version suffix
- **WHEN** `moveToolsets` is called with a duplicate base name for a source toolset
- **THEN** the destination path carries that duplicate name with the source's text version suffix reapplied exactly once

#### Scenario: A detail move targets only the opened toolset
- **WHEN** an administrator changes folder placement for `public/a/assistant__stable` and another version of `assistant` exists in the same folder
- **THEN** only `public/a/assistant__stable` is moved to the new folder and the sibling remains unchanged

## ADDED Requirements

### Requirement: Toolset import and export preserve independent resource versions

Toolset JSON/zip export and import SHALL retain existing aggregate keys, Core-prefixed ids, archive entry names, auth-settings content behavior, recursive folder handling, marker exclusion, and conflict strategies. Selected resources SHALL be matched by complete path rather than expanded/merged by name. Import SHALL preserve the incoming path version when resolving a new name/folder and preserve content `display_version` independently, without resetting it to the path suffix.

#### Scenario: Only the selected toolset is exported
- **WHEN** `assistant__stable` and `assistant__preview` exist but only the first is selected for export
- **THEN** the aggregate document includes only `assistant__stable` with its original content display version

#### Scenario: Different display and path versions round-trip
- **WHEN** a toolset with id ending in `assistant__stable` and `display_version` of `Spring release` is exported and imported into another folder
- **THEN** its destination retains suffix `__stable` and content retains `Spring release`

#### Scenario: Older valid exports remain importable
- **WHEN** a previous toolset export contains a semver id suffix and legacy frontend identity fields
- **THEN** import retains the suffix, strips frontend-only identity before Core PUT, and preserves the original content display version
