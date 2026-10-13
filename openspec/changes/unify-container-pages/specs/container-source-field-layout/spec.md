## MODIFIED Requirements

### Requirement: Source type displayed as read-only label in the info header

The container Properties tab info header SHALL display the container's source type as a read-only `DialLabelledText` whose label is `t(EntitiesI18nKey.SourceType)` and whose value is resolved from the container source and the container type. This label SHALL be rendered for all container types (MCP, Adapter, Application, Interceptor) on `/containers/[id]`, and for Model Servings.

#### Scenario: INTERNAL_IMAGE container shows "Internal {type} Image"

- **WHEN** the container has `source.$type === 'internal_image'` and the container type is MCP
- **THEN** the Properties info header SHALL display a labelled text `"Source type: Internal MCP Image"`

#### Scenario: IMAGE_REFERENCE container shows "Docker Image"

- **WHEN** the container has `source.$type === 'image_reference'`
- **THEN** the Properties info header SHALL display a labelled text `"Source type: Docker Image"`

#### Scenario: NGC_REGISTRY container shows "NGC Registry"

- **WHEN** the container has `source.$type === 'ngc_registry'`
- **THEN** the Properties info header SHALL display a labelled text `"Source type: NGC Registry"`

#### Scenario: HUGGINGFACE container shows "Hugging Face"

- **WHEN** the container has `source.$type === 'huggingface'`
- **THEN** the Properties info header SHALL display a labelled text `"Source type: Hugging Face"`

#### Scenario: Per-type substitution for internal image

- **WHEN** an Adapter container has `source.$type === 'internal_image'` and the container is on `/containers/[id]`
- **THEN** the label value SHALL be `"Internal Adapter Image"`

- **WHEN** an Interceptor container has `source.$type === 'internal_image'` and the container is on `/containers/[id]`
- **THEN** the label value SHALL be `"Internal Interceptor Image"`
