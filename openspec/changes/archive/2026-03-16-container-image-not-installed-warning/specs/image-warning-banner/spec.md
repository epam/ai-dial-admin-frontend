## Capability: Image Status Warning Banner on Container View

### Behavior

When a container's source image has `buildStatus` of `NOT_BUILT` or `BUILD_FAILED`, a warning banner is displayed at the top of the Properties tab content.

### Conditions

- Container source type is `INTERNAL_IMAGE` (`source.$type === CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE`)
- Image exists and `image.buildStatus` is `NOT_BUILT` or `BUILD_FAILED`
- Applies to all container types: MCP, Interceptor, Adapter
- Applies regardless of container status

### Warning Messages

**NOT_BUILT:**
> Image not installed. This container depends on a **{imageName} ({imageVersion})** image that has not been installed. Install the image to enable this container.

**BUILD_FAILED:**
> Image installation failed. This container depends on a **{imageName} ({imageVersion})** image whose installation has failed. Reinstall the image to enable this container.

Where `{imageName}` is `image.name` and `{imageVersion}` is `image.version`.

### Install Image Button

- Rendered inside the alert banner, aligned to the right
- Label: "Install image"
- Icon: `IconBlocks` (same as image detail page install button)
- Style: `DialNeutralButton` with `BASE_BUTTON_ICON_PROPS`
- Click action: opens `ImageInstall` confirmation modal

### Install Flow

1. User clicks "Install image" button in the banner
2. `ImageInstall` modal opens showing image version and description
3. User confirms → `installImage(image.id)` server action is called
4. On success: navigate to image detail page via `router.push(getUrnForEntity(ApplicationRoute.Images, { id: image.id }))`
5. On failure: show error notification via `showNotification(getErrorNotification(res.errorHeader, res.errorMessage))`

### Properties Tab Warning Icon

- The Properties tab label shows a warning icon when image status is `NOT_BUILT` or `BUILD_FAILED`
- Uses the existing `warning` property on `TabModel`
- Follows the pattern of `firewallTab({ warning: allAllowed })`

### Run Button Disabled State

- When image is not installed (`NOT_BUILT` or `BUILD_FAILED`) and container status is NOT `RUNNING`, `PENDING`, or `FAILED` (crashed): Run button is disabled
- When container is already running: Stop button remains available (existing behavior unchanged)

### i18n Keys

New keys added to containers i18n namespace:
- `ImageNotInstalledWarning` — NOT_BUILT message
- `ImageBuildFailedWarning` — BUILD_FAILED message
- `InstallImage` — button label (or reuse existing `ButtonsI18nKey.Install` if appropriate)

### Accessibility

- `DialNotification` provides built-in `role="alert"` semantics
- Install button is a native `<button>` via `DialNeutralButton` — keyboard accessible
- Disabled Run button communicates state via `disabled` attribute
