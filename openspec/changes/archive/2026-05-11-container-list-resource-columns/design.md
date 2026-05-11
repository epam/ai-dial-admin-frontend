## Context

`CONTAINERS_COLUMNS()` in `src/constants/grid-columns/grid-columns.tsx:602` defines the AG Grid column array shared by five container listing routes: `/model-servings`, `/mcp-containers`, `/adapter-containers`, `/application-containers`, `/interceptor-containers`. The function already takes the route as an argument and switches between source-column variants based on it, so per-route conditional inclusion is an established pattern in the same function.

Container compute resources live on `Container.resources` (see `src/types/deployments/containers.ts:66`):

```ts
interface ContainerResources {
  limits?:   Record<string, string | undefined>;
  requests?: Record<string, string | undefined>;
}
```

Values are stored in raw k8s units — cores for CPU (e.g. `"2"`, `"0.5"`) and bytes for memory (e.g. `"4294967296"`). The container detail view (`src/components/Deployments/Fields/ContainerResources/CPUFields.tsx`, `MemoryFields.tsx`) renders these via the existing utils `convertCoresToMilliCores` and `convertBytesToMb` (`src/utils/deployments/containers.ts`) so the form always displays CPU in millicores with an `m` postfix and memory in megabytes with an `Mb` postfix.

GPU is keyed under `resources.requests['nvidia.com/gpu']`. The form mirrors the value into both `requests` and `limits` on write but reads only from `requests` for display — established by `ContainerResources.tsx:92`. GPU input is gated to `ApplicationRoute.ModelServings` (`ContainerResources.tsx:86`).

Existing listing columns are hidden-by-default via `hide: true` on the `ColDef` (`url` is the precedent in `CONTAINERS_COLUMNS`). Column visibility/order is persisted per route in localStorage by `GridView` + `ColumnsPanel` via `storageKey={route}` (`src/components/Grid/utils.ts`).

## Goals / Non-Goals

**Goals:**
- Five resource columns selectable from the existing column panel on container listings.
- Display format identical to the container detail view: millicores with `m`, megabytes with `Mb`, GPU as integer.
- Numeric sort and numeric filter on the same converted value the user sees.
- Zero impact on users who don't opt in (hidden by default, no behavior change to other columns).

**Non-Goals:**
- New column-management UI. The existing `ColumnsPanel` is reused as-is.
- Backend changes. Resource data is already returned on `Container`.
- Resource columns on `/deployment-images`. Different list component, different entity (image metadata, not running containers).
- Auto unit-switching (`Gi`/`Mi`/`Ki`) based on magnitude. Consistency with the detail view is preferred; users learn one format.
- Edit-in-grid for resources. Listing is read-only; edits stay in the detail view.

## Decisions

### Decision 1: Five separate columns, not one combined "Resources" column

**Choice:** One column each for CPU req, CPU limit, Memory req, Memory limit, GPU.

**Rationale:** The driving use case is "find the GPU-heavy serving" or "spot the over-allocated CPU limit" — operations that require sortable, filterable, per-axis values. A single combined column would render a compact summary string but couldn't be sorted by limit or filtered by ">= 4Gi memory".

**Alternatives considered:**
- One "Resources" column with a compact summary (`CPU 500m/2 · MEM 4Gi/8Gi · GPU 1`): denser, one toggle, but defeats the sort/filter use case.
- Three columns (CPU, Memory, GPU) with `request / limit` rendered in one cell: fewer toggles but same sort/filter limitation, and users only interested in limits pay visual cost for requests.

### Decision 2: Reuse `convertCoresToMilliCores` / `convertBytesToMb` for both display and sort/filter

**Choice:** A `valueGetter` parses the stored string through the existing converter and returns a `number`. A `valueFormatter` appends ` m` / ` Mb` for display. AG Grid's `agNumberColumnFilter` and default numeric sort then operate on the converted value.

```ts
{
  field: 'resources.requests.cpu',
  headerName: t(...),
  hide: true,
  valueGetter: (p) => toNumberOrNull(convertCoresToMilliCores(p.data?.resources?.requests?.cpu)),
  valueFormatter: (p) => p.value == null ? '' : `${p.value} m`,
  filter: 'agNumberColumnFilter',
  sortable: true,
}
```

**Rationale:** One source of truth for unit conversion (matching the detail view exactly was an explicit user requirement). User-typed filter values (`500`, `4096`) align with what they see in the cell. No new parser, no k8s suffix-aware logic. Sort is numeric for free.

**Alternatives considered:**
- Render the raw stored value (`"4294967296"` bytes) and write a custom k8s-suffix parser for sort/filter: would diverge from the detail view's display and force users to think in raw bytes.
- Render with `Gi`/`Mi` based on magnitude: explicitly rejected by the user — "no need to convert to Gi". Auto-units also break filter UX ("4 in this row means 4Gi, but in that row means 4Mi").

### Decision 3: GPU column scoped to model-servings via the existing route argument

**Choice:** Add the GPU column to the returned array only when `route === ApplicationRoute.ModelServings`, inside the existing `route`-driven conditional block in `CONTAINERS_COLUMNS()`.

**Rationale:** The detail view already hides the GPU input on non-model-servings routes (`ContainerResources.tsx:86`). Listing visibility should match. CPU/memory remain on all five routes — they're meaningful for every container type.

### Decision 4: All five columns `hide: true` by default

**Choice:** Hidden by default; user opts in via the column panel; selection persists per route via the existing localStorage key.

**Rationale:** Many containers have empty `resources`, so showing the columns by default would mean five mostly-blank columns for every user out of the box. Existing precedent (`url` column) is hidden-by-default. No migration needed for users with saved column state — new columns simply default to hidden.

### Decision 5: Extract converters/formatters into a small utility with tests

**Choice:** Put the `valueGetter` / `valueFormatter` / a `toNumberOrNull` helper in `src/utils/deployments/container-resource-columns.ts` (or co-located next to the column definitions) and unit-test the formatting/parsing edge cases.

**Rationale:** Project rule: extract pure functions into utils files with tests. Edge cases worth testing: `undefined` / empty-string / `"0"` values, GPU with non-integer values, and the conversion utilities returning empty strings.

## Risks / Trade-offs

- **Risk:** A user with previously-saved column state (in localStorage under the route's `GRID_COLUMNS_KEY`) might not see the new columns in the panel if the existing reconciliation strips unknown columns.
  **Mitigation:** Verify `getColumnVisibilityFromGridState` merges saved state with current column defs rather than replacing wholesale. If it does replace, append the new column defs to saved state on load.

- **Risk:** Sorting "request only" vs "value present in both request and limit" rows mixes apples and oranges — a row with `cpu request = 500m` and no limit will appear above one with `limit = 1` if only the limit column is sorted.
  **Mitigation:** Accept it; sort is per-column, so users sorting by "CPU limit" expect rows missing a limit to fall to the bottom (AG Grid default for null values).

- **Risk:** `convertBytesToMb` / `convertCoresToMilliCores` may return non-numeric strings (e.g., empty string) for missing values; the `valueGetter` must coerce safely.
  **Mitigation:** `toNumberOrNull` helper returns `null` when parsing fails so AG Grid treats the cell as empty (sorts to bottom, filter shows blank). Covered by unit tests.

- **Trade-off:** GPU values stored as fractional strings (rare but possible) will sort/filter as numbers, displayed as the converter output. Acceptable — GPU is almost always integer in practice.

- **Trade-off:** No tooltip on resource cells. If a value is exotic (e.g., GPU as `"nvidia.com/mig-1g.10gb"`), the converter may render unexpectedly. Out of scope for this change; the detail view remains the source of truth for editing.

## Migration Plan

1. No data migration. Backend unchanged.
2. Deploy in a single PR. New columns are hidden by default, so the listings look identical until a user opens the column panel.
3. Rollback: revert the PR. No persistent side effects beyond the user's localStorage entry which only records the user's panel choices and harmlessly references columns that no longer exist.

## Open Questions

- Should column headers use the same i18n keys as the detail-view labels (`EntityFieldsI18nKey.CPURequest`, etc.) to avoid duplicate strings? Default assumption: reuse existing keys; only add new keys if shorter listing-friendly labels are needed.
