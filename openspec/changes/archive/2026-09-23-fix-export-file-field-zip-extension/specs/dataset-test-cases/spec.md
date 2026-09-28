## MODIFIED Requirements

### Requirement: Export test cases to CSV
The system SHALL allow users to export dataset test cases as CSV via an Export button in the Test Cases tab header. The export calls `GET /api/v1/datasets/{datasetId}/test-cases/export.csv`. When the dataset schema contains a `FILE`-type field with at least one attached file, the backend bundles the CSV together with the attached files into a ZIP archive; the system SHALL name and type the downloaded file according to the backend's actual `Content-Disposition`/`Content-Type` response headers rather than assuming a `.csv` extension, so the downloaded file is always importable back without corruption.

#### Scenario: Exporting test cases
- **WHEN** user clicks the Export button
- **THEN** a CSV file download is triggered containing all test cases with columns matching the dataset schema

#### Scenario: Exporting test cases with a FILE-type field
- **WHEN** user clicks the Export button on a dataset whose schema contains a `FILE`-type field with at least one attached file
- **THEN** the backend returns a ZIP archive and the downloaded file is saved with a `.zip` extension and archive content type, matching the backend's `Content-Disposition` header, so it can be re-imported without error
