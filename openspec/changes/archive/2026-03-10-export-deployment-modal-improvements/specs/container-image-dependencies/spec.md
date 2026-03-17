## ADDED Requirements

### Requirement: Container Add modal SHALL show image dependency sidebar
The Add Entities modal for container entity types (MCP Container, Interceptor Container, Adapter Container) SHALL display a Dependencies sidebar showing the related image type as a checked, disabled checkbox. Dependencies are resolved via `getAllAvailableDependencies` using `DEPLOYMENT_IMAGE_DEP` constants.

#### Scenario: MCP Container shows MCP Image dependency
- **WHEN** the user opens the Add modal from the MCP Containers tab
- **THEN** the Dependencies sidebar SHALL appear with a single item labeled "MCP Image"
- **THEN** the "MCP Image" checkbox SHALL be checked and disabled (cannot be unchecked)

#### Scenario: Interceptor Container shows Interceptor Image dependency
- **WHEN** the user opens the Add modal from the Interceptor Containers tab
- **THEN** the Dependencies sidebar SHALL appear with a single item labeled "Interceptor Image"
- **THEN** the checkbox SHALL be checked and disabled

#### Scenario: Adapter Container shows Adapter Image dependency
- **WHEN** the user opens the Add modal from the Adapter Containers tab
- **THEN** the Dependencies sidebar SHALL appear with a single item labeled "Adapter Image"
- **THEN** the checkbox SHALL be checked and disabled

#### Scenario: Model Serving and Image tabs do not show dependencies
- **WHEN** the user opens the Add modal from the Model Servings or Images tab
- **THEN** the Dependencies sidebar SHALL NOT appear

#### Scenario: Disabled dependencies do not show "All dependencies" checkbox
- **WHEN** the Dependencies sidebar is shown with `disabled` prop set to true
- **THEN** the "All dependencies" select/deselect checkbox SHALL NOT be displayed
- **THEN** individual dependency checkboxes SHALL NOT have left padding or top margin from the "All dependencies" toggle
