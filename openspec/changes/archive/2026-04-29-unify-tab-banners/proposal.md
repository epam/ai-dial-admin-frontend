## Why

`ContainerStatusBanner` currently renders outside the tab-content scroll area on Models / Applications / Interceptors / Toolsets detail views. It eats permanent vertical space on every tab and never scrolls away even when the user is deep in another tab's content. Meanwhile, the image-not-installed banner on Container detail already has the desired behavior — it lives inside the Properties tab, above `EntityInfoHeader`, and scrolls with the tab content — but it is implemented as an inline `DialNotification` with custom CSS overrides, duplicating the visual pattern of `ContainerStatusBanner`. This change unifies the two banners onto one configurable component and relocates `ContainerStatusBanner` to match the image-banner placement so both behave the same way: visible only on the Properties tab, above `EntityInfoHeader`, scrolling with the tab.

## What Changes

- **New component**: `EntityBanner` at `components/Deployments/Common/EntityBanner/EntityBanner.tsx`. A thin configurable wrapper around `DialNotification` accepting `variant`, optional `title`, `message`, `className`, and `children` (CTA slot). It is the only place that constructs the `DialNotification` markup used by deployment-related warning banners.
- **New wrapper**: `ImageStatusBanner` at `components/Deployments/Common/ImageStatusBanner/ImageStatusBanner.tsx`. Encapsulates `isImageNotInstalled(image)`, the `BUILD_FAILED` vs `NOT_BUILT` text branching, and the `Install image` CTA (with the existing read-only-admin gate and install-modal flow). Delegates rendering to `<EntityBanner>`.
- **Refactor `ContainerStatusBanner`**: keep current data-fetch + trigger logic, replace the local `DialNotification` markup with `<EntityBanner>`.
- **Relocate `ContainerStatusBanner`**: remove its mount from `Applications/View/View.tsx`, `Models/View/View.tsx`, `Interceptors/View/View.tsx`, `Toolsets/View/View.tsx`. Re-mount it inside each view's `TabsContent.tsx`, in the Properties tab branch only, above `<PropertiesTabContent>`. The banner now appears only on the Properties tab and scrolls with tab content.
- **Extend coverage to Adapters**: wire `Adapter/View/TabsContent.tsx` Properties branch with the same `<ContainerStatusBanner>` mount, and register `ApplicationRoute.Adapters → getAdapterContainers` in the `getContainersByView` dispatcher (previously omitted intentionally).
- **Replace inline image-not-installed banner**: in `Containers/View/TabsContent.tsx` Properties branch, drop the inline `DialNotification` (and its custom `[&>div]` CSS overrides) in favor of `<ImageStatusBanner image={image} />` in the same position.
- **Tests**: update `ContainerStatusBanner.spec.tsx` to reflect the delegated render path; add specs for `EntityBanner` and `ImageStatusBanner`; update view-level tests that assert banner placement.

## Capabilities

### New Capabilities
- `deployment-banner`: Generic configurable banner component (variant, title, message, CTA slot) for deployment-related warnings. Lives under `Deployments/Common/` until additional non-deployment use cases emerge.
- `image-status-banner`: Wrapper surfacing image-not-installed / build-failed warnings on the Container view's Properties tab, with an `Install image` CTA respecting read-only-admin.

### Modified Capabilities
- `entity-container-status-banner`: Placement changes from "below tabs, above tab content (every tab)" to "inside Properties tab content, above `EntityInfoHeader` (Properties tab only)". Coverage extends to Adapters detail view. Internal rendering delegates to the new `EntityBanner`. Dispatcher resolves Adapters → `getAdapterContainers`.

## Non-goals

- Outer view layout, scroll boundaries, and `SimpleEntityHeader` are unchanged.
- No banner is introduced on the Image detail view.
- No changes to trigger conditions (which container statuses or image build statuses cause the banner to show).
- The generic banner is not promoted to a shared `Common/` location; it stays under `Deployments/Common/` until reuse outside deployments is needed.

## Impact

- **Components added**: `Deployments/Common/EntityBanner/EntityBanner.tsx`, `Deployments/Common/ImageStatusBanner/ImageStatusBanner.tsx`.
- **Components modified**:
  - `Deployments/Common/ContainerStatusBanner/ContainerStatusBanner.tsx` — delegate render to `<EntityBanner>`.
  - `Applications/View/View.tsx`, `Models/View/View.tsx`, `Interceptors/View/View.tsx`, `Toolsets/View/View.tsx` — remove banner mount.
  - `Applications/View/TabsContent.tsx`, `Models/View/TabsContent.tsx`, `Interceptors/View/TabsContent.tsx`, `Toolsets/View/TabsContent.tsx` — add banner mount in the Properties branch.
  - `Adapter/View/View.tsx` — pass `originalAdapter` to `TabsContent`.
  - `Adapter/View/TabsContent.tsx` — accept `originalAdapter` prop, add banner mount in Properties branch.
  - `utils/deployments/containers.ts` — extend `getContainersByView` to dispatch `ApplicationRoute.Adapters → getAdapterContainers`.
  - `Containers/View/TabsContent.tsx` — replace inline `DialNotification` with `<ImageStatusBanner>`.
- **Tests added/updated**: `EntityBanner.spec.tsx`, `ImageStatusBanner.spec.tsx`, `ContainerStatusBanner.spec.tsx`, and any view-level placement assertions.
- **i18n**: no new keys; existing `Containers.ImageNotInstalledWarning`, `Containers.ImageBuildFailedWarning`, `Containers.ContainerNotRunningTitle`, `Containers.ContainerNotRunningDescription`, `Containers.GoToContainer`, `Containers.InstallImage` are reused.
- **No backend, API, or routing changes.**
