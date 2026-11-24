# Asset Import Limits

## Purpose

Define size limits and user feedback for the existing prompt, application and toolset asset import workflows.

## ADDED Requirements

### Requirement: Asset archive size limit
The Prompts, Assets Applications and Assets Toolsets import workflows SHALL accept one ZIP archive whose uploaded size is at most 64 MiB (64 × 1,048,576 bytes). A larger archive SHALL be rejected with a size error before import starts. Existing ZIP extraction safety checks SHALL remain in force.

#### Scenario: Archive exactly at the limit
- **WHEN** a valid 64 MiB archive is selected for an asset import
- **THEN** its size does not prevent the user from starting the import

#### Scenario: Archive exceeds the limit
- **WHEN** an archive larger than 64 MiB is selected or preselected for an asset import
- **THEN** the import cannot start and the user is shown an archive-size error

### Requirement: Asset JSON batch size and count
The same asset import workflows SHALL accept up to 30 JSON files whose combined uploaded sizes are at most 64 MiB. A single file MAY use the entire allowance. An oversized file or batch, or a selection of more than 30 files, SHALL prevent import and show the matching validation error.

#### Scenario: One large file is within the limit
- **WHEN** a valid JSON file of 64 MiB is selected for an asset import
- **THEN** the source-file size check does not reject the selection

#### Scenario: A batch is within the limit
- **WHEN** up to 30 valid JSON files totaling exactly 64 MiB are selected
- **THEN** the source-file size and count checks do not reject the selection

#### Scenario: Total exceeds the limit
- **WHEN** selected or preselected JSON files total more than 64 MiB
- **THEN** the import cannot start and the user is shown a total-size error

#### Scenario: Too many files
- **WHEN** more than 30 JSON files are selected or preselected
- **THEN** the import cannot start with that selection and the user is shown a count error

### Requirement: Import size descriptions
The asset import file-type radio descriptions SHALL state that an archive is limited to 64 MB and that up to 30 JSON files can be imported with a 64 MB per-file maximum and a 64 MB total maximum. Size validation errors SHALL use the corresponding limit.

#### Scenario: Asset import options explain limits
- **WHEN** a user opens an affected asset import modal
- **THEN** the archive and JSON option descriptions show the applicable 64 MB limits and the JSON option shows the 30-file limit

### Requirement: Prepared JSON size
The prepared JSON document after merging and editing SHALL NOT exceed 64 MiB. If it does, the application SHALL prevent submission and show a clear error; it SHALL NOT silently truncate content. This check is separate from the source-file size check.

#### Scenario: Edits make prepared JSON too large
- **WHEN** an otherwise acceptable selection produces prepared JSON larger than 64 MiB
- **THEN** import does not start and the user is told the prepared JSON exceeds the 64 MB limit

### Requirement: Allowed imports reach the existing importer
An archive or prepared JSON document of at most 64 MiB SHALL NOT be rejected solely because request framing makes the request body exceed 64 MiB. Existing success, skipped, failure and in-progress notifications SHALL continue to report the import outcome.

#### Scenario: Boundary-size import is submitted
- **WHEN** a valid archive or prepared JSON document of 64 MiB is submitted
- **THEN** application request handling passes it to the existing asset importer rather than rejecting it solely for request-body overhead

### Requirement: Other import limits remain unchanged
The Files route SHALL retain its existing 100 MiB archive and total separate-files limits. Other import routes SHALL retain their existing limits, and this change SHALL NOT add import entry points to Skills or Conversations.

#### Scenario: Files import is unaffected
- **WHEN** a user opens the Files import modal
- **THEN** its archive and total separate-files limits remain 100 MiB
