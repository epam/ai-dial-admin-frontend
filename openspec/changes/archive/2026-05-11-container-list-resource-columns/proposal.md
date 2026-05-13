## Why

Container compute resource values (CPU/memory requests and limits, GPU) are only visible inside each container's detail view today. Users browsing the model-servings / mcp / adapter / application / interceptor container listings have no way to compare resource allocation across containers, find the GPU-consuming serving, or spot misconfigured limits without opening every row. Issue #1441 asks for resource columns in the listing so operators can scan, sort, and filter on these values directly.

## What Changes

- Add resource columns to the shared container list column set in `src/constants/grid-columns/grid-columns.tsx` (`CONTAINERS_COLUMNS`):
  - **CPU req** — value of `resources.requests.cpu`
  - **CPU limit** — value of `resources.limits.cpu`
  - **Memory req** — value of `resources.requests.memory`
  - **Memory limit** — value of `resources.limits.memory`
  - **GPU** — value of `resources.requests['nvidia.com/gpu']`, scoped to the model-servings route only (matches the existing route-conditional GPU field on the detail view)
- Columns are **hidden by default**; users opt in via the existing column panel and the choice is persisted to localStorage like every other column on these listings.
- Cell rendering reuses the existing `convertCoresToMilliCores` and `convertBytesToMb` converters so listing values match the detail view exactly: CPU in millicores with an `m` suffix, memory in megabytes with an `Mb` suffix, GPU as a plain integer. No new unit-conversion logic, no switching to `Gi`/`Mi` per-row.
- Sorting and filtering operate on the same converted numeric value the user sees: typing `500` matches `500 m`, typing `4096` matches `4096 Mb`. AG Grid's `agNumberColumnFilter` is used so range/comparison filters work.
- Add new i18n keys for the five column headers.
- `/deployment-images` is **out of scope** — it uses a different list component for image metadata, not running containers, and has no compute resources.

## Capabilities

### New Capabilities
- `container-list-resource-columns`: Optional resource columns (CPU req/limit, memory req/limit, GPU) on container listing pages, sortable and filterable numerically, displayed in the same fixed units as the container detail view.

### Modified Capabilities
- _None._ The change adds column definitions to an existing shared array; it does not change requirements of any existing capability spec.

## Impact

- **Code**:
  - `src/constants/grid-columns/grid-columns.tsx` — extend `CONTAINERS_COLUMNS()` with the five column defs and the route conditional for GPU.
  - `src/constants/i18n.ts` and `src/locales/en.ts` — five new header keys.
  - Likely a small co-located utils file for the AG Grid `valueGetter` / `valueFormatter` / `comparator` wrappers around the existing converters, with unit tests.
- **No backend changes.** The data is already on the `Container` entity and returned by existing endpoints.
- **No migration.** New columns default to hidden, so existing users' saved column preferences continue to work; if a user has never visited the column panel, their view is unchanged.
- **Affected listings**: `/model-servings`, `/mcp-containers`, `/adapter-containers`, `/application-containers`, `/interceptor-containers`. `/deployment-images` is unaffected.
