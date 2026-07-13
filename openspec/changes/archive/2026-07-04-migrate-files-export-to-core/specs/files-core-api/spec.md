## ADDED Requirements

### Requirement: File export builds an archive directly against Core
The system SHALL build a zip archive of selected files/folders by resolving each selection to a flat list of exportable file paths against DIAL Core, fetching each file's content directly (not via the admin BE), and assembling them into an archive whose entry paths match the admin BE's rewriting rules.

#### Scenario: Selected files are fetched from Core
- **WHEN** `exportFiles` is called with one or more file paths
- **THEN** each file's content is fetched directly from DIAL Core, not through the admin BE

### Requirement: Archive path differs for single-file vs. folder selection
The system SHALL place a single selected file at `files/public/<filename>` in the archive, and SHALL re-root a selected folder's contents under `files/public/<lastFolderSegment>/<path-relative-to-that-folder>`, preserving the folder's internal structure.

#### Scenario: Single file exported flat
- **WHEN** a single file (not a folder) is selected for export
- **THEN** its archive entry is `files/public/<filename>`

#### Scenario: Folder exported with re-rooted structure
- **WHEN** a folder is selected for export
- **THEN** each of its child files' archive entries are re-rooted under `files/public/<lastFolderSegment>/`, preserving their relative path inside that folder

### Requirement: Folder export expands one level deep only
The system SHALL include only a selected folder's direct child files in the export, not files in nested subfolders — matching the admin BE's existing behavior exactly, not a design goal of this change.

#### Scenario: Nested subfolder contents are excluded
- **WHEN** a selected folder contains a nested subfolder with files
- **THEN** those nested files do not appear in the export archive

### Requirement: Technical folder-marker resources are excluded from export
The system SHALL exclude `.dial_folder` and `.dial_folder__<version>` resources from any export, whether they are selected directly or picked up via folder expansion.

#### Scenario: A directly-selected marker file is excluded
- **WHEN** a `.dial_folder` resource is among the selected paths
- **THEN** it does not appear in the export archive

#### Scenario: A marker file inside an exported folder is excluded
- **WHEN** a selected folder contains a `.dial_folder` marker among its direct children
- **THEN** that marker is excluded from the export while its sibling files are included

### Requirement: Duplicate archive-path collisions are rejected
The system SHALL reject an export request if two resolved entries would collide at the same archive path, rather than silently letting one overwrite the other.

#### Scenario: Two selections resolve to the same archive path
- **WHEN** the resolved export entries contain a duplicate storage path
- **THEN** the export is rejected with an error instead of producing a partial or silently-collided archive
