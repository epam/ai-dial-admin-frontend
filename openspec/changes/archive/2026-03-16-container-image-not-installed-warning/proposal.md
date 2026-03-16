## Why

When deployments are imported, a container can end up in a running (or any other) state while its source image has `buildStatus` of `NOT_BUILT` or `BUILD_FAILED`. The container cannot function correctly without a properly installed image, but there is no indication of this problem on the container detail page. Users have no way to quickly understand why things aren't working or take action to fix it.

## What Changes

- Show a warning banner inside the **Properties tab** of all container types (MCP, Interceptor, Adapter) when the container's source image has `buildStatus` of `NOT_BUILT` or `BUILD_FAILED`
- Two distinct messages depending on the image status:
  - **NOT_BUILT**: "Image not installed. This container depends on a **{name} ({version})** image that has not been installed. Install the image to enable this container."
  - **BUILD_FAILED**: "Image installation failed. This container depends on a **{name} ({version})** image whose installation has failed. Reinstall the image to enable this container."
- Banner includes an "Install image" button (using `IconBlocks` icon, matching the image detail page) that opens the existing `ImageInstall` confirmation modal
- After successful installation, navigate to the image detail page (`/deployment-images/{id}`) in the same tab
- Add a warning icon on the **Properties tab label** when the image has issues
- **Disable the Run button** when the image is not installed and the container is not running; keep the Stop button available if the container is already running

## Non-goals

- Handling the case where the image entity doesn't exist at all (missing `imageDefinitionId` reference) — only internal/local images in scope
- Changing the import flow itself to prevent this situation
- Modifying the `ImageInstall` modal component
- Adding warnings to the container list/grid view

## Capabilities

### New Capabilities

- **Image status warning on container view**: Alert banner with contextual message and quick-install action when source image is not properly installed

### Modified Capabilities

- **Properties tab**: Gains `warning` state when image has issues
- **Run button**: Disabled when image is not installed and container is not in a running state

## Impact

- **`TabsContent.tsx`**: Warning banner rendered at top of Properties tab content
- **`ContainerView.tsx`**: Computes `imageNotInstalled` flag, passes to tabs config
- **`propertiesTab()` in `utils/tabs/utils.ts`**: Accepts new `warning` parameter
- **`ContainersButtonsWrapper.tsx`**: Accepts `image` prop, disables Run when image not installed
- **3 page routes** (mcp/interceptor/adapter containers): Pass image to buttons wrapper
- **i18n**: New translation keys for warning messages
