## ADDED Requirements

### Requirement: Config scope selector on import page
The import config page SHALL display a Config Scope radio group (Admin / Deployments) inside the Files step. This selector SHALL be extracted as a shared component reusable by both import and export pages.

#### Scenario: Admin selected (default)
- **WHEN** the user opens the import config page
- **THEN** "Admin" SHALL be selected by default and the existing admin import flow SHALL be displayed unchanged

#### Scenario: Deployments selected
- **WHEN** the user selects "Deployments" config scope
- **THEN** the File Type radio group SHALL be hidden
- **AND** only ZIP archive upload SHALL be available
- **AND** the conflict resolution radio group SHALL show Override and Skip options

### Requirement: Deployment import conflict resolution
The system SHALL support two conflict resolution policies for deployment import: Override (mapped to `OVERWRITE`) and Skip (mapped to `SKIP_IF_EXISTS`). The policy SHALL be sent as the `resolutionPolicy` query parameter on the import API request.

#### Scenario: Override policy selected
- **WHEN** the user selects "Override" conflict resolution and imports a ZIP file
- **THEN** the system SHALL send `POST /api/v1/configs/import?resolutionPolicy=OVERWRITE` with the file as multipart form-data to the deployment manager backend

#### Scenario: Skip policy selected
- **WHEN** the user selects "Skip" conflict resolution and imports a ZIP file
- **THEN** the system SHALL send `POST /api/v1/configs/import?resolutionPolicy=SKIP_IF_EXISTS` with the file as multipart form-data to the deployment manager backend

### Requirement: Deployment import file upload
The deployment import SHALL accept a single ZIP archive file via multipart form-data upload. JSON and separate file imports SHALL NOT be available for deployments.

#### Scenario: ZIP file upload
- **WHEN** the user has "Deployments" config scope selected
- **THEN** the file upload area SHALL accept only `.zip` files with a maximum of 1 file

#### Scenario: File type group hidden
- **WHEN** "Deployments" config scope is selected
- **THEN** the File Type radio group (Archive / JSON / Separate Files) SHALL NOT be displayed

### Requirement: Deployment import preview not available
The Configuration step (step 2) SHALL show a "Preview not available" state for deployment import using `DialNoDataContent` with `IconEyeOff`, matching the pattern used in export for Active Config format.

#### Scenario: Configuration step for deployment import
- **WHEN** the user proceeds to step 2 with "Deployments" config scope
- **THEN** the system SHALL display "Preview not available" with an eye-off icon
- **AND** an Import button SHALL be available to trigger the import

### Requirement: DeploymentConfigApi for import/export
A new `DeploymentConfigApi` class SHALL be created under `server/deployments/` to handle deployment configuration import and export API calls against the deployment manager backend (`DIAL_DEPLOYMENTS_API_URL`).

#### Scenario: Import API call
- **WHEN** the deployment import is triggered
- **THEN** the system SHALL call `POST /api/v1/configs/import` on the deployment manager backend with the ZIP file as multipart form-data and `resolutionPolicy` as a query parameter

#### Scenario: API instance registration
- **WHEN** the application initializes
- **THEN** a `deploymentConfigApi` instance SHALL be registered in `api.ts` using `DIAL_DEPLOYMENTS_API_URL` as the host

### Requirement: Config scope switch resets state
When the user switches config scope (Admin/Deployments), the import page SHALL reset all file upload state and conflict resolution to defaults.

#### Scenario: Switch from Admin to Deployments
- **WHEN** the user switches config scope from Admin to Deployments
- **THEN** all uploaded files SHALL be cleared
- **AND** the conflict resolution policy SHALL reset to its default value

#### Scenario: Switch from Deployments to Admin
- **WHEN** the user switches config scope from Deployments to Admin
- **THEN** all uploaded files SHALL be cleared
- **AND** the conflict resolution policy SHALL reset to its default value

### Requirement: Deployment import notifications
The deployment import SHALL show the same notification pattern as admin config import: a loading notification during import, a success notification on completion, and an error notification on failure.

#### Scenario: Import in progress
- **WHEN** the user triggers deployment import
- **THEN** a loading notification SHALL be displayed with an importing message

#### Scenario: Import success
- **WHEN** the deployment import completes successfully
- **THEN** a success notification SHALL be displayed

#### Scenario: Import failure
- **WHEN** the deployment import fails
- **THEN** an error notification SHALL be displayed with error details

### Requirement: Deployment import resolution policy enum
A `DeploymentImportResolutionPolicy` enum SHALL be defined with values `OVERWRITE` and `SKIP_IF_EXISTS` to match the deployment manager backend API contract.

#### Scenario: Enum values
- **WHEN** the conflict resolution options are rendered for deployment import
- **THEN** Override SHALL map to `OVERWRITE` and Skip SHALL map to `SKIP_IF_EXISTS`
