## 1. Telemetry query model

- [x] 1.1 Extend `TelemetryQuery.query` in `apps/ai-dial-admin/src/models/telemetry.ts` with optional `limit?: number` and `offset?: number` fields.
- [x] 1.2 Add unit tests in `apps/ai-dial-admin/src/server/tests/telemetry-api.spec.ts` (or similar) confirming that requests with `limit`/`offset` serialize to the expected JSON shape, and that requests without them omit both keys.

## 2. Query builder helper

The helper lives inside the existing `telemetry.*` files rather than a standalone module, to match the rest of the telemetry stack.

- [x] 2.1 Add `buildUsageLogQuery({ baseQuery, startRow, pageSize, sortModel, filterModel, timeRange, entityName }) → TelemetryQuery` to `apps/ai-dial-admin/src/utils/telemetry.ts`. Types live in `apps/ai-dial-admin/src/models/telemetry.ts` (`AgGridTextFilter`, `AgGridNumberFilter`, `AgGridDateFilter`, `AgGridFilter`, `UsageLogFilterModel`, `UsageLogFilterClause`, `BuildUsageLogQueryParams`). Operator maps + column alias + default sort constants live in `apps/ai-dial-admin/src/constants/telemetry.tsx` (`USAGE_LOG_TEXT_OPERATOR_MAP`, `USAGE_LOG_NUMBER_OPERATOR_MAP`, `USAGE_LOG_DATE_OPERATOR_MAP`, `USAGE_LOG_COLUMN_ID_TO_SOURCE`, `USAGE_LOG_DEFAULT_SORT_COLUMN`, `USAGE_LOG_DEFAULT_SORT_DIRECTION`).
- [x] 2.2 Add `translateUsageLogSortModel(sortModel)` translating ag-Grid `SortModelItem[]` → telemetry `orderBy` (`{ $asc | $desc: colId }`), with fallback to `[{ $desc: '_time' }]` when the sort model is empty.
- [x] 2.3 Add `translateUsageLogFilterModel(filterModel)` translating ag-Grid `filterModel` to telemetry `where.$and` clauses — text filters (`$contains`, `$not_contains`, `$starts_with`, `$ends_with`, `$eq`, `$ne`), number filters (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`), date filters (`$eq`, `$gte`, `$lte`, `$gt`, `$lt`). `buildUsageLogQuery` composes these with the existing time-range and entity-name clauses from `getFormattedFilters`.
- [x] 2.4 `buildUsageLogQuery` always populates `limit = pageSize` and `offset = startRow` on the returned query and never mutates the `baseQuery` constants.
- [x] 2.5 Unit tests for the new helpers live in `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx` covering: default sort fallback; each operator for text/number/date filters; composition with time range and entity name; no-filter case; unusual filter model shapes (empty, null operand).

## 3. Strip default sort from telemetry constants

- [x] 3.1 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, remove `orderBy: [{ $desc: '_time' }]` from `TRACES_QUERY`, `CONVERSATIONS_QUERY`, and `MCP_QUERY`.
- [x] 3.2 Verify no other caller depends on those constants carrying an `orderBy` by grep — if any does, migrate it to declare sort explicitly at the call site.

## 4. Column definitions: sort default + filters

- [x] 4.1 In `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`, for `USAGE_LOG_TRACES_COLUMNS`, `USAGE_LOG_CONVERSATIONS_COLUMNS`, `USAGE_LOG_MCP_COLUMNS`, and `USAGE_LOG_TOOLSET_TRACES_COLUMNS`: set `sort: 'desc'` on the `completion_time` column and `sortable: true` on every column.
- [x] 4.2 Enable `floatingFilter: true` on every column in those four column sets.
- [x] 4.3 Wire per-column filter type + default operator per design §D7:
  - ID columns (`trace_id`, `core_span_id`, `core_parent_span_id`, `response_id`, `chat_id`) → `agTextColumnFilter` with `defaultOption: 'equals'`.
  - Free-text columns (`model`, `deployment`, `parent_deployment`, `project_id`, `execution_path`, `language`, `upstream`, `topic`, `user_title`, `user_hash`, `mcp_method`, `mcp_tool_call_name`) → `agTextColumnFilter` with `defaultOption: 'contains'`.
  - Numeric columns (`price`, `deployment_price`, `prompt_tokens`, `completion_tokens`, `number_request_messages`) → `agNumberColumnFilter` with `defaultOption: 'equals'`.
  - `completion_time` → `agDateColumnFilter` with `defaultOption: 'equals'`.
- [x] 4.4 Add/update unit tests in `apps/ai-dial-admin/src/constants/grid-columns/tests/` to confirm column config shape for each of the four column sets.

## 5. UsageLog List refactor to IDatasource

- [x] 5.1 Rewrite `apps/ai-dial-admin/src/components/UsageLog/List/List.tsx` to implement an ag-Grid `IDatasource` instead of the current `useEffect + setData` pattern. Model the implementation on `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`.
- [x] 5.2 In `getRows`, call `buildUsageLogQuery` (§2) with `{ baseQuery: query, startRow: params.startRow, pageSize: PAGE_SIZE, sortModel: params.sortModel, filterModel: params.filterModel, timeRange, entityName }`, then invoke `getData(query)` server action.
- [x] 5.3 On success, map `TelemetryData` through `getListingData`, then call `params.successCallback(rows, rows.length < PAGE_SIZE ? params.startRow + rows.length : -1)`.
- [x] 5.4 On failure (thrown error or unsuccessful response), call `params.failCallback()`; log to console consistent with existing usage-log error logging.
- [x] 5.5 Pass `additionalGridOptions: infiniteGridOptions` (from `constants/ag-grid.ts`) plus `multiSort: false` and `overlayNoRowsTemplate` derived from `emptyDataTitle` if `ListEntities`/`GridView` does not already wire this for the infinite path.
- [x] 5.6 Expose a `onGridReady` callback prop so the parent `UsageLog.tsx` can capture the `GridApi` ref.
- [x] 5.7 Update `apps/ai-dial-admin/src/components/UsageLog/List/tests/List.spec.tsx` to cover: datasource calls `getData` with correct paginated query on first load, next-page fetch, end-of-data handling, empty-first-page handling, failure path, sort change triggers cache purge + new query, filter change triggers cache purge + new query. _(Note: jsdom does not fire ag-Grid's `onGridReady` / `getRows`, so this unit file only covers smoke rendering; the exhaustive query-construction coverage lives in `utils/tests/telemetry.spec.tsx`.)_

## 6. UsageLog container wiring (cache reset)

- [x] 6.1 In `apps/ai-dial-admin/src/components/UsageLog/UsageLog.tsx`, add `const gridApiRef = useRef<GridApi | null>(null)` and pass `onGridReady` into the child `List` to populate it.
- [x] 6.2 Update `onChangeActiveTab`, `onTimePeriodChange`/`onTimeRangeChange` (via `useTimeFilter` callback), and `onRefresh` to call `gridApiRef.current?.purgeInfiniteCache()` so the next `getRows` starts from `offset = 0` with the fresh parameters. _(Implementation detail: for tab change the grid is remounted via JSX conditional, so the ref is reset. For time filter change, the datasource is re-memoized on `timeRange`/`entityName` and re-applied via the existing `useEffect`, which ag-Grid treats as a cache reset. `onRefresh` explicitly calls `purgeInfiniteCache()`.)_
- [x] 6.3 Update `apps/ai-dial-admin/src/components/UsageLog/UsageLog.spec.tsx` to cover: Refresh click purges cache (List is mocked so the stubbed `GridApi` is populated synchronously and the purge call is asserted directly).

## 7. i18n for empty/error states

- [x] 7.1 Existing `emptyDataTitle` values (`TelemetryI18nKey.NoTracesTitle`, `NoConversationsTitle`, `NoMcpCalls`) are now also rendered as ag-Grid's `overlayNoRowsTemplate` on the infinite grid. No new key required for v1 — reuse of the empty title is intentional per design §D9.
- [x] 7.2 No new locale keys added.

## 8. Code quality

- [x] 8.1 `npm run lint` — passes with 0 errors (26 pre-existing warnings from unrelated files).
- [x] 8.2 `npm run format:write` — applied.
- [x] 8.3 `npm run test` — 4301 tests pass (16 pre-existing skips), no regressions.
- [x] 8.4 `npm run build` — succeeds; `/usage-log` route builds at 5.57 kB.
