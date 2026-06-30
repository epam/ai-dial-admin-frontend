## Context

Deployment/container detail views are all rendered by one shared `ContainerView` + `TabsContent`, with the tab set chosen per route in `getDeploymentsViewTabs()` (`utils/tabs/utils.ts`). Scaffolding for a Metrics tab already exists but is unreachable:

- `EntityViewTab.Metrics` enum value, `TabsI18nKey.Metrics`, and a `metricsTab()` factory (already disables unless `RUNNING`) exist.
- `<Metrics />` is wired in `Containers/View/TabsContent.tsx` but `Metrics.tsx` is a stub (`<div>Metrics</div>`).
- `metricsTab()` is **not** registered in `getDeploymentsViewTabs()`, so the tab never appears on a deployment. (It is currently only used by Test Suites.)

The backend exposes `GET /deployments/{id}/metrics` (deployment-manager PR #357, merging soon) returning a unified, engine-neutral **snapshot** (no history): a `resources` block for every deployment type, plus `serving`/`operational` blocks for inference, plus per-block `availability` markers and a collection timestamp. Any field can be null.

Existing data-fetch siblings: `Resources`/`Prompts` fetch once on mount via a deployment server action and render with loading/empty states; `Events`/`ExecutionLog` stream via SSE; the parent polls pods every 60s. The telemetry dashboard already has a single-value card (`SingleValueChart`) with loading / "No Data" / big-number states, but it self-fetches per card via a `TelemetryQuery`.

## Goals / Non-Goals

**Goals:**
- A Metrics tab on MCP / Interceptor / Adaptor / Application containers and Model Servings (not Images) that renders the snapshot as grouped single-value cards.
- One snapshot fetch per open / per Refresh click — no auto-poll.
- Reuse the telemetry card's presentational rendering (incl. "No Data") without coupling the tab to the telemetry fetch model.
- Graceful per-field degradation: null/unavailable → "No Data", never an error.

**Non-Goals:**
- Time-series charts, time-range picker, history (backend has none in PoC).
- Auto-refresh / polling.
- Real GPU utilization/memory values (backend placeholder).
- Multi-pod aggregation, alerting, autoscaling.

## Decisions

### D1 — Extract a presentational `SingleValueContent` child; keep `SingleValueChart` as the fetching wrapper
`SingleValueChart` self-fetches via `getData(query)`. The Metrics tab needs **one** fetch for the whole tab, not one per card. Extract the render body (loading / `value === null` → `DialNoDataContent` / formatted number + unit) into a fetch-free `SingleValueContent` taking `{ title, value, loading, unit }`. `SingleValueChart` keeps its fetch/auto-refresh and renders the child; telemetry behavior is unchanged and its existing spec must still pass. The Metrics tab renders `SingleValueContent` directly with values it already has.

Placement: `components/Common/SingleValue/` — domain-free, reused by two features (per components.md §4).

- *Alternative — reuse `SingleValueChart` as-is with per-card `getData` closures reading a shared memoized snapshot:* rejected. It forces null fields through `success:false` to reach the "No Data" branch and threads a fake `TelemetryQuery` per card — awkward and couples the tab to telemetry types.
- *Alternative — build a brand-new card:* rejected. Duplicates the "No Data"/loading/format logic that already exists.

### D2 — One Metrics component; Resources always, model-serving sections route-gated AND availability-gated
The backend returns one unified schema for every type; inference just populates more blocks. A single `Metrics` component fetches once and renders the Resources section for all types. The model-serving sections (Serving, Operational) render **only on the Model Servings route AND when the snapshot marks those blocks available** — both conditions required. The route gate is the hard guard: on MCP/Interceptor/Adaptor/Application views the Serving/Operational sections (titles and cards) are never rendered, even if the backend unexpectedly returns those blocks. The availability gate then hides them on a Model Serving when the engine exposes nothing. So the tab takes the deployment route/type as a prop, not just the snapshot.

- *Alternative — gate purely on the snapshot's `availability` markers (no route check):* rejected. It trusts the backend to always null serving blocks for non-inference deployments; a contract drift would leak model-serving sections onto container views. The route gate makes "hidden on other views" guaranteed client-side.

### D3 — `MetricsSection` = title + responsive card row; metric→card mapping in a config
`MetricsSection` is a thin presentational wrapper: a section title plus a responsive grid (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-4`, `gap`) of `SingleValueContent` cards. The DTO→cards mapping (label i18n key, unit, value selector, and the multi-value splits — `tokensPerSecond`→2, `replicas`→2, `e2eLatency`→4) lives in a `constants.ts`/config next to the tab, keeping the component body markup-only (components.md §3). Section/card definitions are data, so adding a metric later is a config edit.

### D4 — Fetch model: one-shot on open + manual Refresh, mirror `Resources`
Follow the `Resources` tab pattern: `useState` for `{ data, loading }`, fetch on mount in `useEffect`. Add a Refresh button that re-runs the same fetch. No interval. The backend caches ~5s, so rapid manual refreshes are cheap.

### D5 — API layer mirrors existing deployment endpoints
Add `CONTAINER_METRICS_URL(id) = ${BASE_CONTAINERS_URL}/${id}/metrics` and `ContainersApi.getContainerMetrics(id, token)` in `server/deployments/containers.ts`, and a `getContainerMetrics(id)` server action in `app/actions/deployments.ts` — identical shape to `getContainerResources`/`getContainerPods`. A frontend model in `models/` mirrors the backend `UnifiedDeploymentMetrics` DTO (resources / serving / operational / availability / scrapedPod / collectedAt), using enums for fixed sets (engine family, block keys) per code-standards.

### D6 — Tab registration
Add `metricsTab(t, status)` to `getDeploymentsViewTabs()` for the McpContainers branch and the default branch (which already covers Model Servings, Interceptor, Adaptor, Application). Images keep their own branch with no metrics tab. The factory's existing `status !== RUNNING` disable covers the disabled-state requirement.

## Risks / Trade-offs

- **Backend contract not yet merged (PR #357)** → Design against its current OpenAPI; isolate the shape in one `models/` file and one DTO→card config so a field rename is a localized edit. Verify field names against the merged contract before/at implementation.
- **Telemetry regression from the `SingleValueChart` refactor** → Behavior is preserved (same JSX moved into the child); the existing `SingleValueChart.spec.tsx` is the guard and must pass unchanged. Add a focused spec for `SingleValueContent`'s three states.
- **"No Data" overload** → Many inference fields are engine-dependent and several non-inference cards (GPU) are always null in the PoC, so a tab can look mostly empty. Acceptable for the PoC; the `availability` reason can later feed a tooltip to explain *why* a card is empty.
- **Snapshot has no history** → Single-value cards only; the time-series chart from early mockups is explicitly out of scope until the backend time-range follow-up ships.
- **Stopped deployments** → Backend returns 200 with `replicas 0/0`, but we keep the tab disabled unless `RUNNING` to match Resources/Prompts; no special-casing needed.

## Open Questions

- Exact field names / nesting in the merged `UnifiedDeploymentMetrics` DTO — confirm against PR #357 at implementation time.
