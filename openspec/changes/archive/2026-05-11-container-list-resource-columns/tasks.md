## 1. i18n keys

- [x] 1.1 Check whether `EntityFieldsI18nKey.CPURequest`, `CPULimit`, `MemoryRequest`, `MemoryLimit`, `GPURequest` in `src/constants/i18n.ts` are suitable as column headers; if not, add short listing-specific keys (e.g., to a new `ContainerColumnsI18nKey` enum or extend an existing column-headers enum) with corresponding entries in `src/locales/en.ts`. _Existing `EntityFieldsI18nKey` keys are reused — no new keys needed._

## 2. Column utility module

- [x] 2.1 Create `src/utils/deployments/container-resource-columns.ts` exporting helpers used by the new column defs: a `toNumberOrNull(value: string | number | undefined): number | null` parser, a `getCpuColumnValue(raw: string | undefined): number | null` wrapping `convertCoresToMilliCores`, a `getMemoryColumnValue(raw: string | undefined): number | null` wrapping `convertBytesToMb`, a `getGpuColumnValue(raw: string | undefined): number | null` for plain integers, and matching `valueFormatter` functions that append ` m` / ` Mb` (no suffix for GPU) and render empty for `null`.
- [x] 2.2 Add `src/utils/deployments/tests/container-resource-columns.spec.ts` covering: defined and missing input, zero, fractional CPU, very large memory values, the empty-string output of the underlying converters, and `valueFormatter` output for `null`.

## 3. Column definitions

- [x] 3.1 In `src/constants/grid-columns/grid-columns.tsx`, extend `CONTAINERS_COLUMNS()` to append four resource `ColDef` entries (CPU request, CPU limit, memory request, memory limit) — each with `hide: true`, `field` pointing at the relevant `resources.requests.*` / `resources.limits.*` path, `headerName` via `t(...)`, `valueGetter` calling the helper from task 2.1, `valueFormatter` from task 2.1, `filter: 'agNumberColumnFilter'`, `sortable: true`.
- [x] 3.2 Inside the existing `route === ApplicationRoute.ModelServings` branch of `CONTAINERS_COLUMNS()`, append a fifth GPU column reading `resources.requests['nvidia.com/gpu']` with the same hide/sort/filter shape but no unit suffix. _Implemented as a separate route-conditional spread after the four shared columns rather than nested inside the existing source-columns conditional, to keep all five resource columns grouped together._
- [x] 3.3 Verify column ordering: place the resource columns after the `url` column and before the `AUTHOR_COLUMN` so they group together as advanced/optional columns, matching the precedent set by `url`.

## 4. Verify persistence interaction

- [x] 4.1 Read `getColumnVisibilityFromGridState` / `updateColumnVisibilityInStorage` in `src/components/Grid/utils.ts` and confirm new columns appear in the panel for users with pre-existing localStorage entries; if reconciliation strips unknown columns, fix the merge so new columns default to `hide: true` rather than being dropped silently. _Confirmed: `getColumnVisibilityFromGridState` maps over the current `columnDefs` and only overrides `hide` when a matching `storedCol` is found — new columns retain their `hide: true` default. No fix needed._

## 5. Tests for `CONTAINERS_COLUMNS`

- [x] 5.1 Add or extend a test file co-located with `grid-columns.tsx` (e.g. `src/constants/grid-columns/tests/grid-columns.spec.tsx`) asserting that:
    - calling `CONTAINERS_COLUMNS(ApplicationRoute.ModelServings, ...)` returns the four CPU/memory columns plus the GPU column;
    - calling it with `ApplicationRoute.McpContainers`, `AdapterContainers`, `ApplicationContainers`, `InterceptorContainers` returns the four CPU/memory columns and NOT the GPU column;
    - each new column has `hide: true`, `sortable: true`, `filter: 'agNumberColumnFilter'`, and the expected `field`;
    - the `valueGetter` returns the converted number (or `null`) for representative `Container` row data;
    - the `valueFormatter` produces the expected `m` / `Mb` / GPU-bare strings, and empty string for `null`.

## 6. Code quality

- [x] 6.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root and address any failures.
