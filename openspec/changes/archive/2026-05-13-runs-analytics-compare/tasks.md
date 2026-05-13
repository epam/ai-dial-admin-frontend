## 1. Data model

- [x] 1.1 Add `CompareAnalyticsRow` type to `components/Runs/View/models.ts` — extends `AnalyticsResult` with `_compared?: AnalyticsResult | null`

## 2. Utility functions

- [x] 2.1 Add `mergeByTestCaseId(current: AnalyticsResult[], compared: AnalyticsResult[]): CompareAnalyticsRow[]` to `components/Runs/View/utils.ts` — join by `testCaseId`, fallback `testCaseName`; missing matches → `_compared: null`
- [x] 2.2 Add `getAnalyticsColumnsCompare(results: CompareAnalyticsRow[], errorText?: string)` to `components/Runs/View/utils.ts` — `[blank]` group unchanged; EXECUTION, each metric group, and EXTRACTED each wrapped in `{ headerName: group, children: [{ headerName: 'Current', children: [...] }, { headerName: 'Compared', children: [...cmp_ colIds, _compared valueGetters] }] }`
- [x] 2.3 Ensure Compared valueGetters return `'—'` when `params.data?._compared` is `null`

## 3. Analytics tab — state and data fetching

- [x] 3.1 In `components/Runs/View/Analytics.tsx`, add `siblingRuns: Run[]` state and a mount-time fetch: `getRuns(0, 100, [], [testSuiteIdFilter, statusFilter(COMPLETED)])` excluding `run.id`; skip fetch when `run.testSuiteId` is absent
- [x] 3.2 Add `comparedRunId: string | null` state (default `null`) and `comparedResults: AnalyticsResult[] | null` state
- [x] 3.3 Add `isCompareLoading: boolean` state
- [x] 3.4 Add `useEffect` that fires when `comparedRunId` changes — fetches `getTestCaseRunResults(RESULT_FILTERS(selectedSiblingRun))` and sets `comparedResults`; clears `comparedResults` when `comparedRunId` is `null`

## 4. Analytics tab — grid wiring

- [x] 4.1 Compute `rowData` as `useMemo`: when `comparedRunId` and `comparedResults` are set, return `mergeByTestCaseId(results, comparedResults)`; otherwise return `results`
- [x] 4.2 Compute `colDefs` as `useMemo`: when compare mode is active, call `getAnalyticsColumnsCompare`; otherwise call `getAnalyticsColumns`
- [x] 4.3 Pass `groupHeaderHeight: 28` in `additionalGridOptions` only when compare mode is active

## 5. Comparison dropdown UI

- [x] 5.1 Add a comparison control row above the `GridView` in `Analytics.tsx` — render a `DialSelect` (or equivalent from `@epam/ai-dial-ui-kit`) with `siblingRuns` as options; each option label: `run.testRunName || run.id` + formatted `startedAt`
- [x] 5.2 Wire dropdown selection to `setComparedRunId`; wire clear/null selection to `setComparedRunId(null)`
- [x] 5.3 Show a loading spinner next to the dropdown while `isCompareLoading` is true
- [x] 5.4 Add `RunsI18nKey.CompareWith` i18n key and its English label `"Compare with"` to `src/locales/en.ts` and `src/constants/i18n.ts`

## 6. Tests

- [x] 6.1 Add unit tests for `mergeByTestCaseId` in `components/Runs/View/tests/utils.spec.ts` — cover: matched rows, unmatched rows (→ `_compared: null`), fallback to `testCaseName`
- [x] 6.2 Add unit tests for `getAnalyticsColumnsCompare` in `components/Runs/View/tests/utils.spec.ts` — verify `[blank]` group is unchanged, EXECUTION and metric groups have Current/Compared children, Compared colIds are prefixed with `cmp_`
- [x] 6.3 Add component tests for the compare dropdown in `components/Runs/View/tests/Analytics.spec.tsx` — verify dropdown renders sibling runs, selecting a run triggers compared results fetch, clearing reverts column layout

## 7. Code quality

- [x] 7.1 Run `npm run lint` from the repo root and fix any issues
- [x] 7.2 Run `npm run format:write` from the repo root
- [x] 7.3 Run `npx vitest run` from `apps/ai-dial-admin/` and confirm all tests pass
