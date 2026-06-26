## 1. Refactor SingleValueChart into a reusable presentational child

- [x] 1.1 Create `components/Common/SingleValue/SingleValueContent.tsx` — fetch-free, props `{ title, value, loading, unit }`, rendering the three states (loading → `DialLoader`, `value === null` → `DialNoDataContent`, else formatted number + unit), moved verbatim from `SingleValueChart`
- [x] 1.2 Refactor `components/Telemetry/Dashboards/Values/SingleValueChart.tsx` to keep its fetch/auto-refresh and render `<SingleValueContent />`; remove the duplicated render markup
- [x] 1.3 Verify `SingleValueChart.spec.tsx` still passes unchanged
- [x] 1.4 Add `components/Common/SingleValue/tests/SingleValueContent.spec.tsx` covering the three states (loading, No Data, value+unit)

## 2. API layer + model

- [x] 2.1 Add frontend model mirroring backend `UnifiedDeploymentMetrics` in `models/` (resources / serving / operational blocks, per-block availability, `scrapedPod`, collection timestamp); use enums for fixed sets per code-standards
- [x] 2.2 Add `CONTAINER_METRICS_URL(id)` and `ContainersApi.getContainerMetrics(id, token)` in `server/deployments/containers.ts` calling `GET {API}/deployments/{id}/metrics`
- [x] 2.3 Add `getContainerMetrics(id)` server action in `app/actions/deployments.ts` (auth via `getUserToken`, mirroring `getContainerResources`)
- [x] 2.4 Add a spec for the server action / API method (called URL, token passed, parsed response, failure path) per testing rules

## 3. MetricsSection + metric→card config

- [x] 3.1 Create `MetricsSection` (title + responsive `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4` row of `SingleValueContent` cards) under `components/Containers/View/Metrics/`
- [x] 3.2 Add `constants.ts`/config mapping the DTO → sections → cards: label i18n key, unit, value selector, and the splits (`tokensPerSecond` → prompt + generation, `replicas` → ready + total, `e2eLatency` → mean/p50/p95/p99)
- [x] 3.3 Add component spec for `MetricsSection` (renders title + N cards, passes value/unit through)

## 4. Metrics tab component

- [x] 4.1 Replace the `Metrics.tsx` stub: accept the deployment id and the route/type, fetch the snapshot once on mount via `getContainerMetrics`, hold `{ data, loading }`
- [x] 4.2 Render Resources always; render Serving/Operational only when the route is Model Servings AND those blocks are available in the snapshot (route gate is the hard guard — never render model-serving sections on other views); map each field to cards via the config (null → "No Data")
- [x] 4.3 Add a manual Refresh button that re-fetches the snapshot
- [x] 4.4 Handle request failure: cards in "No Data" state, Refresh remains usable
- [x] 4.6 GPU card rendered only on Model Servings (omitted from the Resources section on other deployment types)
- [x] 4.7 TEMP review hacks (hardcoded snapshot, MCP-as-model gate, skipped non-inference test) removed — real API call and route gate restored
- [x] 4.5 Add component spec for the Metrics tab: loading state, Serving/Operational present on Model Servings vs only Resources (no model-serving section title/cards) on other routes, null field → No Data, Refresh triggers re-fetch (mock the server action)

## 5. Tab wiring + i18n

- [x] 5.1 Register `metricsTab(t, status)` in `getDeploymentsViewTabs()` for the McpContainers branch and the default branch (Model Servings, Interceptor, Adaptor, Application); leave the Images branch unchanged
- [x] 5.2 Pass the deployment id and the route/type from `TabsContent` to `<Metrics />` (route needed to gate model-serving sections)
- [x] 5.3 Add metric label / section i18n keys in `constants/i18n.ts` + `locales/en.ts` (reuse `TabsI18nKey.Metrics`; add a `MetricsI18nKey` enum or extend an existing one for section titles and metric labels)
- [x] 5.4 Update `utils/tabs/tests/utils.spec.ts` to cover `metricsTab` appearing for the five deployment routes and absent for Images

## 6. Verification

- [x] 6.1 Run the targeted specs from §1–§5 via `vitest run`; report output
- [x] 6.2 `npm run lint` and `npm run format` clean on changed files
