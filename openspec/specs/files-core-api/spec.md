# files-core-api Specification

## Purpose
File list, delete, bulk-delete, move, download, preview, import (plain + zip, with circuit-breaker and path-traversal protections preserved), and export executed directly against DIAL Core via the shared `core-asset-client`, replacing the admin-BE proxy — created by archiving change `migrate-files-to-core` and completed by archiving change `migrate-files-export-to-core`. The FE-facing `DialFile` contract (plus a new `etag` field), routes, and server-action signatures otherwise stay identical, except where etag becomes a required parameter (a deliberate bugfix — see the delete requirement). Files have zero remaining admin-BE dependency.

## Requirements

### Requirement: Files served directly by DIAL Core
The system SHALL route file list, delete, bulk-delete, move, download, and preview operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag for these operations. The cutover SHALL NOT change the `/files` route, `Files/List.tsx`'s rendering/columns beyond adding the etag field below, or the server-action/route signatures except where etag becomes required (see the delete requirement).

#### Scenario: File operations call Core
- **WHEN** any of `getFiles`, `bulkDeleteFiles`, `removeFile`, `moveFiles`, file download, or file preview runs
- **THEN** it calls DIAL Core via the shared asset client, not the admin BE

#### Scenario: List has no default path or limit
- **WHEN** `getFiles` is called without a path
- **THEN** no default path is substituted, matching the BE's pure-passthrough file metadata behavior

### Requirement: File delete requires a real etag
The system SHALL require a concrete etag to delete a file, sourced from the file's Core metadata, and SHALL always send it as `If-Match`. This corrects the admin BE's behavior of silently ignoring the etag on file delete.

#### Scenario: Listed files carry an etag
- **WHEN** `getFiles` returns file items
- **THEN** each item includes the `etag` from its Core metadata

#### Scenario: Single delete without a usable etag is rejected
- **WHEN** `removeFile` is called without a concrete etag
- **THEN** the call is rejected before any request reaches Core

#### Scenario: Single delete sends If-Match
- **WHEN** `removeFile` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Bulk delete requires an etag per item
- **WHEN** `bulkDeleteFiles` is called
- **THEN** each path/etag pair is deleted individually with `If-Match` set to that item's etag, and the whole batch is rejected before any item reaches Core if any item is missing an etag

### Requirement: File import preserves the consecutive-failure circuit breaker
The system SHALL abort a multi-file plain import batch after a configured number of consecutive per-file failures, matching the admin BE's `SimpleCircuitBreaker` behavior, rather than continuing to attempt every remaining file. A precondition-failed ("already exists") response is classified as skipped, not a failure, and does not count toward the consecutive-failure threshold.

#### Scenario: Consecutive failures abort the batch
- **WHEN** a plain multi-file import hits the configured number of consecutive per-file failures
- **THEN** the remaining files in the batch are not attempted, and the response reflects the partial result

#### Scenario: A success resets the consecutive-failure count
- **WHEN** a file succeeds after one or more prior failures in the same batch
- **THEN** the consecutive-failure count resets and subsequent failures are counted fresh

### Requirement: Zip import rejects path-traversal entries
The system SHALL reject zip entries that contain `..` segments, absolute paths, null bytes, or that normalize outside the `files/` prefix, and SHALL reject the whole archive if it contains no valid entries after filtering.

#### Scenario: Parent-directory traversal entry is rejected
- **WHEN** a zip archive contains an entry path with a `..` segment
- **THEN** that entry is rejected and not written to any file location

#### Scenario: Absolute-path entry is rejected
- **WHEN** a zip archive contains an entry with an absolute path
- **THEN** that entry is rejected

#### Scenario: Archive with no valid entries is rejected outright
- **WHEN** every entry in a zip archive fails validation
- **THEN** the import is rejected with an invalid-archive error rather than silently succeeding with zero files

### Requirement: Zip import infers content type from filename
The system SHALL assign a content type to each unpacked zip entry based on its filename extension, falling back to a generic binary content type when the extension is unrecognized, matching the admin BE's behavior.

#### Scenario: Known extension gets a specific content type
- **WHEN** a zip entry has a recognized file extension
- **THEN** the created file's content type matches that extension

#### Scenario: Unknown extension falls back to generic binary
- **WHEN** a zip entry has an unrecognized or missing extension
- **THEN** the created file's content type is a generic binary content type

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
