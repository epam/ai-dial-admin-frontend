## MODIFIED Requirements

### Requirement: Install-image CTA respects read-only-admin

When the banner is rendered, `ImageStatusBanner` SHALL pass a `OutlinedButton` as `EntityBanner` children labelled `t(ContainersI18nKey.InstallImage)` with `IconBlocks` (size 12) as the icon. The button SHALL only be rendered when `useIsReadOnlyAdmin()` returns `false`. Clicking the button SHALL open the existing `ImageInstall` confirmation modal (using the same flow as the previous inline implementation: portal-mounted on `document.body`). On confirm, the existing `installImage(image.id)` server action SHALL be invoked and the user SHALL be navigated to the image's detail page on success; on failure an error notification SHALL be shown — preserving the current behavior.

#### Scenario: Read-only admin sees no Install button

- **WHEN** `useIsReadOnlyAdmin()` returns `true` and the banner is rendered
- **THEN** no `OutlinedButton` SHALL be rendered as a child of `EntityBanner`

#### Scenario: Non-read-only admin sees Install button

- **WHEN** `useIsReadOnlyAdmin()` returns `false` and the banner is rendered
- **THEN** a `OutlinedButton` with label `t(ContainersI18nKey.InstallImage)` and `IconBlocks` icon SHALL be rendered

#### Scenario: Install confirmation flow is preserved

- **WHEN** the user clicks the Install-image button and confirms in the `ImageInstall` modal
- **THEN** `installImage(image.id)` SHALL be called
- **AND** on success the user SHALL be navigated to the image detail page via `router.push(getUrnForEntity(ApplicationRoute.Images, { id: image.id }))`
- **AND** on failure an error notification SHALL be shown via `showNotification(getErrorNotification(...))`
