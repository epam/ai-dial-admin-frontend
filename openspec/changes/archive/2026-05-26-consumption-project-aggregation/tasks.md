## 1. Aggregator helpers (pure, no wiring)

- [x] 1.1 Add `RawConsumptionRow` interface to `apps/ai-dial-admin/src/models/telemetry.ts` with fields `deployment`, `parent_deployment`, `execution_path`, `project_id`, `count`, `money`, `aggregated_money`, `tokens_p`, `tokens_c` (all `string`).
- [x] 1.2 Create `apps/ai-dial-admin/src/utils/consumption-aggregation.ts` exporting:
  - `aggregateByDeployment(data: TelemetryData): EntityRow[]` — groups raw rows by `(deployment, parent_deployment, execution_path)`, sums numeric columns via `Big`, emits rows where `name = deployment`. Drops `project_id`.
  - `aggregateByProject(data: TelemetryData): Record<string, string>[]` — groups raw rows by `project_id`, sums numeric columns via `Big`, emits rows where `name = project_id`.
  - Both helpers read column indexes directly off `data.headers` (no `TELEMETRY_GRID_HEADERS_MAP`).
  - Numeric outputs are strings (preserves `EntityRow` shape).
- [x] 1.3 Create `apps/ai-dial-admin/src/utils/tests/consumption-aggregation.spec.ts` with scenarios:
  - Empty data → returns `[]` for both helpers.
  - Single row (one project) → both helpers return one row each, no math change.
  - Three projects under one `(d, parent, ep)` → `aggregateByDeployment` returns 1 row with summed numerics; `aggregateByProject` returns 3 rows (one per project).
  - Two `(d, parent, ep)` triplets, one project each → `aggregateByDeployment` returns 2 rows; `aggregateByProject` returns 2 rows.
  - Multiple deployments under one project → `aggregateByProject` collapses them to one project row with summed numerics.
  - Numeric strings preserved as strings on output (regression guard against accidental `Number` cast).
  - Big-number precision: input strings near `Number.MAX_SAFE_INTEGER` sum without float drift.
  - Empty `execution_path` rows pass through unchanged (still aggregated by their identity tuple).
  - Empty / missing `project_id` rows aggregate under the empty bucket consistently.
- [x] 1.4 `npm run lint` clean; `npx vitest run src/utils/tests/consumption-aggregation.spec.ts` green. (13 tests pass; ESLint clean on `consumption-aggregation.ts` and `models/telemetry.ts`.)

## 2. Query shape

- [x] 2.1 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, extend `ENTITY_CONSUMPTION_TREE_QUERY`:
  - Add `'project_id'` to `expressions` (after `'execution_path'`).
  - Add `'project_id'` to `groupBy`.
- [x] 2.2 Verify no other production code reads `groupBy` of this query by string match. (Only two production consumers: `EntitiesConsumptionTree.tsx` and `ChartsDashboard.tsx`; existing test assert uses `expect.arrayContaining([...])` which stays compatible.)

## 3. ConsumptionDashboard proxy

- [x] 3.1 Create `apps/ai-dial-admin/src/components/Telemetry/Dashboards/ConsumptionDashboard.tsx`:
  - Props: `route: ApplicationRoute`, `getData: (q: TelemetryQuery) => Promise<ServerActionResponse>`, `refreshTime?: string`.
  - State: `loading: boolean`, `deploymentRows: EntityRow[] | null`, `projectRows: Record<string, string>[] | null`.
  - `useEffect`: fetch `ENTITY_CONSUMPTION_TREE_QUERY` once, then on `refreshTime` interval; on success, set `aggregateByDeployment(response.response)` and `aggregateByProject(response.response)`; on failure, set both to `null`.
  - Render `EntitiesConsumptionTree` (only when `route === ApplicationRoute.Dashboard`) and the projects `TelemetryGrid`, both with the rows/data props from this component.
- [x] 3.2 Move the layout markup (the wrapper `<div className="flex flex-col w-full">` + the two inner `<div>`s) from `SimpleDashboard.tsx:37-56` into `ConsumptionDashboard.tsx`.

## 4. Child components accept rows / data

- [x] 4.1 `apps/ai-dial-admin/src/components/Telemetry/EntitiesConsumptionTree.tsx`:
  - Add optional `rows?: EntityRow[] | null` and `loading?: boolean` to `Props`.
  - When `rows` is provided (i.e. `rows !== undefined`), skip the internal `getData(ENTITY_CONSUMPTION_TREE_QUERY)` call, skip the refresh interval, derive `treeData = buildEntitiesConsumptionTree(rows ?? [])`, and use the supplied `loading` flag.
  - When `rows` is omitted, preserve current behavior byte-for-byte (existing tests / call sites stay working).
- [x] 4.2 `apps/ai-dial-admin/src/components/Telemetry/TelemetryGrid.tsx`:
  - Add optional `data?: Record<string, string>[] | null` and `loading?: boolean` to `Props`.
  - When `data` is provided, render it directly; skip `useEffect` / `getData` call.
  - When `data` is omitted, preserve current `query`-driven behavior.
- [x] 4.3 `apps/ai-dial-admin/src/components/Telemetry/Dashboards/View/SimpleDashboard.tsx`:
  - Replace the `EntitiesConsumptionTree` + projects `TelemetryGrid` block at lines 37-56 with a single `<ConsumptionDashboard route={route} getData={getData} refreshTime={effectiveRefreshTime} />`.
  - Remove the now-unused `PROJECT_CONSUMPTION_QUERY` import.

## 5. Total Tokens reducer

- [x] 5.1 In `apps/ai-dial-admin/src/utils/telemetry.ts`, update `getTotalTokensFromTree`:
  - Replace `const rows = getGridData(data) as EntityRow[]` with `const rows = aggregateByDeployment(data)`.
  - Keep the rest (tree build, root sum, `Big` precision) unchanged.
- [x] 5.2 Add to `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx`:
  - Fixture: three rows with the same `(deployment, parent_deployment, execution_path)` under projects `p_1`, `p_2`, `p_3` with token counts `0`, `100`, `200`.
  - Assertion: `getTotalTokensFromTree` returns `300`, not `900` (no triple-counting) and not `200` (no single-project-only).

## 6. Dead-code cleanup

- [x] 6.1 Remove `PROJECT_CONSUMPTION_QUERY` from `apps/ai-dial-admin/src/constants/telemetry.tsx`.
- [x] 6.2 Remove `ENTITY_CONSUMPTION_QUERY` from `apps/ai-dial-admin/src/constants/telemetry.tsx` (already unused).
- [x] 6.3 Repo-wide grep for both names — expect zero references. (Confirmed: zero matches under `apps/ai-dial-admin/src`.)

## 7. Test updates

- [x] 7.1 Update `apps/ai-dial-admin/src/components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx`:
  - Keep the existing "fetches with `ENTITY_CONSUMPTION_TREE_QUERY` when no `rows` provided" path.
  - Add a "renders provided rows without fetching" case that passes `rows` directly and asserts `getData` is never called.
- [x] 7.2 Add `apps/ai-dial-admin/src/components/Telemetry/Dashboards/tests/ConsumptionDashboard.spec.tsx`:
  - One fetch fires the extended `ENTITY_CONSUMPTION_TREE_QUERY` (assert `query.groupBy` includes `'project_id'`).
  - Multi-project response → tree grid shows N rows (one per `(d, parent, ep)`), projects grid shows M rows (one per `project_id`).
  - Failure response → both children render the empty / no-data state.
  - Off-Dashboard route → tree grid not rendered, projects grid still rendered.
- [x] 7.3 Confirm no other test imports `PROJECT_CONSUMPTION_QUERY` or `ENTITY_CONSUMPTION_QUERY`. (Zero matches under `apps/ai-dial-admin/src`.)

## 8. Quality checks

- [x] 8.1 `npm run lint` — clean on touched files. (Only two pre-existing `any` warnings unchanged by this change: `SimpleDashboard.tsx:18` original `Promise<any>` signature, `constants/telemetry.tsx:23` original `as any` cast.)
- [x] 8.2 `npm run test` — full suite green; particular attention to `telemetry.spec.tsx`, `entities-consumption-tree.spec.ts`, `EntitiesConsumptionTree.spec.tsx`, `Dashboard.spec.tsx`, `McpDashboard.spec.tsx` (regression surface). (508 files / 5100 tests pass, 9 skipped, 0 failed.)

## 9. Validation

- [x] 9.1 `openspec validate consumption-project-aggregation --strict` clean.

## 10. Project-side root filter (added post-implementation)

- [x] 10.1 Update `aggregateByProject` in `apps/ai-dial-admin/src/utils/consumption-aggregation.ts` so it only sums rows that qualify as a project root: `parent_deployment ∈ {'', 'undefined'}`, OR the parent's expected `execution_path` (via `stripDeploymentSuffix`) is absent from the project's set of `execution_path`s. Parent-presence check scoped per `project_id`.
- [x] 10.2 Reuse `stripDeploymentSuffix` from `entities-consumption-tree.ts` (handles `\/`-escaped segments consistently).
- [x] 10.3 Update existing project-aggregator tests to use root-row fixtures where the test asserts a non-zero total.
- [x] 10.4 Add tests for:
  - child whose parent is present in the same project → excluded;
  - orphan child whose parent has no row in the same project → counted (synthetic root);
  - same orchestrator name appearing in a different project does not satisfy parent-presence;
  - deep chain (root → mid → leaf, all present) → only root counted;
  - `'undefined'` sentinel treated as a root;
  - the user's mixed `pr_1`/`pr_2` scenario from the spec.
- [x] 10.5 Update `aggregateByProject` requirement + scenarios in `specs/consumption-project-aggregation/spec.md` to reflect root-only semantics.
- [x] 10.6 Update proposal.md description of `aggregateByProject`.
- [x] 10.7 Add design decision #7 "`aggregateByProject` sums project-root rows only" with rationale and rejected alternatives.
- [x] 10.8 Full test suite green: 5106 pass, 9 skipped, 0 failed.
