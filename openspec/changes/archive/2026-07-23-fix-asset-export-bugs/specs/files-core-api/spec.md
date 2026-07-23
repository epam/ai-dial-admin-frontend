## MODIFIED Requirements

### Requirement: File export builds an archive directly against Core

The system SHALL build a zip archive of selected files/folders by resolving each selection to a flat list of exportable file paths against DIAL Core, fetching each file's content directly (not via the admin BE), and assembling them into an archive whose entry paths match the admin BE's rewriting rules. The system SHALL determine whether a selected path is a folder from that path's current resource type in DIAL Core (its metadata `nodeType`), not from whether the path string itself ends in a trailing `/`, so a folder selection is never misclassified as a single file (or vice versa) and cannot silently resolve to zero exportable entries.

#### Scenario: Selected files are fetched from Core
- **WHEN** `exportFiles` is called with one or more file paths
- **THEN** each file's content is fetched directly from DIAL Core, not through the admin BE

#### Scenario: A folder selection is recognized regardless of its path's trailing-slash shape
- **WHEN** a selected path resolves to a `FOLDER`-typed resource in DIAL Core, whether or not that path string ends in `/`
- **THEN** the selection is expanded into its descendant files rather than being treated as a single file to download

#### Scenario: A file whose name contains a non-Latin1 character is exported successfully
- **WHEN** an exportable file's name contains a character outside the Latin1 range (e.g. `™`, U+2122)
- **THEN** that file is fetched and included in the archive rather than the export hanging indefinitely

## ADDED Requirements

### Requirement: Folder export expands recursively at any depth

The system SHALL include every descendant file of a selected folder in the export, at any nesting depth — not only the folder's direct children.

#### Scenario: Nested subfolder contents are included
- **WHEN** a selected folder contains a nested subfolder with files
- **THEN** those nested files appear in the export archive, re-rooted under the exported folder's structure, preserving their relative path inside that folder

#### Scenario: Multiple nesting levels are all included
- **WHEN** a selected folder contains subfolders nested more than one level deep, each holding files
- **THEN** every file at every depth under the selected folder appears in the export archive

## REMOVED Requirements

### Requirement: Folder export expands one level deep only

**Reason**: Superseded by `Folder export expands recursively at any depth` — the one-level-deep limit was a deliberate like-for-like port of the admin BE's legacy behavior, not a design goal, and was found to actively lose data: a folder containing a nested subfolder with files silently excluded those files from the export with no error or warning.

**Migration**: No migration needed — this only affects folder selections whose contents include nested subfolders, which previously exported incompletely without any signal that content was missing. No wire-format or archive-path-format change; nested files use the same re-rooting rule as direct children (`Archive path differs for single-file vs. folder selection`).
