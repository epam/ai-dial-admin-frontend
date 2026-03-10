## 1. Types and Utils

- [x] 1.1 Add `createMcpDockerImage` to `ModalType` enum in `src/components/EntityListView/Components/Modals.tsx`
- [x] 1.2 Add optional `sourceType` parameter to `getContainerTemplate` in `src/utils/deployments/containers.ts`. When `sourceType === IMAGE_REFERENCE` and `type === MCP`, return MCP template with `{ $type: IMAGE_REFERENCE, imageReference: '' }` source
- [x] 1.3 Add i18n keys for MCP dropdown labels ("From Internal MCP Image", "From Docker Image Reference") in the appropriate i18n constants file

## 2. ContainerSource Component

- [x] 2.1 Extend `ContainerSource` (`src/components/Deployments/Fields/ContainerSource.tsx`) to handle `IMAGE_REFERENCE` source type — render a `DialInput` for Docker image reference with URI validation, storing value in `container.source.imageReference`

## 3. ContainerFields Component

- [x] 3.1 Update `ContainerFields` (`src/components/Containers/Fields/ContainerFields.tsx`) to show `ContainerSource` when route is `ModelServings` OR `container.source?.$type === IMAGE_REFERENCE`

## 4. ServingCreate Modal

- [x] 4.1 Add optional `sourceType?: CONTAINER_SOURCE_TYPE` prop to `ServingCreate` (`src/components/Deployments/Modals/ServingCreate.tsx`). Pass it to `getContainerTemplate` when initializing container state

## 5. HeaderButtons — MCP Dropdown

- [x] 5.1 Update `HeaderButtons` (`src/components/Containers/List/HeaderButtons.tsx`) to render `DialButtonDropdown` for `ApplicationRoute.McpContainers` with two options: "From Internal MCP Image" (opens `ContainerCreate`) and "From Docker Image Reference" (opens `ServingCreate` with `type=MCP`, `sourceType=IMAGE_REFERENCE`)
- [x] 5.2 Add the `ServingCreate` modal portal rendering for `ModalType.createMcpDockerImage` in `HeaderButtons`

## 6. Tests

- [x] 6.1 Update `getContainerTemplate` unit tests in `src/utils/deployments/tests/containers.spec.ts` to cover `sourceType=IMAGE_REFERENCE` for MCP
- [x] 6.2 Add or update component tests for `ContainerSource` to verify `IMAGE_REFERENCE` branch renders Docker reference input

## 7. Quality Checks

- [x] 7.1 Run lint, format, and all tests (`nx lint ai-dial-admin`, `nx test ai-dial-admin`) to verify no regressions
