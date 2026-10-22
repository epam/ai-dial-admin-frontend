## MODIFIED Requirements

### Requirement: ContainerStatusBanner delegates rendering to EntityBanner

`ContainerStatusBanner.tsx` SHALL retain its existing data-fetch logic (resolving the container client-side via the route-specific `getContainersByView(view)` dispatcher), trigger conditions, and props (`view`, `containerId`). It SHALL replace its local `DialNotification` markup with a render of the shared `<EntityBanner>` component, passing the existing title (`t(ContainersI18nKey.ContainerNotRunningTitle, ...)`), description (`t(ContainersI18nKey.ContainerNotRunningDescription, ...)`), `className="mb-6"` (preserving current spacing), and the existing `Go to Container` `OutlinedButton` as `EntityBanner` children. `ContainerStatusBanner` SHALL NOT import `DialNotification` directly.

#### Scenario: ContainerStatusBanner imports EntityBanner

- **WHEN** `ContainerStatusBanner.tsx` is read after the change
- **THEN** it SHALL import `EntityBanner` from `@/src/components/Deployments/Common/EntityBanner/EntityBanner`
- **AND** SHALL NOT import `DialNotification` from `@epam/ai-dial-ui-kit`

#### Scenario: Title, description, and CTA are forwarded to EntityBanner

- **WHEN** the banner renders for a non-running container
- **THEN** `EntityBanner` SHALL receive `title === t(ContainersI18nKey.ContainerNotRunningTitle, { type, typeLower })`
- **AND** `EntityBanner` SHALL receive `message === t(ContainersI18nKey.ContainerNotRunningDescription, { typeLower })`
- **AND** `EntityBanner` children SHALL include a `OutlinedButton` with `label === t(ContainersI18nKey.GoToContainer)` whose click invokes `onOpenInNewTab(getContainerRoute(view), { name: containerId })`
