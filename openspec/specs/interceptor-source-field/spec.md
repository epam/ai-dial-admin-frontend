## ADDED Requirements

### Requirement: SelectRunnerModal displays available interceptor templates
The SelectRunnerModal SHALL pass `runners` data as `rowData` and `BASE_COLUMNS` as `columnDefs` to `GridView`, so that the grid renders and displays available templates.

#### Scenario: Template list displays when runners data is available
- **WHEN** the user opens the interceptor template selection dialog and `runners` contains template data
- **THEN** the grid SHALL display all available interceptor templates

#### Scenario: Empty state displays when no runners exist
- **WHEN** the user opens the interceptor template selection dialog and `runners` is empty
- **THEN** the grid SHALL display the "No Templates" empty state

#### Scenario: Previously selected runner is pre-selected
- **WHEN** the user opens the interceptor template selection dialog and a runner was previously selected
- **THEN** the grid SHALL pre-select the row matching the previously selected runner name
