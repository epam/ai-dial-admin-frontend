## MODIFIED Requirements

### Requirement: Import test cases from CSV
The system SHALL allow users to import test cases from a CSV file via an Import button in the Test Cases tab header. The import flow SHALL include a preview step before committing. When the dataset schema contains a `FILE`-type field, the export produced by this system is a ZIP archive rather than a plain CSV (see the Export requirement); the import file picker SHALL accept both CSV and ZIP files, so a file exported by this system can always be selected for re-import regardless of the OS-level file picker's extension filtering.

The preview step SHALL render the case-level warnings returned by the preview response, in addition to the per-row validity indicator. Each warning SHALL identify the column and row it concerns.

#### Scenario: Import preview step
- **WHEN** user selects a CSV file for import
- **THEN** `POST /api/v1/datasets/{datasetId}/test-cases/import/preview` is called and the user sees a preview of rows to be imported with any validation warnings

#### Scenario: Preview warnings are shown
- **WHEN** the preview response contains case-level warnings
- **THEN** each warning is displayed above the preview grid with its column name and row number

#### Scenario: No warnings renders nothing
- **WHEN** the preview response contains no warnings
- **THEN** no warnings area is rendered and the preview grid is unchanged

#### Scenario: Confirming import
- **WHEN** user confirms the import after reviewing the preview
- **THEN** `POST /api/v1/datasets/{datasetId}/test-cases/import` is called, success toast shown with import count, and the grid refreshes with imported rows

#### Scenario: Import with schema change triggers revalidation
- **WHEN** the import causes a schema change and the backend returns 202
- **THEN** the user sees a toast that test cases are being revalidated and the grid is refreshed

#### Scenario: Import conflict handling
- **WHEN** imported CSV contains a test case name that already exists
- **THEN** the preview step shows the conflict and the user can choose to proceed (OVERRIDE strategy) or cancel

#### Scenario: Selecting a ZIP export for re-import
- **WHEN** the user opens the file picker (initial browse, or "Change" after a file is already selected) to import test cases
- **THEN** both CSV and ZIP files are selectable, so a previously exported `.zip` (from a dataset with `FILE`-type fields) is not filtered out by the OS file picker
