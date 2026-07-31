## ADDED Requirements

### Requirement: Files-view folder creation uploads directly via Core
The system SHALL create a folder in the Files view by uploading an empty marker file to the target
path directly via the Core files client, with no admin-BE involvement. `previewAppZip` and
`previewToolsetZip` — the two other admin-BE-backed folder-storage actions with no remaining callers —
SHALL be removed rather than migrated, since there is no live behavior to preserve for either.

#### Scenario: Creating a folder in the Files view calls Core directly
- **WHEN** `createFolderWithFiles` is called for the Files view
- **THEN** an empty file is uploaded to the target folder path directly via the Core files client, not the admin BE

#### Scenario: The unused zip-preview actions are gone, not routed to Core
- **WHEN** the codebase is searched for `previewAppZip` or `previewToolsetZip` callers after this change
- **THEN** neither action exists — they were deleted as dead code, not given a Core-backed implementation
