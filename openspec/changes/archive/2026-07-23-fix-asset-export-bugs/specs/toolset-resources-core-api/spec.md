## MODIFIED Requirements

### Requirement: Toolset export builds a structured aggregate document directly against Core

The system SHALL build a `{ toolSets: AssetToolset[] }` document (the existing `ParsedAssets` shape) from selected toolset paths by fetching each toolset's merged content+metadata directly from DIAL Core and setting each toolset's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type. Exported toolsets SHALL include their `authSettings` exactly as stored, without redacting secrets, matching the admin BE's current export behavior. When a selected path is a folder, the system SHALL first expand it into every descendant toolset resource path at any nesting depth (a recursive walk, not a one-level listing) before fetching merged content+metadata for each; a folder that is empty of toolset resources SHALL contribute no entities without causing the export to fail. The system SHALL exclude `.dial_folder`/`.dial_folder__<version>` technical folder-marker resources encountered during folder expansion, whether they would otherwise be picked up as a folder's direct child or a deeper descendant.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportToolsets` is called with `fileType=json`
- **THEN** the response is the `{ toolSets: AssetToolset[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportToolsets` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `toolSets/toolSets.json`, holding the same `{ toolSets: AssetToolset[] }` document

#### Scenario: Secrets are not redacted from exported auth settings
- **WHEN** a toolset with OAuth `authSettings` (including `clientSecret`) is exported
- **THEN** the exported document includes those fields unredacted, matching the admin BE's current behavior

#### Scenario: Exporting a folder includes every toolset inside it, at any depth
- **WHEN** a selected path is a folder containing toolsets directly and inside nested subfolders
- **THEN** the exported document includes every toolset found at any depth under that folder, not only ones at the folder's top level

#### Scenario: Exporting a folder with no toolsets succeeds with an empty result for that path
- **WHEN** a selected folder path contains no toolset resources at any depth
- **THEN** the export still succeeds, contributing zero entities for that path rather than failing

#### Scenario: A folder-marker resource is excluded from a folder export
- **WHEN** a selected folder contains a `.dial_folder` marker resource among its descendants
- **THEN** the exported document excludes that marker entirely, and the resulting document can be re-imported without a manual edit
