## MODIFIED Requirements

### Requirement: Application export builds a structured aggregate document directly against Core
The system SHALL build a `{ applications: AssetApp[] }` document (the existing `ParsedAssets` shape) from selected application paths by fetching each application's merged content+metadata directly from DIAL Core and setting each application's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type. When a selected path is a folder, the system SHALL first expand it into every descendant application resource path at any nesting depth (a recursive walk, not a one-level listing) before fetching merged content+metadata for each; a folder that is empty of application resources SHALL contribute no entities without causing the export to fail.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportApps` is called with `fileType=json`
- **THEN** the response is the `{ applications: AssetApp[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportApps` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `applications/applications.json`, holding the same `{ applications: AssetApp[] }` document

#### Scenario: Exporting a folder includes every application inside it, at any depth
- **WHEN** a selected path is a folder containing applications directly and inside nested subfolders
- **THEN** the exported document includes every application found at any depth under that folder, not only ones at the folder's top level

#### Scenario: Exporting a folder with no applications succeeds with an empty result for that path
- **WHEN** a selected folder path contains no application resources at any depth
- **THEN** the export still succeeds, contributing zero entities for that path rather than failing
