## Why

Applications can already be backed by ENDPOINTS (direct URLs) or SCHEMA (app runner), but not by a deployment container — even though Application Containers exist as a first-class entity type. The `unify-application-with-source-field` change explicitly deferred CONTAINER support for Applications pending BE verification; that verification is now complete and the contract is confirmed.

## What Changes

- `SOURCE_FIELD` gains `mcpEndpointPath?: string` to carry the BE field `ApplicationContainerSourceDto.mcpEndpointPath`
- `APPLICATION_SOURCE_ITEMS` gains a third option: `CONTAINER` → "Application Container"
- `ApplicationEndpoint.tsx` extended with a `prefix?: string` prop. When `prefix` is present (CONTAINER mode): chat checkbox is locked on (disabled), MCP checkbox remains interactive, inputs become path fields prefixed by the container URL, writes go to `source.completionEndpointPath` / `source.mcpEndpointPath` + `entity.mcp` transport config. When `prefix` is absent, existing ENDPOINTS behaviour is unchanged.
- `Containers.tsx` extended to support `DialApplication` (generic constraint widened). After container selection it renders `ApplicationEndpoint` with `prefix={container.url}` for Applications, and the existing `Endpoints` sub-component for all other entity types. `onSelect` for Applications writes only `source.containerId` / `source.containerName` (no auto-path logic).
- `SourceField.tsx` CONTAINER branch unchanged — already renders `Containers`; only needs `getApplicationContainers` wired in for Applications.
- `getContainerRoute` extended: `ApplicationRoute.Applications → ApplicationRoute.ApplicationContainers`
- `getApplicationContainers` wired into both Applications SourceField usages (create form and view form)
- New "Create Application" action in Application Containers list (`HeaderButtons`), navigating to the create form with `initialValues = { source: { $type: CONTAINER, containerId } }` so the source picker is hidden

## Capabilities

### New Capabilities

- `application-container-source`: DialApplication backed by an Application Container — container selector in `Containers.tsx`, chat-path (locked on) and MCP-path (optional) inputs via extended `ApplicationEndpoint.tsx`, container URL as prefix display, MCP transport/config section, navigation from the container list to create an application

### Modified Capabilities

- `application-source`: lifts the explicit restriction that barred CONTAINER from `APPLICATION_SOURCE_ITEMS`; aligns the spec with the finalized three-option dropdown (ENDPOINTS, SCHEMA, CONTAINER)

## Non-goals

- No changes to AssetApp, ENDPOINTS branch, or SCHEMA branch
- No BE model changes (contract already supports this)
- Validation unchanged — `!!source.containerId` already covers CONTAINER for all entity types

## Impact

- `src/components/SourceField/types.ts` — add `mcpEndpointPath?: string`
- `src/components/SourceField/constants.ts` — add CONTAINER to APPLICATION_SOURCE_ITEMS
- `src/components/SourceField/Endpoints/ApplicationEndpoint.tsx` — add `prefix?: string` prop and dual-mode rendering
- `src/components/SourceField/Containers/Containers.tsx` — widen generic, add Application branch in sub-component render and `onSelect`
- `src/components/SourceField/utils.ts` — extend `getContainerRoute` for Applications
- `src/components/Applications/View/Properties/Properties.tsx` — pass `getContainers={getApplicationContainers}`
- `src/components/EntityMainProperties/Properties/DeploymentProperties.tsx` — pass `getContainers={getApplicationContainers}` for Applications
- `src/components/Containers/List/HeaderButtons.tsx` (ApplicationContainers) — new "Create Application" action
- No new component files; no BE changes; no AssetApp changes
