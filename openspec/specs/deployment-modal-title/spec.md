## ADDED Requirements

### Requirement: Deployment Add modal SHALL display entity-specific title
The Add Entities modal for deployment entities SHALL display a title composed of "Add" followed by the entity type name using original i18n casing (e.g., "Add MCP Containers", "Add Images", "Add Model Servings").

#### Scenario: Modal title for MCP Container tab
- **WHEN** the user opens the Add modal from the MCP Containers tab
- **THEN** the modal title SHALL be "Add MCP Containers"

#### Scenario: Modal title for Interceptor Container tab
- **WHEN** the user opens the Add modal from the Interceptor Containers tab
- **THEN** the modal title SHALL be "Add Interceptor Containers"

#### Scenario: Modal title for Adapter Container tab
- **WHEN** the user opens the Add modal from the Adapter Containers tab
- **THEN** the modal title SHALL be "Add Adapter Containers"

#### Scenario: Modal title for Model Serving tab
- **WHEN** the user opens the Add modal from the Model Servings tab
- **THEN** the modal title SHALL be "Add Model Servings"

#### Scenario: Modal title for Image tab
- **WHEN** the user opens the Add modal from the Images tab
- **THEN** the modal title SHALL be "Add Images"

## MODIFIED Requirements

### Requirement: All Add modal titles SHALL use original i18n casing
The `getButtonTitle` function SHALL use original i18n casing (no `.toLowerCase()`) for all entity types, ensuring consistent casing between button labels and modal titles.

#### Scenario: Core entity modal titles use original casing
- **WHEN** the user opens the Add modal from a Core entity tab (e.g., Models, Applications)
- **THEN** the modal title SHALL use original casing (e.g., "Add Models", "Add Applications")
