## 1. i18n

- [x] 1.1 Add `MetricBindings = 'Runs.MetricBindings'` to `RunsI18nKey` enum in `apps/ai-dial-admin/src/constants/i18n.ts`
- [x] 1.2 Add `'Runs.MetricBindings': 'Metric bindings'` to `apps/ai-dial-admin/src/locales/en.ts`

## 2. Tests — API, action, and util

- [x] 2.1 Add `getMetricSnapshots` test to `apps/ai-dial-admin/src/server/eval/tests/analytics-api.spec.ts`: assert the fetch URL is `${TEST_URL}${ANALYTICS_RUN_METRIC_SNAPSHOTS_URL}?<filter-string>` using `createFetchMock`; import `ANALYTICS_RUN_METRIC_SNAPSHOTS_URL` from `analytics-api`
- [x] 2.2 Add `getMetricSnapshots` action test to `apps/ai-dial-admin/src/app/[lang]/runs/actions.spec.ts`: mock `analyticsApi.getMetricSnapshots`, call `getMetricSnapshots(filters)`, assert `analyticsApi.getMetricSnapshots` was called with `(filters, TOKEN_MOCK)` and the result is returned; add `getMetricSnapshots` to the imports from `./actions`
- [x] 2.3 Add `snapshotsToBindingsMap` tests to `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts`: test happy path (two named snapshots → correct record), snapshots without `tsmdName` are skipped, empty array returns `{}`, undefined bindings default to `[]`; add `snapshotsToBindingsMap` to the imports from `../utils`

## 3. AnalyticsTab — parallel fetch + state

- [x] 3.1 In `apps/ai-dial-admin/src/components/Runs/View/Analytics.tsx`: add `metricBindings` state (`useState<Record<string, MetricBindings>>({})`) and import `MetricBindings` from `@/src/models/evaluation/metric`
- [x] 3.2 Replace the two separate `then` chains for `getTestCaseRunResults` and `getMetricSnapshots` with a single `Promise.allSettled([...])` call — set `isLoading(true)` before, process results (set `results`, `colDefs`, `metricBindings`), set `isLoading(false)` in `.finally()`; remove the `console.log`
- [x] 3.3 Add `metricBindings` to `onRowClicked`'s `useCallback` deps; pass `metricBindings={metricBindings}` to `RunMetricDetailPanel` inside `sidebar.showSidebar`

## 4. RunMetricDetailPanel — new prop + Metric Bindings sub-section

- [x] 4.1 In `apps/ai-dial-admin/src/components/Runs/Details/RunMetricDetailPanel.tsx`: add `metricBindings?: Record<string, MetricBindings>` to the `Props` interface; import `MetricBindings` from `@/src/models/evaluation/metric`
- [x] 4.2 For each metric group in the `metricGroups.map(...)`, compute `const groupBindings` by merging `metricBindings?.[group.title]?.configBindings ?? []` and `metricBindings?.[group.title]?.inputBindings ?? []` into a flat array
- [x] 4.3 When `groupBindings.length > 0`, render a collapsible sub-section titled `t(RunsI18nKey.MetricBindings)` below `MetricCardsGrid` — use the same `useState(true)` / chevron-button toggle pattern as `AdaptiveValueGrid`; render binding rows inside when expanded
- [x] 4.4 Each binding row uses a 3-column CSS grid (`grid-cols-[minmax(70px,140px)_auto_1fr]`): col 1 = `binding.property`, col 2 = source-type chip (see below), col 3 = value; apply `dial-tiny-text px-2 py-1.5 border-b border-tertiary last:border-b-0` row styling to match existing rows

  Source-type chip classes by `binding.source.$type`:
  - `Constant` → `text-accent-secondary bg-accent-secondary-alpha`
  - `TestCase` → `text-success bg-success-alpha`
  - `Response` → `text-accent-primary bg-accent-primary-alpha`
  
  Chip base classes: `inline-block text-[9px] font-semibold px-[5px] py-px rounded-sm uppercase tracking-wide leading-[14px]`

  Value: `Constant` → `String(binding.source.value)`, else → `binding.source.columnName ?? ''`

## 5. Quality checks

- [x] 5.1 Run `npx vitest run src/components/Runs src/server/eval/tests/analytics-api.spec.ts src/app/\[lang\]/runs/actions.spec.ts` from `apps/ai-dial-admin/` — all tests pass
- [x] 5.2 Run `npm run lint` from repo root — no errors
