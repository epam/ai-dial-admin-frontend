## MODIFIED Requirements

### Requirement: Container source field shows warning icon when saved container is not running

The Container source field rendered by `components/SourceField/Containers/Containers.tsx` SHALL render `<WarningIcon warningText={...} />` inside the `InputPopup`'s `iconBefore` slot whenever the saved container (the one referenced by `entity.source.containerId`) is present in the fetched container list and has a `status` other than `CONTAINER_STATUS.RUNNING`. The tooltip text SHALL be sourced from `t(ContainersI18nKey.ContainerNotRunningTooltip)` ("Container is not running"). This decoration SHALL apply only to the non-modal popup branch — the modal create-flow branch (which uses `DialSelectField`) is excluded.

#### Scenario: Stopped container shows the icon

- **WHEN** the field renders for an entity whose saved container has `status === 'stopped'`
- **THEN** `InputPopup` SHALL receive an `iconBefore` containing a `WarningIcon` whose `warningText` resolves to `t(ContainersI18nKey.ContainerNotRunningTooltip)`

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

### Requirement: Container image field shows warning icon when image is not installed

The Container image field rendered by `components/Deployments/Fields/ContainerSource/InternalImageField.tsx` SHALL render `<WarningIcon warningText={...} />` inside the `InputPopup`'s `iconBefore` slot whenever `isImageNotInstalled(image)` returns `true`. The tooltip text SHALL be `t(ContainersI18nKey.ImageNotInstalledTooltip)` ("Image is not installed"). When the image is healthy or not provided, the icon SHALL be hidden.

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
