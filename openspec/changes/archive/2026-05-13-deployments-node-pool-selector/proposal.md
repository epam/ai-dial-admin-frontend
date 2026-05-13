## Why

Container scheduling on a specific Kubernetes node pool was not configurable from the admin UI. Operators had to rely on backend defaults or out-of-band tooling, with no visibility into which pool a container targeted. The backend now exposes a `/node-pools` listing endpoint returning `{ pools: [{ id, name, description }] }`, and `Container` gained a `nodePoolId` slot. The UI needs a discoverable selector that supports "let the platform decide" semantics (null id), keeps the chosen pool's display name visible after selection so the form doesn't flicker between "Unknown" and the real name on re-fetch, and surfaces dangling references when a previously-selected pool no longer exists.

## What Changes

- Add the node pools API plumbing:
  - `src/models/deployments/node-pools.ts` — `NodePool { id, name, description? }` and `NodePoolsResponse { pools }`.
  - `src/server/deployments/node-pools.ts` — `NodePoolsApi` calling `${API}/node-pools` via `BaseApi.getAction`.
  - `src/app/api/api.ts` — register `nodePoolsApi`.
  - `src/app/actions/deployments.ts` — `getNodePools()` server action authenticated via `getUserToken()`.
- Extend the container model: `Container` gains `nodePoolId?: string | null` (source of truth submitted to backend) and `nodePoolName?: string | null` (cached display name captured at selection time).
- Add the selector field `src/components/Deployments/Fields/ContainerNodePool.tsx` with three render states (loading / load-error / ready row) and a "Select node pool" / "Change" action button.
- Add `src/components/Deployments/Fields/ContainerNodePool/NodePoolSelectorModal.tsx` — a `DialPopup` (Lg, 560px) containing `DialSearch`, an explicit "Any node pool" row, and one `DialRadioButton` row per loaded pool. Search filters case-insensitively by id / name / description. Apply submits the pending id (or null for "Any"); Cancel discards.
- Wrap `ContainerNodePool` and the existing `ContainerResources` in a new "Compute" accordion (`ContainerCompute.tsx`) with a section-level error indicator driven by the existing `SaveValidationContext` and `isErrorPresent` helper. `Containers/Fields/ContainerFields.tsx` now mounts `ContainerCompute` in place of the standalone `ContainerResources`.
- Add i18n entries:
  - `EntityFieldsI18nKey.Compute`, `EntityFieldsI18nKey.NodePool`.
  - `DeploymentsI18nKey.NodePool*` group: `NodePoolModalTitle`, `NodePoolSearchPlaceholder`, `NodePoolColumnName`, `NodePoolColumnDescription`, `NodePoolEmpty`, `NodePoolAny`, `NodePoolAnyDescription`, `NodePoolUnknown`, `NodePoolUnknownHint`, `NodePoolLoadError`, `NodePoolSelect`, `NodePoolNoMatches`.
- Drop obsolete utilities `humanBytes`, `humanMilliCpus`, `totalVramBytes`, `isGpuPool` (and their tests) — they referenced CPU/GPU/memory specs that no longer exist on the simplified `NodePool` model.

## Capabilities

### New Capabilities

- `deployments-node-pool-selector`: Node pools API contract, selector field, modal, "Any node pool" semantics, dangling-id handling.
- `deployments-compute-section`: Grouping of Resources + Node Pool under a single Compute accordion with a shared error indicator.

### Modified Capabilities

- _None._ The existing `ContainerResources` rendering is unchanged; only its parent placement moves into the new Compute accordion, and no prior capability spec covered that placement.

## Impact

- **Code** — see commits `9ab0eb7e` (initial selector + Compute accordion) and `e874e0a8` (alignment with the `{id,name,description}` API contract).
- **Backend** — no changes here; this change consumes a contract the backend already exposes.
- **Migration** — none. New `Container` fields are optional. Containers without `nodePoolId` continue to behave as "Any node pool" (null).

## Non-Goals

- No inline create / delete / edit of node pools — pools are managed server-side.
- No client-side permission gating on pool listing or selection — backend authorization is authoritative.
- No automatic refresh of the cached `nodePoolName` after a pool is renamed server-side. The live `pools` list is consulted first; cache is fallback; dangling pools surface the "Unknown node pool" warning.
- No retry button on the load-error state — refreshing the form is the recovery path for now.
