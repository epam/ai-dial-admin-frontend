## 1. Shared name column sizing

- [x] 1.1 In `apps/ai-dial-admin/src/constants/grid-columns/`, add `nameColumnSizing` (`{ width: 400, minWidth: 260 }`) to `configs.ts` beside the other shared column partials, with no `flex`.
- [x] 1.2 Spread it into `NAME_COLUMN`, `DISPLAY_NAME_COLUMN` and `ASSET_NAME_COLUMN` in `base-columns.ts`, ahead of per-column overrides; the `_WITH_SORT` variants inherit it through their spread.

## 2. In-scope grids with their own name columns

- [x] 2.1 Spread the sizing into the name/ID columns of `TEST_SUITES_COLUMN` (Display Name, ID), `DATASETS_COLUMN` (Display Name) and `METRICS_COLUMN` (ID, Name) in `grid-columns.tsx`; leave the metric selection column's own `minWidth` alone.
- [x] 2.2 Audit the Interceptors grids (`components/EntityView/Interceptors/`, `GlobalInterceptors`, `InterceptorTemplates`) and the Export/Import column helpers (`components/ExportConfig/`, `components/EntityListView/Import/utils.ts`); Result: Interceptors and Export use only the shared definitions and inherit the sizing; the Import file-name grid and the schema, response and argument editors are not entity lists, so they are unchanged.
- [x] 2.3 Confirm `ExportConfig/analytics-utils.ts` lists entities rather than an Analytics view before touching it; leave Runs, Analytics, telemetry, consumption, queries and sessions column sets unchanged.

## 3. Unit tests

- [x] 3.1 In `src/constants/grid-columns/tests/grid-columns.spec.ts`, assert every in-scope name column definition carries `width: 400` and `minWidth: 260` and sets no `flex`, and that the Runs and Analytics definitions do not carry the sizing.
- [x] 3.2 Add a case to `src/components/Grid/tests/AgGridWrapper.spec.tsx` showing a name column definition with `width` is replaced by the operator's stored width once it is in `sizedColIds`, and keeps the definition's width when it is not.

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all at zero failures.
