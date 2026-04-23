## ADDED Requirements

### Requirement: Warning banner shown when entity source container is not running

Entity detail views for Models, Applications, Toolsets, and Interceptors SHALL render a top-of-view warning banner whenever the **saved (original)** entity's source is a container (`originalEntity.source?.$type === SOURCE_TYPE.CONTAINER`) and the referenced container exists in the container list and has a status other than `CONTAINER_STATUS.RUNNING`. Each View SHALL gate the render on `originalEntity.source?.$type === SOURCE_TYPE.CONTAINER && originalEntity.source?.containerId` and pass only the resolved `containerId` into a shared `<ContainerStatusBanner view={route} containerId={id} />` component, which is placed below the tabs bar and above the tab content. Using the saved baseline (not the mid-edit selection) is safe because the Container source field only allows selecting running containers — a freshly chosen selection is never a candidate for this banner.

#### Scenario: Model with stopped container shows banner

- **WHEN** a user opens `/[lang]/models/[id]` for a model whose `source.$type === 'container'`, `source.containerId === 'ykchattest'`, and the container with `name === 'ykchattest'` has `status === 'stopped'`
- **THEN** the detail view SHALL render a `DialAlert` with `variant === AlertVariant.Warning` positioned between the tabs bar and the tab content

#### Scenario: Application with crashed container shows banner

- **WHEN** a user opens `/[lang]/applications/[id]` for an application whose source container has `status === 'crashed'`
- **THEN** the detail view SHALL render the warning banner

#### Scenario: Toolset with non-running MCP container shows banner

- **WHEN** a user opens `/[lang]/toolsets/[id]` for a toolset whose source container has `status === 'pending'`
- **THEN** the detail view SHALL render the warning banner

#### Scenario: Interceptor with non-running container shows banner

- **WHEN** a user opens `/[lang]/interceptors/[id]` for an interceptor whose source container has `status === 'not_deployed'`
- **THEN** the detail view SHALL render the warning banner

#### Scenario: Banner triggers for every non-running status

- **WHEN** the selected container's status is any of `pending`, `not_deployed`, `crashed`, `stopped`, or `stopping`
- **THEN** the banner SHALL be rendered

#### Scenario: Running container does not trigger banner

- **WHEN** the selected container's status is `running`
- **THEN** the banner SHALL NOT be rendered

### Requirement: Banner is suppressed for non-container sources

Each entity View SHALL gate the banner render on `originalEntity.source?.$type === SOURCE_TYPE.CONTAINER`. When the source type is anything else, the `<ContainerStatusBanner>` component SHALL NOT be rendered at all (the check lives in the View, not inside the component).

#### Scenario: Model with endpoints source shows no banner

- **WHEN** a model has `source.$type === 'endpoints'`
- **THEN** no warning banner SHALL be rendered regardless of any container's status

#### Scenario: Application with runner source shows no banner

- **WHEN** an application has `source.$type === 'runner'`
- **THEN** no warning banner SHALL be rendered

### Requirement: Banner is suppressed when no container is selected

Each entity View SHALL gate the banner render on a truthy `originalEntity.source?.containerId`. When the saved entity has a container source type but no `containerId`, the `<ContainerStatusBanner>` component SHALL NOT be rendered.

#### Scenario: Container source with no containerId selected

- **WHEN** an entity has `source.$type === 'container'` and `source.containerId` is empty
- **THEN** no banner SHALL be rendered

### Requirement: Deleted / missing container does not trigger banner

When the banner is rendered (i.e., the View's gates pass) but the `containerId` is not present in the fetched container list, the component SHALL render `null`.

#### Scenario: Referenced container not in response

- **WHEN** an entity has `source.containerId === 'some-deleted-id'` and that id is not present in the fetched container list
- **THEN** no banner SHALL be rendered

### Requirement: Banner renders "Go to Container" navigation button

The banner SHALL include a button labelled `t(ContainersI18nKey.GoToContainer)` ("Go to Container") rendered as a child of `DialAlert`. Clicking the button SHALL open the container's detail page in a new tab via `onOpenInNewTab(getContainerRoute(view), { name: containerId })`, where `containerId` is the prop received from the parent View.

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

### Requirement: Banner copy is parametrized by entity type

The banner's title SHALL be sourced from `t(ContainersI18nKey.ContainerNotRunningTitle, { type, typeLower })` and its description from `t(ContainersI18nKey.ContainerNotRunningDescription, { typeLower })`. `type` SHALL be resolved via `getTranslatedEntity(getContainerRoute(view), t)` (returning `"Model"`, `"Application"`, `"Toolset"`, or `"Interceptor"` depending on route) and `typeLower` SHALL be its lowercase form.

#### Scenario: Title uses Model substitution on Models view

- **WHEN** the banner renders on `/[lang]/models/[id]`
- **THEN** the title SHALL interpolate `{type} === 'Model'` and `{typeLower} === 'model'`

#### Scenario: Title uses Application substitution on Applications view

- **WHEN** the banner renders on `/[lang]/applications/[id]`
- **THEN** the title SHALL interpolate `{type} === 'Application'`

#### Scenario: Title uses Toolset substitution on Toolsets view

- **WHEN** the banner renders on `/[lang]/toolsets/[id]`
- **THEN** the title SHALL interpolate `{type} === 'Toolset'`

#### Scenario: Title uses Interceptor substitution on Interceptors view

- **WHEN** the banner renders on `/[lang]/interceptors/[id]`
- **THEN** the title SHALL interpolate `{type} === 'Interceptor'`

### Requirement: Banner fetches the target container client-side on mount

`<ContainerStatusBanner>` SHALL fetch the container list for the given `view` client-side on mount via a dispatcher `getContainersByView(view)` (exported from `utils/deployments/containers.ts`) that resolves to `getModelContainers` / `getApplicationContainers` / `getMCPContainers` / `getInterceptorContainers` based on the route. The component SHALL resolve the target container (`containers.find(c => c.name === containerId)`) inside the fetch callback and store only that one container (or `null`) in component state — the full list SHALL NOT be kept in state. State type SHALL be `Container | null` initialised to `null`; both the "loading" and "not found" cases are represented by `null` because both result in the component rendering nothing. The component SHALL NOT share a cache or context with `SourceField/Containers/Containers.tsx` — the two fetches are independent.

#### Scenario: Models view uses getModelContainers

- **WHEN** `<ContainerStatusBanner view={ApplicationRoute.Models} .../>` mounts
- **THEN** the component SHALL invoke `getModelContainers`

#### Scenario: Applications view uses getApplicationContainers

- **WHEN** `<ContainerStatusBanner view={ApplicationRoute.Applications} .../>` mounts
- **THEN** the component SHALL invoke `getApplicationContainers`

#### Scenario: Toolsets view uses getMCPContainers

- **WHEN** `<ContainerStatusBanner view={ApplicationRoute.Toolsets} .../>` mounts
- **THEN** the component SHALL invoke `getMCPContainers`

#### Scenario: Interceptors view uses getInterceptorContainers

- **WHEN** `<ContainerStatusBanner view={ApplicationRoute.Interceptors} .../>` mounts
- **THEN** the component SHALL invoke `getInterceptorContainers`

### Requirement: Banner handles loading and fetch errors gracefully

While the container list fetch is in flight, `<ContainerStatusBanner>` SHALL render `null` (its state is `Container | null` and starts as `null`). If the fetch fails, the component SHALL render `null` and SHALL NOT call `showNotification` (since `SourceField/Containers/Containers.tsx` already owns the user-visible error path for the same endpoint).

#### Scenario: Banner renders null during loading

- **WHEN** the container fetch is in flight
- **THEN** the banner SHALL render `null`

#### Scenario: Fetch failure does not produce a toast

- **WHEN** the container fetch rejects
- **THEN** the banner SHALL render `null`
- **AND** `showNotification` SHALL NOT be called by the banner component

### Requirement: Banner is placed below tabs and above tab content

Each of the four entity Views (`Models/View/View.tsx`, `Applications/View/View.tsx`, `Toolsets/View/View.tsx`, `Interceptors/View/View.tsx`) SHALL render `<ContainerStatusBanner>` as a sibling between the tab-bar header component (`SimpleEntityHeader`) and the scroll container wrapping the tab content.

#### Scenario: Models view places banner between header and content

- **WHEN** the Models detail view renders and the banner's trigger conditions are met
- **THEN** the `DialAlert` SHALL appear in the DOM after the tab-bar header and before the tab-content scroll container

#### Scenario: Applications view places banner between header and content

- **WHEN** the Applications detail view renders and the banner's trigger conditions are met
- **THEN** the `DialAlert` SHALL appear in the DOM after the tab-bar header and before the tab-content scroll container

#### Scenario: Toolsets view places banner between header and content

- **WHEN** the Toolsets detail view renders and the banner's trigger conditions are met
- **THEN** the `DialAlert` SHALL appear in the DOM after the tab-bar header and before the tab-content scroll container

#### Scenario: Interceptors view places banner between header and content

- **WHEN** the Interceptors detail view renders and the banner's trigger conditions are met
- **THEN** the `DialAlert` SHALL appear in the DOM after the tab-bar header and before the tab-content scroll container
