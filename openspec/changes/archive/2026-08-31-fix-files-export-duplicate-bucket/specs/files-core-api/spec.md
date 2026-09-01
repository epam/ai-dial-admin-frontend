## MODIFIED Requirements

### Requirement: Archive path differs for single-file vs. folder selection
The system SHALL place a single selected file at `files/<filename>` in the archive (no bucket
prefix), and SHALL re-root a selected folder's contents under
`files/<lastFolderSegment>/<path-relative-to-that-folder>`, preserving the folder's internal
structure. The archive path SHALL be bucket-agnostic — the destination folder chosen at import time
determines the final storage location.

#### Scenario: Single file exported flat
- **WHEN** a single file (not a folder) is selected for export
- **THEN** its archive entry is `files/<filename>` with no bucket prefix

#### Scenario: Folder exported with re-rooted structure
- **WHEN** a folder is selected for export
- **THEN** each of its child files' archive entries are re-rooted under `files/<lastFolderSegment>/`,
  preserving their relative path inside that folder, with no bucket prefix in the archive path
