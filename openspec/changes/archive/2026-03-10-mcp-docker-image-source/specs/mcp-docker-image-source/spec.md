## ADDED Requirements

### Requirement: MCP Create button is a dropdown with two options
The MCP containers listing page SHALL render the Create button as a `DialButtonDropdown` with two options: "From Internal MCP Image" and "From Docker Image Reference".

#### Scenario: User sees dropdown options on MCP listing
- **WHEN** the user is on the MCP containers listing page and clicks the Create dropdown
- **THEN** the dropdown SHALL display two items: "From Internal MCP Image" and "From Docker Image Reference"

#### Scenario: "From Internal MCP Image" opens existing two-step modal
- **WHEN** the user selects "From Internal MCP Image" from the dropdown
- **THEN** the system SHALL open the existing `ContainerCreate` two-step modal (image grid → properties)

#### Scenario: "From Docker Image Reference" opens single-step modal
- **WHEN** the user selects "From Docker Image Reference" from the dropdown
- **THEN** the system SHALL open the `ServingCreate` modal configured for MCP container with `IMAGE_REFERENCE` source type

### Requirement: ServingCreate modal supports MCP with IMAGE_REFERENCE source
The `ServingCreate` modal SHALL accept an optional `sourceType` prop of type `CONTAINER_SOURCE_TYPE`. When provided, the container template SHALL use this source type instead of the default for the given container type.

#### Scenario: MCP Docker image reference modal renders correctly
- **WHEN** `ServingCreate` is opened with `type=CONTAINER_TYPE.MCP` and `sourceType=CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE`
- **THEN** the modal SHALL display the container base fields (name, display name, description) and a Docker image reference input field

#### Scenario: Modal submit creates container with IMAGE_REFERENCE source
- **WHEN** the user fills in the Docker image reference and submits the modal
- **THEN** the created container SHALL have `source: { $type: 'image_reference', imageReference: '<user-input>' }` and `$type: 'mcp'`

### Requirement: ContainerSource renders Docker image reference field for IMAGE_REFERENCE
The `ContainerSource` component SHALL render a `DialInput` text field for containers with `source.$type === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE`. The field SHALL store its value in `container.source.imageReference`.

#### Scenario: IMAGE_REFERENCE source shows Docker reference input
- **WHEN** a container has `source.$type === 'image_reference'`
- **THEN** `ContainerSource` SHALL render a text input labeled "Docker Image Reference" with URI validation

#### Scenario: Docker reference field validates input
- **WHEN** the user enters a value in the Docker image reference field
- **THEN** the field SHALL validate using `getDeploymentsURIError` and display validation errors inline

#### Scenario: Docker reference field updates container source
- **WHEN** the user changes the Docker image reference value
- **THEN** the container's `source.imageReference` SHALL be updated via spread pattern preserving `$type`

### Requirement: ContainerFields shows ContainerSource for IMAGE_REFERENCE MCP containers
The `ContainerFields` component SHALL render the `ContainerSource` component when the route is `ModelServings` OR when the container's `source.$type` is `IMAGE_REFERENCE`.

#### Scenario: MCP modal with IMAGE_REFERENCE shows source field
- **WHEN** `ContainerFields` renders in modal mode for an MCP container with `IMAGE_REFERENCE` source
- **THEN** the `ContainerSource` component SHALL be visible

#### Scenario: MCP modal with INTERNAL_IMAGE does not show source field
- **WHEN** `ContainerFields` renders in modal mode for an MCP container with `INTERNAL_IMAGE` source
- **THEN** the `ContainerSource` component SHALL NOT be visible (image was selected in step 1)

### Requirement: getContainerTemplate supports sourceType override
The `getContainerTemplate` function SHALL accept an optional `sourceType` parameter. When `sourceType` is `IMAGE_REFERENCE` and `type` is `MCP`, the template SHALL use `{ $type: IMAGE_REFERENCE, imageReference: '' }` as the source.

#### Scenario: MCP template with IMAGE_REFERENCE source
- **WHEN** `getContainerTemplate` is called with `type=MCP` and `sourceType=IMAGE_REFERENCE`
- **THEN** the returned template SHALL have `source: { $type: 'image_reference', imageReference: '' }` and `transport: 'http_streaming'`

#### Scenario: MCP template without sourceType override unchanged
- **WHEN** `getContainerTemplate` is called with `type=MCP` and no `sourceType`
- **THEN** the returned template SHALL have `source: { $type: 'internal_image', imageDefinitionId: '' }` (existing behavior)

### Requirement: New ModalType for MCP Docker image reference
The `ModalType` enum SHALL include a `createMcpDockerImage` entry for the Docker image reference MCP creation flow.

#### Scenario: ModalType enum has new entry
- **WHEN** the MCP Docker image reference flow is triggered
- **THEN** the `ModalType.createMcpDockerImage` value SHALL be used to control modal rendering in `HeaderButtons`

### Requirement: i18n keys for MCP dropdown options
New i18n translation keys SHALL be added for the MCP Create dropdown labels: "From Internal MCP Image" and "From Docker Image Reference".

#### Scenario: Dropdown labels are translatable
- **WHEN** the MCP Create dropdown renders
- **THEN** both option labels SHALL use i18n translation keys (not hardcoded strings)
