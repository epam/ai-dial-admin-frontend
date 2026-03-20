## Context

Container detail pages (`ContainerView` → `TabsContent`) already receive an optional `image` prop fetched at the page route level via `getImage(container.source.imageDefinitionId)`. The `Image` model has a `buildStatus` field (`NOT_BUILT`, `BUILDING`, `BUILT`, `BUILD_FAILED`). The app already has `installImage(id)` server action, `ImageInstall` confirmation modal, and `DialAlert` component that accepts `ReactNode` as `message`.

## Goals / Non-Goals

**Goals:**
- Warn users when a container's source image is not properly installed
- Provide a one-click path to install the image
- Prevent running a container with a broken image
- Apply consistently across all container types

**Non-Goals:**
- Handling missing image entities
- Modifying import behavior
- Adding warnings outside the container detail page

## Decisions

**Warning banner using `DialAlert` with custom `ReactNode` message**

Render a `DialAlert` with `AlertVariant.Warning` at the top of the Properties tab content in `TabsContent.tsx`. The `message` prop receives a flex row layout containing:
- Left: warning text with bold image name and version (using `Trans` or interpolation)
- Right: `DialNeutralButton` with `IconBlocks` icon and "Install image" label

This follows the existing pattern in `Publications/View/Permissions.tsx` where a custom `<div>` is passed as `message`.

**Condition**: `image?.buildStatus === IMAGE_STATUS.NOT_BUILT || image?.buildStatus === IMAGE_STATUS.BUILD_FAILED`

Only applies when the container source type is `INTERNAL_IMAGE` (which is the only case where `image` prop is populated).

**Separate messages for NOT_BUILT vs BUILD_FAILED**

Two i18n keys with interpolation for image name and version:
- `ContainersI18nKey.ImageNotInstalledWarning` — for NOT_BUILT
- `ContainersI18nKey.ImageBuildFailedWarning` — for BUILD_FAILED

**Install flow: modal → install → navigate to image page**

1. Click "Install image" → opens `ImageInstall` modal (reused as-is)
2. Confirm → calls `installImage(image.id)` server action
3. On success → `router.push(getUrnForEntity(ApplicationRoute.Images, { id: image.id }))` to navigate to image detail page in same tab
4. On failure → show error notification via `showNotification(getErrorNotification(...))`

**Properties tab warning icon**

`propertiesTab()` in `utils/tabs/utils.ts` gains an optional `warning` parameter. `ContainerView.tsx` computes the flag from image status and passes it when building the tabs array. This follows the existing `firewallTab({ warning: allAllowed })` pattern.

**Disable Run button when image not installed**

`ContainersButtonsWrapper.tsx` receives the `image` prop. When image status is `NOT_BUILT` or `BUILD_FAILED` and the container is not in a running/pending/failed state, the Run button is disabled. Stop button remains available if the container is already running.

## Component Layout

```
TabsContent (Properties tab active)
├── DialAlert (variant=Warning, visible when imageNotInstalled)
│   └── message: ReactNode
│       ├── <span> warning text with bold image name/version
│       └── DialNeutralButton (iconBefore=IconBlocks, label="Install image")
│           └── onClick → open ImageInstall modal
├── ImageInstall modal (reused)
│   └── onApply → installImage() → router.push to image page
└── ... existing Properties tab content
```

## Risks / Trade-offs

- **Low risk**: Reuses existing components (`DialAlert`, `ImageInstall`, `DialNeutralButton`) and server actions (`installImage`)
- **Navigation away from container**: After installing, the user leaves the container page. This is intentional — they need to monitor the image build on the image page. They can navigate back via breadcrumbs.
- **No real-time status update**: If the image gets installed while the container page is open, the warning won't disappear until page refresh. This is acceptable since the install action navigates away anyway.
