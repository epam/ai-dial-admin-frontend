## 1. Model & Constants

- [x] 1.1 Add `mcpEndpointPath?: string` to `SOURCE_FIELD` in `src/components/SourceField/types.ts`
- [x] 1.2 Add `{ value: SOURCE_TYPE.CONTAINER, label: 'Application Container' }` to `APPLICATION_SOURCE_ITEMS` in `src/components/SourceField/constants.ts`
- [x] 1.3 Extend `getContainerRoute` in `src/components/SourceField/utils.ts` to return `ApplicationRoute.ApplicationContainers` for `ApplicationRoute.Applications`

## 2. ApplicationEndpoint — prefix mode

- [x] 2.1 Add `prefix?: string` prop to `ApplicationEndpoint.tsx` Props interface
- [x] 2.2 When `prefix` is present: lock chat checkbox (`checked={true}`, `disabled={true}`); keep MCP checkbox interactive
- [x] 2.3 When `prefix` is present: render path inputs (not full-URL inputs) for chat and MCP, displaying `prefix` as a read-only label alongside each input
- [x] 2.4 When `prefix` is present: on chat path change write to `entity.source.completionEndpointPath` (not `entity.endpoint`)
- [x] 2.5 When `prefix` is present: on MCP path change write to `entity.source.mcpEndpointPath` (not `entity.mcp.endpoint`); MCP transport/config still writes to `entity.mcp.*`
- [x] 2.6 When `prefix` is present and MCP is unchecked: set `entity.source.mcpEndpointPath = null` and `entity.mcp = undefined`

## 3. Containers — DialApplication support

- [x] 3.1 Widen generic constraint in `Containers.tsx` from `<T extends DialInterceptor | DialModel>` to include `DialApplication`
- [x] 3.2 In `onSelect`: add Application branch — write only `source.containerId` and `source.containerName`, skip auto-`completionEndpointPath` logic
- [x] 3.3 After container selection: render `ApplicationEndpoint` with `prefix={selectedContainer.url}` when entity is `DialApplication`; keep existing `Endpoints` sub-component for all other entity types
- [x] 3.4 Store selected container object in state so its `url` is available for the `prefix` prop after selection

## 4. Wiring — SourceField callers

- [x] 4.1 Pass `getContainers={getApplicationContainers}` to `SourceField` in `src/components/Applications/View/Properties/Properties.tsx`
- [x] 4.2 Pass `getContainers={getApplicationContainers}` to `SourceField` in `src/components/EntityMainProperties/Properties/DeploymentProperties.tsx` for the Applications branch

## 5. Create Application shortcut

- [x] 5.1 Add "Create Application" action to `HeaderButtons.tsx` in the Application Containers list (`src/components/Containers/List/HeaderButtons.tsx`) that navigates to the Application create route with `initialValues = { source: { $type: SOURCE_TYPE.CONTAINER, containerId, containerName } }`

## 6. Tests

- [x] 6.1 Update `ApplicationEndpoint.spec.tsx`: add tests for `prefix` mode — chat checkbox locked, MCP checkbox interactive, path writes to `source.*`, MCP off clears `entity.mcp`
- [x] 6.2 Add `Containers.spec.tsx` (or extend existing) with Application branch test: container selection writes `source.containerId`, renders `ApplicationEndpoint` with correct `prefix`
- [x] 6.3 Update `SourceField.spec.tsx`: add test that switching to/from CONTAINER clears Application-specific fields (`mcp`, `viewerUrl`, `editorUrl`, `applicationTypeSchemaId`, `applicationProperties`)

## 7. Validation

- [x] 7.1 Run `npm run lint && npm run format && npm run test && npm run build` from the repo root; fix any failures
