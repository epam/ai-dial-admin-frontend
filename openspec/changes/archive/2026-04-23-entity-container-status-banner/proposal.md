## Why

Entities whose `source.$type === CONTAINER` (Models, Applications, Toolsets, Interceptors) reference a container that can be in any of `running | pending | not_deployed | crashed | stopped | stopping`. When that container is not running, the entity becomes non-functional in the Chat interface — but today the entity's detail view gives no indication of this. The user only finds out when the consuming product fails to use the entity.

Issue #2943 adds a prominent warning on the entity's detail view whenever its container is in any non-running state, plus a jump-link to the container page so the user can take action.

## What Changes

- **Add** a new reusable component `<ContainerStatusBanner view={route} entity={entity} />` at `apps/ai-dial-admin/src/components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner.tsx`.
  - Fetches the container list client-side via `getContainersByView(view)` (a thin dispatcher that picks between `getModelContainers` / `getApplicationContainers` / `getMCPContainers`).
  - Derives the currently-selected container from `entity.source?.containerId`.
  - Renders `<DialAlert variant={AlertVariant.Warning}>` with a parametrized message and a "Go to Container" button when the selected container is found and its status is not `running`.
  - The button opens the container view via `onOpenInNewTab(getContainerRoute(view), { name: containerId })` — reusing the same navigation the existing "Open" button on the Container field uses.
  - Returns `null` in all other cases (source is not a container, no `containerId`, container not found/deleted, status is `running`, still loading).
- **Render** `<ContainerStatusBanner>` in each of the four entity View components, placed **below the tabs bar** and **above the tab content**:
  - `components/Models/View/View.tsx`
  - `components/Applications/View/View.tsx`
  - `components/Toolsets/View/View.tsx`
  - `components/Interceptors/View/View.tsx`
- **Add** a small dispatcher `getContainersByView(view)` appended to `utils/deployments/containers.ts` (alongside existing container helpers like `getContainerSourceTypeLabel`) that maps `ApplicationRoute` to the right server action: `getModelContainers` for Models, `getApplicationContainers` for Applications, `getMCPContainers` for Toolsets, `getInterceptorContainers` for Interceptors. This matches what the existing source-field wiring already does (`DeploymentProperties.tsx:171,191`, `EntityProperties.tsx:80`).
- **i18n**:
  - Add `ContainerNotRunningTitle`, `ContainerNotRunningDescription`, `GoToContainer` to `ContainersI18nKey` in `constants/i18n.ts`.
  - Title is parametrized with `{type}` → resolved by mapping the entity route to its container route via `getContainerRoute(view)` and then calling `getTranslatedEntity(containerRoute, t)` (produces "Model" / "Application" / "Toolset" / "Interceptor"). `getTranslatedEntity` is the existing helper in `utils/deployments/entity.ts`; we don't use `getTranslatedType` because that returns "MCP" for Toolset routes.
  - Description references "Chat interface" and is shared verbatim across all four entities.
  - Button label "Go to Container".

## Non-goals

- **Not covering the "container deleted" case** — if `containerId` is set but the container is not in the `getContainers` response, no banner is shown. Handling the deleted case requires either backend changes or a separate "get by id" endpoint call and is deferred.
- **Not adding a warning triangle next to the Container field's value.** The mockup shows an amber ⚠ icon next to the selected container name; `DialInputPopup` only supports `errorText`/`invalid` (not warning styling). This visual detail is dropped from scope; the top banner alone is sufficient signal.
- **Not adding the "Selected container is not running or has been deleted." helper text below the Container field.** Same rationale — keeping the banner as the single surface for this information.
- **Not adding polling or live status refresh.** The banner reflects the status at page-load time; the user refreshes to re-check. Container status does not flip mid-edit in practice.
- **Not refactoring `SourceField/Containers/Containers.tsx`** — it keeps its existing internal fetch. The banner issues its own independent fetch. Two requests per page load is acceptable given these are lightweight list calls (confirmed acceptable in discovery).
- **Not introducing a `ContainersContext` / lifting the fetch to `page.tsx`.** Context-based sharing was considered but rejected in favor of the two-independent-fetches approach to minimize blast radius.

## Capabilities

### New Capabilities

- `entity-container-status-banner`: Defines the in-page warning shown on Models, Applications, Toolsets, and Interceptors detail views when the entity's source container is not in the `running` state, and the "Go to Container" navigation that accompanies it.

### Modified Capabilities

_(none — this is a new additive behavior; the existing `Containers` source field component keeps its current contract.)_

## Impact

- **Components**:
  - **New**: `components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner.tsx`
  - **New**: `components/Deployments/Common/ContainerStatusBanner/tests/ContainerStatusBanner.spec.tsx`
  - **Modified**: `utils/deployments/containers.ts` — append `getContainersByView` dispatcher
  - **Modified**: `utils/deployments/tests/containers.spec.ts` — append dispatcher tests
  - **Modified**: `components/Models/View/View.tsx`
  - **Modified**: `components/Applications/View/View.tsx`
  - **Modified**: `components/Toolsets/View/View.tsx`
  - **Modified**: `components/Interceptors/View/View.tsx`
- **i18n**:
  - `constants/i18n.ts` — three new entries under `ContainersI18nKey`.
  - `locales/en.ts` — three new strings under the `Containers` namespace.
- **Tests**:
  - Unit-test the banner's rendering logic across all trigger conditions (source type, containerId presence, container presence/absence in list, each non-running status, loading state).
  - Light smoke tests on each View ensuring the banner is rendered — the shared component is where behavior is verified.
- **Routes affected (visible change)**: `/[lang]/models/[id]`, `/[lang]/applications/[id]`, `/[lang]/toolsets/[id]`, `/[lang]/interceptors/[id]`.
- **No backend / API / server-action changes** — reuses existing `getModelContainers`, `getApplicationContainers`, `getMCPContainers`, `getInterceptorContainers`.
