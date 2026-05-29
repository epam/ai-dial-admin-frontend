## ADDED Requirements

### Requirement: ImageStatusBanner wrapper lives under Deployments/Common

A wrapper component SHALL live at `components/Deployments/Common/ImageStatusBanner/ImageStatusBanner.tsx`. It SHALL encapsulate the trigger logic, copy branching, and Install-image CTA for the image-not-installed warning previously implemented inline in `Containers/View/TabsContent.tsx`. The component SHALL render `<EntityBanner>` for its visual output and SHALL NOT render `DialNotification` directly.

#### Scenario: Component file exists at the expected path

- **WHEN** the project is searched for `ImageStatusBanner`
- **THEN** exactly one component file SHALL exist at `apps/ai-dial-admin/src/components/Deployments/Common/ImageStatusBanner/ImageStatusBanner.tsx`

### Requirement: Banner renders only when image is not installed

`ImageStatusBanner` SHALL accept a single prop `image?: Image`. The component SHALL render `null` when `image` is `undefined`, when `isImageNotInstalled(image)` returns `false`, or when `image.buildStatus` is anything other than `IMAGE_STATUS.NOT_BUILT` or `IMAGE_STATUS.BUILD_FAILED`. When `isImageNotInstalled(image)` returns `true`, the component SHALL render an `<EntityBanner>` (which renders a `DialNotification` with `variant === NotificationVariant.Warning`).

#### Scenario: NOT_BUILT image shows banner

- **WHEN** `<ImageStatusBanner image={{ buildStatus: IMAGE_STATUS.NOT_BUILT, ... }} />` is rendered
- **THEN** an `EntityBanner` SHALL be rendered with `variant === NotificationVariant.Warning`

#### Scenario: BUILD_FAILED image shows banner

- **WHEN** `<ImageStatusBanner image={{ buildStatus: IMAGE_STATUS.BUILD_FAILED, ... }} />` is rendered
- **THEN** an `EntityBanner` SHALL be rendered with `variant === NotificationVariant.Warning`

#### Scenario: BUILT image hides banner

- **WHEN** `<ImageStatusBanner image={{ buildStatus: IMAGE_STATUS.BUILT, ... }} />` is rendered
- **THEN** the component SHALL render `null`

#### Scenario: BUILDING image hides banner

- **WHEN** `<ImageStatusBanner image={{ buildStatus: IMAGE_STATUS.BUILDING, ... }} />` is rendered
- **THEN** the component SHALL render `null`

#### Scenario: Missing image hides banner

- **WHEN** `<ImageStatusBanner image={undefined} />` is rendered
- **THEN** the component SHALL render `null`

### Requirement: Banner copy branches on image build status

When `image.buildStatus === IMAGE_STATUS.BUILD_FAILED`, the banner's message SHALL come from `t(ContainersI18nKey.ImageBuildFailedWarning, { imageName: image.name ?? '', imageVersion: image.version })`. Otherwise (i.e. `NOT_BUILT`), the message SHALL come from `t(ContainersI18nKey.ImageNotInstalledWarning, { imageName: image.name ?? '', imageVersion: image.version })`. No bold `title` SHALL be passed to `EntityBanner` (the existing inline banner has no bold prefix and that visual SHALL be preserved).

#### Scenario: BUILD_FAILED uses ImageBuildFailedWarning key

- **WHEN** `<ImageStatusBanner image={{ buildStatus: BUILD_FAILED, name: 'foo', version: '1.0' }} />` is rendered
- **THEN** the `EntityBanner` SHALL receive a `message` produced by `t(ContainersI18nKey.ImageBuildFailedWarning, { imageName: 'foo', imageVersion: '1.0' })`

#### Scenario: NOT_BUILT uses ImageNotInstalledWarning key

- **WHEN** `<ImageStatusBanner image={{ buildStatus: NOT_BUILT, name: 'foo', version: '1.0' }} />` is rendered
- **THEN** the `EntityBanner` SHALL receive a `message` produced by `t(ContainersI18nKey.ImageNotInstalledWarning, { imageName: 'foo', imageVersion: '1.0' })`

#### Scenario: No bold title is passed

- **WHEN** the banner is rendered for any image-not-installed state
- **THEN** the `EntityBanner` SHALL receive `title === undefined` (or omit the prop)

### Requirement: Install-image CTA respects read-only-admin

When the banner is rendered, `ImageStatusBanner` SHALL pass a `DialNeutralButton` as `EntityBanner` children labelled `t(ContainersI18nKey.InstallImage)` with `IconBlocks` (size 12) as the icon. The button SHALL only be rendered when `useIsReadOnlyAdmin()` returns `false`. Clicking the button SHALL open the existing `ImageInstall` confirmation modal (using the same flow as the previous inline implementation: portal-mounted on `document.body`). On confirm, the existing `installImage(image.id)` server action SHALL be invoked and the user SHALL be navigated to the image's detail page on success; on failure an error notification SHALL be shown — preserving the current behavior.

#### Scenario: Read-only admin sees no Install button

- **WHEN** `useIsReadOnlyAdmin()` returns `true` and the banner is rendered
- **THEN** no `DialNeutralButton` SHALL be rendered as a child of `EntityBanner`

#### Scenario: Non-read-only admin sees Install button

- **WHEN** `useIsReadOnlyAdmin()` returns `false` and the banner is rendered
- **THEN** a `DialNeutralButton` with label `t(ContainersI18nKey.InstallImage)` and `IconBlocks` icon SHALL be rendered

#### Scenario: Install confirmation flow is preserved

- **WHEN** the user clicks the Install-image button and confirms in the `ImageInstall` modal
- **THEN** `installImage(image.id)` SHALL be called
- **AND** on success the user SHALL be navigated to the image detail page via `router.push(getUrnForEntity(ApplicationRoute.Images, { id: image.id }))`
- **AND** on failure an error notification SHALL be shown via `showNotification(getErrorNotification(...))`

### Requirement: Banner is rendered only on the Container view's Properties tab

`Containers/View/TabsContent.tsx` SHALL render `<ImageStatusBanner image={image} />` inside the `activeTab === EntityViewTab.Properties` branch only, positioned **above** `<PropertiesTabContent>` (which is the component that renders `EntityInfoHeader`). The previous inline `DialNotification` implementation SHALL be removed.

#### Scenario: ImageStatusBanner appears in Properties branch only

- **WHEN** `Containers/View/TabsContent.tsx` is read
- **THEN** `<ImageStatusBanner>` SHALL appear inside the `activeTab === EntityViewTab.Properties` block
- **AND** SHALL appear before `<PropertiesTabContent>` in DOM order

#### Scenario: Other tabs do not render ImageStatusBanner

- **WHEN** the active tab is any value other than `EntityViewTab.Properties` (Tools, Resources, Prompts, Metrics, ExecutionLog, Events, Firewall)
- **THEN** `<ImageStatusBanner>` SHALL NOT be rendered

#### Scenario: Inline DialNotification is removed from TabsContent

- **WHEN** `Containers/View/TabsContent.tsx` is read after the change
- **THEN** the file SHALL NOT contain a direct `DialNotification` import or render related to image-not-installed
- **AND** SHALL NOT contain the previous custom CSS overrides (`[&>div]:flex-1 [&>div>div:last-child]:w-full`) for the image-not-installed alert
