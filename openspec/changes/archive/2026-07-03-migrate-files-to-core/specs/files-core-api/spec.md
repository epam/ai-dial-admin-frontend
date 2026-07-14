## ADDED Requirements

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
- **THEN** each path/etag pair is deleted individually with `If-Match` set to that item's etag, and any item missing an etag is rejected before it reaches Core

### Requirement: File import preserves the consecutive-failure circuit breaker
The system SHALL abort a multi-file plain import batch after a configured number of consecutive per-file failures, matching the admin BE's `SimpleCircuitBreaker` behavior, rather than continuing to attempt every remaining file.

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
