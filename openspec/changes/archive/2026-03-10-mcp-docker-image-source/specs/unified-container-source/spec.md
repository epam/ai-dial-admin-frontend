## MODIFIED Requirements

### Requirement: image_reference type defined but no UI
The `CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE` enum value SHALL be defined. A UI flow SHALL be implemented for creating MCP containers with `image_reference` source via the "From Docker Image Reference" option on the MCP listing page.

#### Scenario: IMAGE_REFERENCE enum value exists
- **WHEN** the `CONTAINER_SOURCE_TYPE` enum is referenced
- **THEN** it SHALL include `IMAGE_REFERENCE = 'image_reference'`

#### Scenario: MCP containers can be created with IMAGE_REFERENCE source
- **WHEN** a user selects "From Docker Image Reference" on the MCP listing page
- **THEN** the system SHALL open a modal that creates a container with `source.$type = 'image_reference'`
