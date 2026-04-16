## ADDED Requirements

### Requirement: Source type displayed as read-only label in the info header

The container Properties tab info header SHALL display the container's source type as a read-only `DialLabelledText` whose label is `t(EntitiesI18nKey.SourceType)` and whose value is resolved via `getContainerSourceTypeLabel(container.source, route, t)`. This label SHALL be rendered for all container routes: MCP containers, Adapter containers, Interceptor containers, and Model Servings.

#### Scenario: INTERNAL_IMAGE container shows "Internal {type} Image"

- **WHEN** the container has `source.$type === 'internal_image'` and the active route is `/mcp-containers/[id]`
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

#### Scenario: Per-route type substitution for internal image

- **WHEN** an Adapter container has `source.$type === 'internal_image'` and the route is `/adapter-containers/[id]`
- **THEN** the label value SHALL be `"Internal Adapter Image"`

- **WHEN** an Interceptor container has `source.$type === 'internal_image'` and the route is `/interceptor-containers/[id]`
- **THEN** the label value SHALL be `"Internal Interceptor Image"`

### Requirement: Image moved from info header prefix to form body

The info header SHALL NOT render the image name and version as a labelled prefix. The `MCP Image: Github (1.2.1) ↗` prefix SHALL be removed from the `headerPrefix` prop passed by `TabsContent.tsx`. For `INTERNAL_IMAGE` containers, the image SHALL instead be rendered as a field inside the Properties tab form body.

#### Scenario: No image prefix in info header

- **WHEN** the Properties tab is open for any container with `source.$type === 'internal_image'`
- **THEN** the info header SHALL NOT contain a `DialLabelledText` whose label matches `ContainersI18nKey.ContainerImage`
- **AND** the info header SHALL contain a `DialLabelledText` whose label matches `EntitiesI18nKey.SourceType`

### Requirement: Container source rendered as form field for every $type

The `<ContainerSource>` component inside `ContainerFields.tsx` SHALL render unconditionally for every container (regardless of `route` or `source.$type`). The previous gate `route === ModelServings || $type === IMAGE_REFERENCE` SHALL be removed.

#### Scenario: INTERNAL_IMAGE renders InternalImageField

- **WHEN** a container has `source.$type === 'internal_image'`
- **THEN** `ContainerSource` SHALL render an `InternalImageField` inside the form body

#### Scenario: IMAGE_REFERENCE still renders the docker/MCP registry input

- **WHEN** a container has `source.$type === 'image_reference'`
- **THEN** `ContainerSource` SHALL render either `McpServerNameField` (when `externalRegistryRef` is present) or the `imageReference` `DialInput` (otherwise)

#### Scenario: NGC_REGISTRY still renders the imageRef input

- **WHEN** a container has `source.$type === 'ngc_registry'`
- **THEN** `ContainerSource` SHALL render the `imageRef` `DialInput`

#### Scenario: HUGGINGFACE still renders HFModelNameField

- **WHEN** a container has `source.$type === 'huggingface'`
- **THEN** `ContainerSource` SHALL render `HFModelNameField`

### Requirement: InternalImageField displays image as input-with-modal field

For `INTERNAL_IMAGE` containers, the form body SHALL render an `InternalImageField` component built on `DialLabel` + `DialInputPopup` (the input-with-modal primitive from `@epam/ai-dial-ui-kit`) with the following behavior:

- Label: `t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })` (e.g. `"MCP Image"`, `"Adapter Image"`, `"Interceptor Image"`), rendered via `DialLabel` above the input.
- Selected value: `"<image.name> (<image.version>)"` displayed inside `DialInputPopup`.
- Built-in expand affordance: `DialInputPopup` renders the whole input as a clickable popup trigger with an expand icon; clicking it opens the popup.
- The popup's children is the existing `ContainerChangeImage` modal.
- The popup trigger SHALL be disabled (via `DialInputPopup`'s `disabled` prop) when the container status is `PENDING` or `STOPPING` (preserving the `change-image-button` semantics from the archived spec), when the parent `disabled` prop is true, or when `image` is `undefined`.
- Clicking the trigger SHALL open `ContainerChangeImage`; applying a new image id SHALL update the container via the existing `updateContainer` action and refresh the router.

#### Scenario: Field renders image name and version

- **WHEN** `InternalImageField` receives an `image` with `name = 'Github'` and `version = '1.2.1'`
- **THEN** the rendered `DialInput` value SHALL be `"Github (1.2.1)"`

#### Scenario: Clicking the popup trigger opens the change image modal

- **WHEN** the user clicks the `DialInputPopup` trigger on `InternalImageField`
- **THEN** `ContainerChangeImage` SHALL open with the current image preselected

#### Scenario: Popup disabled during PENDING

- **WHEN** `container.status === 'pending'`
- **THEN** clicking the popup trigger SHALL NOT open the modal

#### Scenario: Popup disabled during STOPPING

- **WHEN** `container.status === 'stopping'`
- **THEN** clicking the popup trigger SHALL NOT open the modal

#### Scenario: Popup enabled during RUNNING / STOPPED / FAILED

- **WHEN** `container.status` is `running`, `stopped`, or `crashed` (FAILED)
- **THEN** clicking the popup trigger SHALL open the modal

#### Scenario: Applying a new image updates the container

- **WHEN** the user selects a new image id inside `ContainerChangeImage` and confirms
- **THEN** `updateContainer` SHALL be called with the container's existing fields plus `source: { ...container.source, imageDefinitionId: <new-id> }`
- **AND** on success the page SHALL refresh via `router.refresh()`
- **AND** on failure a toast error notification SHALL be shown via `getErrorNotification`

#### Scenario: Accessibility

- **WHEN** `InternalImageField` renders
- **THEN** the `DialLabel` SHALL be associated with the popup input via `htmlFor`/`elementId="internalImage"`, and `DialInputPopup`'s built-in popup trigger button SHALL have an accessible name, satisfying WCAG 2.1 AA: 4.1.2 Name, Role, Value

### Requirement: Centralized source type label utility

A pure utility `getContainerSourceTypeLabel(source: ContainerSource | undefined, route: ApplicationRoute, t: Translator): string` SHALL live in `utils/deployments/containers.ts`. It SHALL return the translated label for every value of `CONTAINER_SOURCE_TYPE` plus a sensible fallback for missing/unknown sources.

#### Scenario: Returns Internal {type} Image for internal image source

- **WHEN** called with `{ $type: 'internal_image' }` and route `ApplicationRoute.McpContainers`
- **THEN** the utility SHALL return `"Internal MCP Image"`

#### Scenario: Returns Docker Image for image reference source

- **WHEN** called with `{ $type: 'image_reference' }`
- **THEN** the utility SHALL return `"Docker Image"`

#### Scenario: Returns NGC Registry for NGC source

- **WHEN** called with `{ $type: 'ngc_registry' }`
- **THEN** the utility SHALL return `"NGC Registry"`

#### Scenario: Returns Hugging Face for HF source

- **WHEN** called with `{ $type: 'huggingface' }`
- **THEN** the utility SHALL return `"Hugging Face"`

#### Scenario: Returns empty string for missing source

- **WHEN** called with `undefined`
- **THEN** the utility SHALL return an empty string

### Requirement: Image prop is threaded from ContainerView into the source field

`ContainerView.tsx` SHALL pass the `image` prop through `TabsContent` → `Properties` → `ContainerFields` → `ContainerSource` so the `InternalImageField` branch can display the image name and version and open the change-image modal. Non-INTERNAL_IMAGE branches SHALL ignore the prop.

#### Scenario: image prop reaches ContainerSource

- **WHEN** `ContainerView` renders with a non-null `image` and the container has `source.$type === 'internal_image'`
- **THEN** `ContainerSource` SHALL receive the `image` prop and forward it to `InternalImageField`

#### Scenario: Missing image is handled gracefully

- **WHEN** `ContainerView` renders with `image === undefined` and `source.$type === 'internal_image'`
- **THEN** `InternalImageField` SHALL render with an empty selected value and clicking the popup trigger SHALL NOT open the modal
