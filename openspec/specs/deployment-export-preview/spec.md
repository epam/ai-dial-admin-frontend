# deployment-export-preview Specification

## Purpose

Enables the export preview modal to show deployment entities before exporting, replacing the current "Preview currently unavailable" placeholder. Uses the same `PreviewModal` component with deployment-specific API call, tab grouping, and grid columns.

## Requirements

### Requirement: Export preview shows deployment entities in tabbed grid

When the export scope is Deployments, the `PreviewModal` SHALL call `POST /configs/export/preview` and display the response in a tabbed grid grouped by entity type.

#### Scenario: Preview loads deployment entities
- **WHEN** user clicks export with deployment scope selected
- **THEN** the system SHALL call `previewDeploymentExportConfig` with the request built by `buildDeploymentExportPreviewRequest`
- **AND** display a `DialLoader` while the request is in-flight
- **AND** render a tabbed grid on success

#### Scenario: Tabs grouped by entity type with counts
- **WHEN** the preview response is received
- **THEN** tabs SHALL be generated using `DEPLOYMENT_ENTITY_TABS` for each entity type that has entities
- **AND** each tab label SHALL include the entity count (e.g., "Images: 22", "MCP Containers: 5")
- **AND** the first tab with data SHALL be selected by default
- **AND** BE type values SHALL be normalized to uppercase before grouping (BE returns lowercase e.g. `mcp_deployment`)

#### Scenario: Grid columns match export content grid
- **WHEN** a container tab is selected
- **THEN** the grid SHALL show columns: Display name, Description, ID
- **WHEN** the Images tab is selected
- **THEN** the grid SHALL show columns: Display name, Description, Version, ID
- **AND** image data SHALL be normalized to use `displayName` for Display name, `description` for Description, `version` for Version, and `name` for ID — same base fields as containers plus Version

#### Scenario: Grid columns refresh on tab switch
- **WHEN** user switches between tabs with different column counts (e.g., containers to images)
- **THEN** the grid SHALL remount to display the correct columns for the selected tab
- **AND** this SHALL be achieved via `key={selectedTab}` on the `GridView` component

#### Scenario: Empty entity types are not shown as tabs
- **WHEN** the preview response contains an entity type with zero entities
- **THEN** no tab SHALL be rendered for that entity type

### Requirement: Include secrets checkbox affects exported file only

The "Include secrets" checkbox SHALL affect only the exported file. Toggling it SHALL NOT change the preview grid and SHALL NOT issue another preview request.

#### Scenario: Toggling include secrets does not reload preview
- **WHEN** user toggles the "Include secrets" checkbox
- **THEN** the preview grid content SHALL NOT change
- **AND** no additional API call SHALL be made

### Requirement: Include global firewall checkbox affects exported file only

The "Include global firewall" checkbox SHALL affect only the exported file. Toggling it SHALL NOT change the preview grid.

#### Scenario: Include global firewall does not affect preview
- **WHEN** user toggles the "Include global firewall" checkbox
- **THEN** the preview grid content SHALL NOT change

### Requirement: Export button labeled "Prepare file"

The submit button of the deployments export preview modal SHALL be labeled "Prepare file".

#### Scenario: Button label
- **WHEN** the export preview modal is open for deployments
- **THEN** the submit button SHALL be labeled "Prepare file" (`ButtonsI18nKey.PrepareFile`)

### Requirement: Preview error handling

When the export preview request fails, the system SHALL report the failure in an error toast.

#### Scenario: Preview API call fails
- **WHEN** the `previewDeploymentExportConfig` call fails
- **THEN** the system SHALL display an error toast notification with error header, message, and request ID
