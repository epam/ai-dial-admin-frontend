## MODIFIED Requirements

### Requirement: Application-resource create rejects on conflict; update requires the current etag

The system SHALL create an application-resource with `If-None-Match: *` (rejecting if a resource already exists at that complete path) and SHALL update with `If-Match` set to the caller's etag. Public creation SHALL accept text versions according to `public-asset-versions`, check folder/name/version uniqueness rather than name alone, and synchronize content `display_version` to the create version. Ordinary existing-resource updates SHALL preserve the supplied independent `display_version` and original path version instead of resynchronizing or creating a sibling version. Public payloads SHALL use the Core-native `display_version` field and strip frontend identity metadata before PUT; existing platform identity semantics SHALL remain unchanged.

#### Scenario: Create conflicts with an existing application resource
- **WHEN** `createApp` targets a path that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateApp(app, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

#### Scenario: Same-name text versions can be created independently
- **WHEN** `assistant__stable` exists and public creation targets `assistant__release candidate`
- **THEN** the new path is permitted and content `display_version` is synchronized to `release candidate`

#### Scenario: Ordinary update preserves independent display version
- **WHEN** an application at `assistant__stable` is saved with `display_version` of `Spring release` or an empty string
- **THEN** the PUT keeps that content value and addresses the original `assistant__stable` path without creating another version

### Requirement: Application-resource delete and move preserve existing conditional/duplicate semantics

The system SHALL send `If-Match` for single application-resource delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item. Single-resource moves/deletes initiated from lists or details SHALL use exactly the selected/opened resource path, without collecting sibling versions by name. Move SHALL preserve the source version suffix when a duplicate base name is supplied, using the consolidated final-leaf parsing and appending the suffix exactly once.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removeApp(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name renames the version suffix
- **WHEN** `moveApps` is called with a duplicate base name for a source application
- **THEN** the destination path carries that duplicate name with the source's text version suffix reapplied exactly once

#### Scenario: A detail move targets only the opened application
- **WHEN** an administrator changes folder placement for `public/a/assistant__stable` and another version of `assistant` exists in the same folder
- **THEN** only `public/a/assistant__stable` is moved to the new folder and the sibling remains unchanged

## ADDED Requirements

### Requirement: Application import and export preserve independent resource versions

Application JSON/zip export and import SHALL retain existing aggregate keys, Core-prefixed ids, archive entry names, recursive folder handling, marker exclusion, and conflict strategies. Selected resources SHALL be matched by complete path rather than expanded/merged by name. Import SHALL preserve the incoming path version when resolving a new name/folder and preserve content `display_version` independently, without resetting it to the path suffix.

#### Scenario: Only the selected application is exported
- **WHEN** `assistant__stable` and `assistant__preview` exist but only the first is selected for export
- **THEN** the aggregate document includes only `assistant__stable` with its original content display version

#### Scenario: Different display and path versions round-trip
- **WHEN** an application with id ending in `assistant__stable` and `display_version` of `Spring release` is exported and imported into another folder
- **THEN** its destination retains suffix `__stable` and content retains `Spring release`

#### Scenario: Older valid exports remain importable
- **WHEN** a previous application export contains a semver id suffix and legacy frontend identity fields
- **THEN** import retains the suffix, strips frontend-only identity before Core PUT, and preserves the original content display version
