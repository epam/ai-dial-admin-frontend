## MODIFIED Requirements

### Requirement: Banner renders "Go to Container" navigation button

The banner SHALL include a button labelled `t(ContainersI18nKey.GoToContainer)` ("Go to Container") rendered as a child of `Notification`. Clicking the button SHALL open the container's detail page in a new tab via `onOpenInNewTab(getContainerRoute(view), { name: containerId })`, where `containerId` is the prop received from the parent View.

#### Scenario: Go to Container opens container detail for Models

- **WHEN** the banner is rendered on `/[lang]/models/[id]` and the user clicks the "Go to Container" button
- **THEN** `onOpenInNewTab` SHALL be called with `ApplicationRoute.ModelServings` and `{ name: <containerId> }`

#### Scenario: Go to Container opens container detail for Applications

- **WHEN** the banner is rendered on `/[lang]/applications/[id]` and the user clicks "Go to Container"
- **THEN** `onOpenInNewTab` SHALL be called with `ApplicationRoute.ApplicationContainers` and `{ name: <containerId> }`

#### Scenario: Go to Container opens container detail for Interceptors

- **WHEN** the banner is rendered on `/[lang]/interceptors/[id]` and the user clicks "Go to Container"
- **THEN** `onOpenInNewTab` SHALL be called with `ApplicationRoute.InterceptorContainers` and `{ name: <containerId> }`

#### Scenario: Go to Container opens container detail for Toolsets

- **WHEN** the banner is rendered on `/[lang]/toolsets/[id]` and the user clicks "Go to Container"
- **THEN** `onOpenInNewTab` SHALL be called with `ApplicationRoute.McpContainers` and `{ name: <containerId> }`

### Requirement: ContainerStatusBanner delegates rendering to EntityBanner

`ContainerStatusBanner.tsx` SHALL retain its existing data-fetch logic (resolving the container client-side via the route-specific `getContainersByView(view)` dispatcher), trigger conditions, and props (`view`, `containerId`). It SHALL replace its local `Notification` markup with a render of the shared `<EntityBanner>` component, passing the existing title (`t(ContainersI18nKey.ContainerNotRunningTitle, ...)`), description (`t(ContainersI18nKey.ContainerNotRunningDescription, ...)`), `className="mb-6"` (preserving current spacing), and the existing `Go to Container` `OutlinedButton` as `EntityBanner` children. `ContainerStatusBanner` SHALL NOT import `Notification` directly.

#### Scenario: ContainerStatusBanner imports EntityBanner

- **WHEN** `ContainerStatusBanner.tsx` is read after the change
- **THEN** it SHALL import `EntityBanner` from `@/src/components/Deployments/Common/EntityBanner/EntityBanner`
- **AND** SHALL NOT import `Notification` from `@epam/ai-dial-ui-kit`

#### Scenario: Title, description, and CTA are forwarded to EntityBanner

- **WHEN** the banner renders for a non-running container
- **THEN** `EntityBanner` SHALL receive `title === t(ContainersI18nKey.ContainerNotRunningTitle, { type, typeLower })`
- **AND** `EntityBanner` SHALL receive `message === t(ContainersI18nKey.ContainerNotRunningDescription, { typeLower })`
- **AND** `EntityBanner` children SHALL include a `OutlinedButton` with `label === t(ContainersI18nKey.GoToContainer)` whose click invokes `onOpenInNewTab(getContainerRoute(view), { name: containerId })`

