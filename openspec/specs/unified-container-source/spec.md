## ADDED Requirements

### Requirement: ContainerSource flat type with $type discriminator
The system SHALL define a single flat `ContainerSource` type with a `$type` field of type `CONTAINER_SOURCE_TYPE` and all source-specific fields as optional: `imageDefinitionId`, `imageReference`, `imageRef`, and `modelName`.

#### Scenario: Direct property access without casting
- **WHEN** a component accesses `container.source.imageDefinitionId`
- **THEN** TypeScript SHALL allow direct access without type narrowing or casting

#### Scenario: All container types use source field
- **WHEN** a Container object is created for any container type (MCP, Adapter, Interceptor, NIM, HF)
- **THEN** the container SHALL have a `source` field of type `ContainerSource`

### Requirement: Container interface uses source instead of imageDefinitionId
The `Container` interface SHALL replace the top-level `imageDefinitionId: string` field with `source: ContainerSource`. The `SERVING_SOURCE` type, `MODEL_SOURCE_TYPE` enum, and all individual source types (`InternalImageSource`, `ImageReferenceSource`, `NgcRegistrySource`, `HuggingFaceSource`) SHALL be removed.

#### Scenario: MCP container uses internal_image source
- **WHEN** a MCP container is created by selecting an image definition from the grid
- **THEN** the container's `source` field SHALL be `{ $type: 'internal_image', imageDefinitionId: '<selected-id>' }`

#### Scenario: MCP container uses image_reference source
- **WHEN** a MCP container is created with an external Docker reference
- **THEN** the container's `source` field SHALL be `{ $type: 'image_reference', imageReference: '<docker-ref>' }`

#### Scenario: NIM container source
- **WHEN** a NIM model serving is created
- **THEN** the container's `source` field SHALL be `{ $type: 'ngc_registry', imageRef: '<uri>' }` instead of the former `SERVING_SOURCE` type

#### Scenario: HF container source
- **WHEN** a HuggingFace model serving is created
- **THEN** the container's `source` field SHALL be `{ $type: 'huggingface', modelName: '<model>' }` instead of the former `SERVING_SOURCE` type

### Requirement: image_reference type defined but no UI
The `CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE` enum value SHALL be defined. A UI flow SHALL be implemented for creating MCP containers with `image_reference` source via the "From Docker Image Reference" option on the MCP listing page.

#### Scenario: IMAGE_REFERENCE enum value exists
- **WHEN** the `CONTAINER_SOURCE_TYPE` enum is referenced
- **THEN** it SHALL include `IMAGE_REFERENCE = 'image_reference'`

#### Scenario: MCP containers can be created with IMAGE_REFERENCE source
- **WHEN** a user selects "From Docker Image Reference" on the MCP listing page
- **THEN** the system SHALL open a modal that creates a container with `source.$type = 'image_reference'`

### Requirement: Container template uses source field
The `getContainerTemplate` utility SHALL initialize containers with the appropriate `source` based on container type. The template SHALL NOT include a top-level `imageDefinitionId` field.

#### Scenario: MCP/Adapter/Interceptor template
- **WHEN** `getContainerTemplate` is called with `CONTAINER_TYPE.MCP`, `CONTAINER_TYPE.ADAPTER`, or `CONTAINER_TYPE.INTERCEPTOR`
- **THEN** the returned template SHALL include `source: { $type: 'internal_image', imageDefinitionId: '' }`

#### Scenario: NIM template
- **WHEN** `getContainerTemplate` is called with `CONTAINER_TYPE.NIM`
- **THEN** the returned template SHALL include `source: { $type: 'ngc_registry' }`

#### Scenario: HF template
- **WHEN** `getContainerTemplate` is called with `CONTAINER_TYPE.HF`
- **THEN** the returned template SHALL include `source: { $type: 'huggingface' }`

### Requirement: ContainerRedeploySnapshot uses source
The `ContainerRedeploySnapshot` interface SHALL use `source: ContainerSource` instead of `imageDefinitionId: string`.

#### Scenario: Redeploy snapshot creation
- **WHEN** `getContainerRedeploySnapshot` is called with a container
- **THEN** the snapshot SHALL include the container's `source` field instead of `imageDefinitionId`

### Requirement: Source-aware conditional rendering
Components that currently check `container.source?.$type === MODEL_SOURCE_TYPE.NIM` or `MODEL_SOURCE_TYPE.HF` SHALL use `CONTAINER_SOURCE_TYPE.NGC_REGISTRY` and `CONTAINER_SOURCE_TYPE.HUGGINGFACE` respectively.

### Requirement: Spread pattern for source updates
Callbacks that update source fields SHALL use spread: `{ ...container.source, fieldName: value }` to preserve the existing `$type`. Callbacks SHALL NOT reconstruct `$type`.

### Requirement: Server API layer unchanged
The server API layer (`server/deployments/containers.ts`) SHALL NOT be modified in this change.
