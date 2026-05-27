## Purpose

Define inline warning-icon decoration for two source-related form fields whose containing pages already display top-of-view warning banners: the Container source field on entity detail views (Models / Applications / Toolsets / Interceptors) and the Container image field on container detail views. The icon visually anchors the banner's message to the specific field that needs user attention, using a shared `<WarningIcon>` common component built on the ui-kit's `iconBefore` slot for `DialInputPopup`.

## Requirements

### Requirement: Shared WarningIcon component lives under Common

A shared `<WarningIcon />` component SHALL live at `components/Common/WarningIcon/WarningIcon.tsx`. The component SHALL accept a single optional prop `warningText?: string`. When `warningText` is a non-empty string, the component SHALL render a yellow warning icon (`IconAlertTriangleFilled` from `@tabler/icons-react`) with class `text-warning-icon`, wrapped in a `DialTooltip` (placement `bottom`) whose body is `warningText`. When `warningText` is falsy (undefined, null, or empty string), the component SHALL render the icon hidden (no visual presence) and the tooltip trigger SHALL be hidden.

#### Scenario: Icon renders when warningText is provided

- **WHEN** `<WarningIcon warningText="Container is not running" />` renders
- **THEN** an `IconAlertTriangleFilled` SHALL be visible with `className` containing `text-warning-icon`
- **AND** a `DialTooltip` SHALL wrap the icon with placement `bottom`
- **AND** hovering the icon reveals the tooltip with the text "Container is not running"

#### Scenario: Icon hides when warningText is undefined

- **WHEN** `<WarningIcon warningText={undefined} />` renders
- **THEN** the rendered `IconAlertTriangleFilled` SHALL include the class `hidden`
- **AND** the `DialTooltip` trigger SHALL also be hidden

#### Scenario: Icon hides when warningText is an empty string

- **WHEN** `<WarningIcon warningText="" />` renders
- **THEN** the icon SHALL be hidden (same behavior as undefined)

### Requirement: WarningIcon's previous endpoint-scoped location is removed

The legacy file at `components/UpstreamEndpoints/Endpoint/WarningIcon.tsx` SHALL be removed as part of this change. Its previous consumer (`Endpoint.tsx`) SHALL import the moved component from `components/Common/WarningIcon/WarningIcon.tsx` and pass the prop as `warningText={endpointWarning}`.

#### Scenario: Endpoint.tsx imports from the new location

- **WHEN** the Endpoint.tsx source is read after the change
- **THEN** it SHALL contain an import for `WarningIcon` from `@/src/components/Common/WarningIcon/WarningIcon`
- **AND** SHALL NOT contain an import path matching `UpstreamEndpoints/Endpoint/WarningIcon`

#### Scenario: Endpoint.tsx passes warningText prop

- **WHEN** Endpoint.tsx renders `<WarningIcon ... />`
- **THEN** the prop name used SHALL be `warningText`, not `endpointWarning`

### Requirement: Container source field shows warning icon when saved container is not running

The Container source field rendered by `components/SourceField/Containers/Containers.tsx` SHALL render `<WarningIcon warningText={...} />` inside the `DialInputPopup`'s `iconBefore` slot whenever the saved container (the one referenced by `entity.source.containerId`) is present in the fetched container list and has a `status` other than `CONTAINER_STATUS.RUNNING`. The tooltip text SHALL be sourced from `t(ContainersI18nKey.ContainerNotRunningTooltip)` ("Container is not running"). This decoration SHALL apply only to the non-modal popup branch — the modal create-flow branch (which uses `DialSelectField`) is excluded.

#### Scenario: Stopped container shows the icon

- **WHEN** the field renders for an entity whose saved container has `status === 'stopped'`
- **THEN** `DialInputPopup` SHALL receive an `iconBefore` containing a `WarningIcon` whose `warningText` resolves to `t(ContainersI18nKey.ContainerNotRunningTooltip)`

#### Scenario: Pending, crashed, stopping, not_deployed all show the icon

- **WHEN** the saved container's status is any of `pending`, `crashed`, `stopping`, `not_deployed`
- **THEN** the icon SHALL render

#### Scenario: Running container hides the icon

- **WHEN** the saved container's status is `running`
- **THEN** the `iconBefore` SHALL pass `warningText={undefined}` (icon hidden)

#### Scenario: No saved container hides the icon

- **WHEN** `entity.source?.containerId` is empty or the referenced container is not in the fetched list
- **THEN** the icon SHALL be hidden

#### Scenario: Modal create-flow does not render the icon

- **WHEN** the component renders with `isModal === true`
- **THEN** the modal branch SHALL render `DialSelectField` without any `WarningIcon` (the modal flow only allows selecting running containers, so the warning state is unreachable there)

### Requirement: Saved container is preserved beyond display name

`components/SourceField/Containers/Containers.tsx` SHALL preserve a reference to the full saved `Container` object (any status), not only its `displayName`. The internal state SHALL hold a `Container | null` slice that captures the result of `containers.find(c => c.name === entity.source?.containerId)` against the **unfiltered** fetch response. The dropdown options SHALL continue to be filtered to running-only.

#### Scenario: Stopped container's display name still rendered

- **WHEN** the saved container has `status === 'stopped'` and the fetch returns it
- **THEN** the field SHALL display the saved container's `displayName` as the value (unchanged from current behavior)
- **AND** the new internal `currentContainer` reference SHALL hold the full `Container` object including `status`

### Requirement: Container image field shows warning icon when image is not installed

The Container image field rendered by `components/Deployments/Fields/ContainerSource/InternalImageField.tsx` SHALL render `<WarningIcon warningText={...} />` inside the `DialInputPopup`'s `iconBefore` slot whenever `isImageNotInstalled(image)` returns `true`. The tooltip text SHALL be `t(ContainersI18nKey.ImageNotInstalledTooltip)` ("Image is not installed"). When the image is healthy or not provided, the icon SHALL be hidden.

The trigger function `isImageNotInstalled` returns `true` for both `IMAGE_STATUS.NOT_BUILT` and `IMAGE_STATUS.BUILD_FAILED`, so a single tooltip covers both sub-states — matching the existing image-not-installed banner that already differentiates copy at the banner level. The icon does not differentiate between the two.

#### Scenario: Not-built image shows the tooltip

- **WHEN** the field renders with an `image` whose `buildStatus === IMAGE_STATUS.NOT_BUILT`
- **THEN** `iconBefore` SHALL render a `WarningIcon` whose `warningText` is `t(ContainersI18nKey.ImageNotInstalledTooltip)`

#### Scenario: Build-failed image shows the same tooltip

- **WHEN** the field renders with an `image` whose `buildStatus === IMAGE_STATUS.BUILD_FAILED`
- **THEN** `iconBefore` SHALL render a `WarningIcon` whose `warningText` is `t(ContainersI18nKey.ImageNotInstalledTooltip)` (same as `NOT_BUILT`)

#### Scenario: Healthy image hides the icon

- **WHEN** `isImageNotInstalled(image)` is false
- **THEN** `iconBefore` SHALL pass `warningText={undefined}` (icon hidden)

### Requirement: Tooltip i18n keys are short and live under ContainersI18nKey

Two short i18n keys SHALL exist under `ContainersI18nKey` in `constants/i18n.ts`, with English translations in `locales/en.ts` under the `Containers` namespace:

- `ContainerNotRunningTooltip = 'Containers.ContainerNotRunningTooltip'` → `'Container is not running'`
- `ImageNotInstalledTooltip = 'Containers.ImageNotInstalledTooltip'` → `'Image is not installed'`

These keys SHALL be used exclusively for the inline field tooltips. The pre-existing sentence-form keys (`ImageNotInstalledWarning`, `ImageBuildFailedWarning`, `ContainerNotRunningTitle`, `ContainerNotRunningDescription`) remain bound to their banner usages and are NOT reused for the tooltip surface.

#### Scenario: Tooltip key for not-running is short

- **WHEN** the English translation for `ContainerNotRunningTooltip` is read
- **THEN** the value SHALL be the literal string `'Container is not running'` (no placeholders, no period at the end)

#### Scenario: Tooltip key for not-installed is short

- **WHEN** the English translation for `ImageNotInstalledTooltip` is read
- **THEN** the value SHALL be the literal string `'Image is not installed'`

### Requirement: Top banners remain unchanged

The existing top-of-view banners SHALL NOT be modified by this change:

- The `ContainerStatusBanner` (placed below tabs on Models / Applications / Toolsets / Interceptors detail views) keeps its current placement, copy, button, and trigger conditions.
- The image-not-installed `DialNotification` in `components/Containers/View/TabsContent.tsx` keeps its current placement, two-variant copy (`ImageNotInstalledWarning` / `ImageBuildFailedWarning`), and `Install image` button.

#### Scenario: ContainerStatusBanner is untouched

- **WHEN** the ContainerStatusBanner component source is read after this change
- **THEN** the trigger condition, the `DialNotification` props, the i18n keys, and the placement in the four entity Views SHALL be identical to their pre-change state

#### Scenario: Image not installed banner is untouched

- **WHEN** `Containers/View/TabsContent.tsx` is read after this change
- **THEN** the `DialNotification` block at the top of the Properties tab SHALL render with the same structure, copy, and `Install image` button as before
