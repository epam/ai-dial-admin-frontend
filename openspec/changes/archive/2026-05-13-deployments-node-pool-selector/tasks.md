## 1. Models and types

- [x] 1.1 Add `NodePool { id, name, description? }` and `NodePoolsResponse { pools }` to `src/models/deployments/node-pools.ts`.
- [x] 1.2 Extend `Container` in `src/models/deployments/containers.ts` with `nodePoolId?: string | null` and `nodePoolName?: string | null`.

## 2. Server / API

- [x] 2.1 Create `NodePoolsApi` (`src/server/deployments/node-pools.ts`) calling `${API}/node-pools` via `BaseApi.getAction`. Export `BASE_NODE_POOLS_URL` for tests.
- [x] 2.2 Register `nodePoolsApi` in `src/app/api/api.ts`.
- [x] 2.3 Add `getNodePools()` server action in `src/app/actions/deployments.ts` — authenticate via `getUserToken(getIsEnableAuthToggle(), headers(), cookies())` and delegate to `nodePoolsApi.getNodePools(token)`.
- [x] 2.4 Add `src/server/deployments/tests/node-pools.spec.ts` covering the URL and token plumbing.

## 3. i18n

- [x] 3.1 Add `EntityFieldsI18nKey.Compute` (`EntityFields.Compute`) and `EntityFieldsI18nKey.NodePool` (`EntityFields.NodePool`) to `src/constants/i18n.ts`.
- [x] 3.2 Add the `DeploymentsI18nKey.NodePool*` group: `NodePoolModalTitle`, `NodePoolSearchPlaceholder`, `NodePoolColumnName`, `NodePoolColumnDescription`, `NodePoolEmpty`, `NodePoolAny`, `NodePoolAnyDescription`, `NodePoolUnknown`, `NodePoolUnknownHint`, `NodePoolLoadError`, `NodePoolSelect`, `NodePoolNoMatches`.
- [x] 3.3 Mirror all entries in `src/locales/en.ts` (`Compute`, `NodePool`, and the `NodePool*` Deployments group).

## 4. Selector field and picker components

- [x] 4.1 Create `src/components/Deployments/Fields/ContainerNodePool.tsx` — loads pools on mount via `getNodePools()`, renders loading / ready states, opens the modal on demand, writes `nodePoolId` + cached `nodePoolName` on confirm. On listing failure surfaces a toast via `useNotification()` + `getErrorNotification(errorHeader ?? t(NodePoolLoadError), errorMessage, requestId)` and leaves the loaded list empty (Change/Select button disabled).
- [x] 4.2 Create `src/components/Deployments/NodePool/NodePoolItem.tsx` — single radio row used by both the "Any node pool" entry and each pool entry; renders name, optional monospace id, and optional description in the shared three-column grid.
- [x] 4.3 Create `src/components/Deployments/NodePool/NodePoolList.tsx` — `DialSearch` input + header row + a `<ul>` of `NodePoolItem`s with the "Any" row pinned at top; filters case-insensitively by id / name / description; renders `DialNoDataContent` with `NodePoolNoMatches` when the query yields zero pool matches but the loaded list is non-empty.
- [x] 4.4 Create `src/components/Deployments/Modals/ContainerNodePoolModal/ContainerNodePoolModal.tsx` — `DialPopup` (`PopupSize.Lg`, `className="h-[560px]"`) wrapping `NodePoolList`. Apply submits the pending selection; Cancel discards. Reset `pendingSelection` on every open.
- [x] 4.5 Add `src/components/Deployments/Fields/tests/ContainerNodePool.spec.tsx` covering: field title rendering, "Any" by default when `nodePoolId` is null, hydration from `nodePoolId` + `nodePoolName`, dangling-id warning, Apply writes id + name, "Any" submits null, Cancel does not touch the container, toast is fired on load failure (with `errorHeader` / `errorMessage` / `requestId`), default-title fallback when `errorHeader` is absent, modal search filters the list.

## 5. Compute accordion

- [x] 5.1 Create `src/components/Deployments/Fields/ContainerCompute.tsx` wrapping `ContainerNodePool` and `ContainerResources` inside a `Common/Accordion/Accordion`, with `errorIndicator` driven by `isErrorPresent(errorFields, ['gpuRequest','cpuRequest','cpuLimit','memoryRequest','memoryLimit'])` from `useSaveValidationContext()`. Title comes from `EntityFieldsI18nKey.Compute`.
- [x] 5.2 Replace the direct `ContainerResources` mount with `ContainerCompute` in `apps/ai-dial-admin/src/components/Containers/Fields/ContainerFields.tsx`. Forward `route` and `disabled` through.
- [x] 5.3 Adjust `ContainerResources.tsx` so it renders inline (no nested accordion) when mounted inside Compute — single accordion layer.
- [x] 5.4 Add `src/components/Deployments/Fields/tests/ContainerCompute.spec.tsx` covering: Compute title rendering, child order (NodePool then Resources), `disabled` forwarded to both children, `route` forwarded to Resources, no error indicator when valid, error indicator when a tracked field is invalid, no error indicator for unrelated keys.

## 6. Cleanup from API alignment

- [x] 6.1 Delete obsolete helpers `humanBytes`, `humanMilliCpus`, `totalVramBytes`, `isGpuPool` (`src/utils/deployments/node-pools.ts`) along with their tests (`src/utils/deployments/tests/node-pools.spec.ts`). They referenced CPU / GPU / memory fields that no longer exist on `NodePool`.

## 7. Code quality

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test` and address any failures.
