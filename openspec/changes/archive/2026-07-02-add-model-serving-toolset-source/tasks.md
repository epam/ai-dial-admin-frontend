## 1. API layer — toolset container fetch

- [x] 1.1 Add `ContainersApi.getToolsetContainers(token)` in `server/deployments/containers.ts` calling `GET {API}/deployments?type=MCP,INFERENCE` (leave `getMCPContainers` unchanged)
- [x] 1.2 Add `getToolsetContainers()` server action in `app/actions/deployments.ts` (auth via `getUserToken`, mirroring `getMCPContainers`)
- [x] 1.3 Add/extend specs: `server/deployments/tests/containers.spec.ts` (called URL + token) and `app/actions/tests/deployments.spec.ts` (delegates to the API method with token)

## 2. Selector value + client filters

- [x] 2.1 Add `MODEL_SERVING_SOURCE_TYPE` FE-only selector const in `components/SourceField/constants.ts` (alongside the `CODE_APP_SOURCE_TYPE` precedent — a const, not a `SOURCE_TYPE` enum member, since it is not a backend `$type`)
- [x] 2.2 Add `isToolsetCapableContainer` (+ `isMcpContainer`, `isTextClassificationInferenceContainer`, `isContainerFamilySource`) in `components/SourceField/utils.ts`
- [x] 2.3 Add `getRouteForContainer(container, view)`: `mcp` → `McpContainers`, `inference`/`nim` → `ModelServings`, interceptor/adapter/application → their pages, unknown → falls back to view-based `getContainerRoute`
- [x] 2.4 Extend `components/SourceField/utils.spec.ts` for the new helpers (mcp, text-classification inference, text-generation inference, nim, missing/deleted container)

## 3. Source-type items + SourceField wiring

- [x] 3.1 Add the **Model Serving** item to `TOOLSET_SOURCE_ITEMS` (keep order: External Endpoint, MCP Container, Model Serving, MCP Registry); apply the `deploymentsEnabled` gate to it in `getSourceItems`
- [x] 3.2 Labels are hardcoded strings on the source items (existing convention, e.g. Models' "Model Serving") — no i18n key needed
- [x] 3.3 In `SourceField.tsx`, treat `SOURCE_TYPE.CONTAINER` and `MODEL_SERVING_SOURCE_TYPE` as a container family: render `<Containers>` for both; on select persist `source.$type = CONTAINER`; guard the `$type`-derived sync so a selected Model Serving item is not collapsed back to MCP Container
- [x] 3.4 ~~Resolve the displayed item for an existing container source by real type~~ — not needed: the toolset source picker is creation-only (`DeploymentProperties` renders it when `!initialValues`); existing toolsets show the source read-only

## 4. Containers picker — filter + navigation

- [x] 4.1 In `Containers.tsx`, filter the fetched running containers by an optional `containerFilter` prop (SourceField passes MCP vs Model Serving per selected item); non-toolset views keep prior behaviour
- [x] 4.2 Route the "Open" button by the selected container's real type (`getRouteForContainer`) rather than `getContainerRoute(view)`
- [x] 4.3 Wire `DeploymentProperties.tsx` to pass `getToolsetContainers` for the Toolsets view (was `getMCPContainers`); Models unchanged

## 5. Detail-page display + banner

- [x] 5.1 Point `getContainersByView(Toolsets)` at `getToolsetContainers` in `utils/deployments/containers.ts` so the banner can find a Model Serving source
- [x] 5.2 In `ContainerStatusBanner`, resolve the "Go to container" route AND the banner label from the found container's real type (`getRouteForContainer`) instead of `getContainerRoute(view)`
- [~] 5.3 **Dropped as infeasible in this layer.** `sourceTypeFormatter` (the grid source-type column) receives only `source` (`containerId`), not the container's `$type`, and a `valueFormatter` is synchronous — it cannot distinguish MCP from Model Serving without an async container lookup. The read-only grid label therefore stays "MCP Container". The user-facing distinction lives in the creation picker (correct option) and the type-correct "Go to container" navigation. See proposal Non-goals.

## 6. Tests

- [x] 6.1 `utils/deployments/tests/containers.spec.ts` — `getContainersByView(Toolsets)` now returns `getToolsetContainers`
- [x] 6.2 `Containers/tests/Containers.spec.tsx` — mixed MCP + inference list: MCP filter shows only mcp; Model Serving filter shows only text-classification inference
- [x] 6.3 `SourceField.spec.tsx` — toolset dropdown offers both items; selecting Model Serving persists `source.$type = CONTAINER`; renders the Containers branch
- [x] 6.4 `ContainerStatusBanner.spec.tsx` — Open button routes by container type (inference → Model Servings, mcp → MCP Containers, including a Model Serving toolset source)

## 7. Verification

- [x] 7.1 Run the targeted specs from §1–§6 via `vitest run` (from `apps/ai-dial-admin/`) — 539 passed across 30 files
- [x] 7.2 Live browser verification via spec-verification-gate (container list mocked, DM not connected locally) — **green, 4/4**: source-type offers both MCP Container + Model Serving; Model Serving lists only the text-classification container; MCP Container lists only the mcp container; the selected Model Serving container displays correctly. End-to-end creation still requires BE PRs #1079/#383 to merge.
