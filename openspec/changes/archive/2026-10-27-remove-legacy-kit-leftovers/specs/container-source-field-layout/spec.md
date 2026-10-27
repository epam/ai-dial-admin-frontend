## MODIFIED Requirements

### Requirement: InternalImageField displays image as input-with-modal field

For `INTERNAL_IMAGE` containers, the form body SHALL render an `InternalImageField` component built on `Label` + `InputPopup` (the local input-with-modal component in `components/Common/InputPopup`) with the following behavior:

- Label: `t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })` (e.g. `"MCP Image"`, `"Adapter Image"`, `"Interceptor Image"`), rendered via `Label` above the input.
- Selected value: `"<image.name> (<image.version>)"` displayed inside `InputPopup`.
- Built-in expand affordance: `InputPopup` renders the whole input as a clickable popup trigger with an expand icon; clicking it opens the popup.
- The popup's children is the existing `ContainerChangeImage` modal.
- The popup trigger SHALL be disabled (via `InputPopup`'s `disabled` prop) when the container status is `PENDING` or `STOPPING` (preserving the `change-image-button` semantics from the archived spec), when the parent `disabled` prop is true, or when `image` is `undefined`.
- Clicking the trigger SHALL open `ContainerChangeImage`; applying a new image id SHALL update the container via the existing `updateContainer` action and refresh the router.

#### Scenario: Field renders image name and version

- **WHEN** `InternalImageField` receives an `image` with `name = 'Github'` and `version = '1.2.1'`
- **THEN** the rendered `Input` value SHALL be `"Github (1.2.1)"`

#### Scenario: Clicking the popup trigger opens the change image modal

- **WHEN** the user clicks the `InputPopup` trigger on `InternalImageField`
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
- **THEN** the `Label` SHALL be associated with the popup input via `htmlFor`/`elementId="internalImage"`, and `InputPopup`'s built-in popup trigger button SHALL have an accessible name, satisfying WCAG 2.1 AA: 4.1.2 Name, Role, Value
