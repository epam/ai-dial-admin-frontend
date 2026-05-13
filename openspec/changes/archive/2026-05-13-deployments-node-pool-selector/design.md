## Context

Container compute configuration today lives in a single panel on the container detail form: `ContainerResources` (`src/components/Deployments/Fields/ContainerResources.tsx`) handles CPU / memory / GPU request and limit fields, route-conditional GPU input (model-servings only), and validation via `SaveValidationContext`. There is no notion of node-pool affinity in the UI — the backend either picks a pool or honors a server-side default.

The container detail form is composed in `apps/ai-dial-admin/src/components/Containers/Fields/ContainerFields.tsx`, which renders top-level field sections in order. Each section is generally wrapped in a `Common/Accordion/Accordion` and may expose an `errorIndicator` prop driven by `useSaveValidationContext()` and the `isErrorPresent(errorFields, [...keys])` helper from `src/utils/deployments/containers.ts`. This pattern — accordion + section-scoped error light — is established across other entity sections.

The backend exposes a new `/node-pools` listing endpoint owned by `ai-dial-admin-deployment-manager-backend`. Each pool carries an opaque `id`, a human-readable `name`, and an optional `description` — it does not return CPU / GPU / memory totals. `Container` gained an optional `nodePoolId` slot, with `null` (or absent) meaning "let the platform pick".

The UI-kit components used here are all standard: `DialPopup` (`PopupSize.Lg`), `DialSearch`, `DialRadioButton`, `DialPrimaryButton`, `DialNeutralButton`, `DialLoader`, `DialNoDataContent`. The radio rows are wrapped in `<label htmlFor=...>` so clicking the row toggles the radio; truncated cells expose the full content via `title` attributes (per project rule on long-value access).

## Goals / Non-Goals

**Goals:**
- A discoverable single-glance "compute" surface where node-pool and resource decisions live together.
- An explicit, default-friendly "Any node pool" option that submits `null` rather than relying on the absence of a value.
- Optimistic display of the chosen pool's name (the form doesn't need to wait for a refetch to render the right label after Apply).
- Graceful degradation: clear loading, clear load-error, and a clear dangling-reference warning when a referenced pool no longer exists.
- No new accessibility regressions — the modal uses native `<label>`/`<input type="radio">` semantics through `DialRadioButton`; full strings stay reachable via `title` on truncated cells.

**Non-Goals:**
- No new node-pool CRUD UI — pools are platform-managed.
- No pool-rename refresh strategy — accept that a cached name may become stale until the next Apply.
- No permission gating on the client — the backend gates `/node-pools` and the container update endpoint.
- No retry button on the load-error state — out of scope; the user can reload the detail page.
- No expansion of the Compute accordion to other sections (Probes, Scaling). Future changes can re-evaluate.

## Decisions

### Decision 1: Persist both `nodePoolId` and `nodePoolName` on `Container`

**Choice:** `Container.nodePoolId` is the source of truth; `Container.nodePoolName` is a read-only cache captured at selection time.

**Rationale:** The id round-trips to the backend; the name is for display. Caching avoids the UI flickering between "Unknown node pool" and the real label whenever the form is rebuilt before the pool list resolves. When the live `pools` list contains a match, the live name wins; when it does not, the cached name is shown; only when both are missing does the dangling warning appear.

**Alternatives considered:**
- Store id only and always derive the name from the loaded list: simpler, but produces flicker on initial render and shows "Unknown" while pools are loading.
- Store the whole pool object: redundant; description and any future pool fields would drift faster than a single cached name.

### Decision 2: Explicit "Any node pool" option vs. an unselect button

**Choice:** A first-row radio entry labelled "Any node pool" submits `null`. There is no separate "clear" affordance.

**Rationale:** Discoverable, reads naturally as the default in a list, and means the modal always has a valid selection so "Apply" is never a no-op. Matches operator expectations from other "Any" selectors in the app.

### Decision 3: Three-column modal grid with id as monospace secondary text

**Choice:** `grid-cols-[36px_1fr_1.5fr]` — radio, name+id stack, description. Pool id renders as `font-mono text-[11px] text-secondary` beneath the name.

**Rationale:** Pool ids are opaque slugs that operators paste from logs; rendering them in monospace makes them scannable and distinct from the human name. Description gets the wider column because it's free-form text.

### Decision 4: Search filters across id, name, and description

**Choice:** Case-insensitive substring match on all three fields. The "Any node pool" row stays visible regardless of the query.

**Rationale:** Operators arriving with a pool id from a log line should be able to paste it and select; operators arriving from a description ("GPU pool") should also be able to filter that way. Keeping "Any" visible means the default is always one click away.

### Decision 5: Section error indicator covers only resource fields, not node-pool selection

**Choice:** `ContainerCompute` lights the accordion's `errorIndicator` when any of `gpuRequest`, `cpuRequest`, `cpuLimit`, `memoryRequest`, `memoryLimit` is invalid. Node-pool selection has no client-side required-field validation.

**Rationale:** Any pool id is valid (including `null` for Any). Dangling references are visible inline (the "Unknown node pool" warning) but do not block save — the backend may have its own policy.

### Decision 6: Two specs in one change

**Choice:** Split into `deployments-node-pool-selector` (the field, modal, API, model fields) and `deployments-compute-section` (the accordion grouping, error indicator, ordering).

**Rationale:** The two capabilities are independently testable and likely to evolve independently (e.g., a future change might move Probes into Compute without touching the selector). One change folder still groups the work as it actually shipped.

## Risks / Trade-offs

- **Risk:** Cached `nodePoolName` drifts after a server-side rename until the next Apply.
  **Mitigation:** Live `pools` list takes precedence over the cache; the next time the user opens the form and the pool list loads, the live name renders.
- **Risk:** `/node-pools` returning a large list affects modal performance.
  **Mitigation:** Payload is small (`{id,name,description}`); search is in-memory. If pools grow beyond UI-friendly counts, backend-side search becomes a follow-up change.
- **Risk:** On load error the Change button is hidden, leaving no recovery path inside the form.
  **Mitigation:** Accepted for now — reloading the detail page retries. A retry button is a small follow-up.
- **Trade-off:** Pool description is rendered in a single truncated line. Long descriptions are reachable via the `title` attribute but not via a popover. Acceptable given the modal's row density target.

## Migration Plan

1. No data migration. Existing containers without `nodePoolId` continue to behave as "Any node pool".
2. Deploy in a single PR. Backend `/node-pools` is already live.
3. Rollback: revert the PR. `Container.nodePoolId` / `nodePoolName` are optional, so existing records remain valid.

## Open Questions

- Should the cached `nodePoolName` be refreshed when the live list resolves and contains a different name for the same id? Current behavior renders the live name silently — no explicit "renamed" notice.
- Should deletion of a referenced pool (dangling state) block save, or just warn? Currently warns only — backend remains authoritative.
