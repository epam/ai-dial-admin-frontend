## MODIFIED Requirements

### Requirement: Source type displayed as read-only label in the info header

The container Properties tab info header SHALL display the container's source type as a read-only `LabelledText` whose label is `t(EntitiesI18nKey.SourceType)` and whose value is resolved from the container source and the container type. This label SHALL be rendered for all container types (MCP, Adapter, Application, Interceptor) on `/containers/[id]`, and for Model Servings.

#### Scenario: INTERNAL_IMAGE container shows "Internal {type} Image"

- **WHEN** the container has `source.$type === 'internal_image'` and the container type is MCP
- **THEN** the Properties info header SHALL display a labelled text `"Source type: Internal MCP Image"`

#### Scenario: IMAGE_REFERENCE container shows "Docker Image"

- **WHEN** the container has `source.$type === 'image_reference'`
- **THEN** the Properties info header SHALL display a labelled text `"Source type: Docker Image"`

#### Scenario: HUGGINGFACE container shows "Hugging Face"

- **WHEN** the container has `source.$type === 'huggingface'`
- **THEN** the Properties info header SHALL display a labelled text `"Source type: Hugging Face"`

#### Scenario: Per-type substitution for internal image

- **WHEN** an Adapter container has `source.$type === 'internal_image'` and the container is on `/containers/[id]`
- **THEN** the label value SHALL be `"Internal Adapter Image"`

- **WHEN** an Interceptor container has `source.$type === 'internal_image'` and the container is on `/containers/[id]`
- **THEN** the label value SHALL be `"Internal Interceptor Image"`

### Requirement: Image moved from info header prefix to form body

The info header SHALL NOT render the image name and version as a labelled prefix. The `MCP Image: Github (1.2.1) ↗` prefix SHALL be removed from the `headerPrefix` prop passed by `TabsContent.tsx`. For `INTERNAL_IMAGE` containers, the image SHALL instead be rendered as a field inside the Properties tab form body.

#### Scenario: No image prefix in info header

- **WHEN** the Properties tab is open for any container with `source.$type === 'internal_image'`
- **THEN** the info header SHALL NOT contain a `LabelledText` whose label matches `ContainersI18nKey.ContainerImage`
- **AND** the info header SHALL contain a `LabelledText` whose label matches `EntitiesI18nKey.SourceType`
