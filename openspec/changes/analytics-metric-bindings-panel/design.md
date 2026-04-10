## Context

`AnalyticsTab` already calls both `getTestCaseRunResults` and `getMetricSnapshots`, but they are two separate `then` chains with only `isLoading` tied to the first. `snapshotsToBindingsMap` already converts `MetricSnapshot[]` into `Record<tsmdName, MetricBindings>` — the key matches `group.title` which comes from the outer key of `metricValues` in `AnalyticsResult`.

`RunMetricDetailPanel` renders per-group sections using `getMetricGroups`. Each group has a `title` that must match a `tsmdName` from the snapshot for bindings to be shown.

## Goals / Non-Goals

**Goals:**
- Single `isLoading` covers both fetches via `Promise.all`.
- `metricBindings: Record<string, MetricBindings>` stored in `AnalyticsTab` state and passed to `RunMetricDetailPanel`.
- New collapsible "Metric Bindings" sub-section inside each metric group: flat list, property + source-type chip + value.
- Tests for `getMetricSnapshots` (API, action, util).

**Non-Goals:**
- No config/input sub-grouping — bindings are shown flat regardless of which array they came from.
- No loading indicator inside the panel for bindings — if bindings haven't arrived at click time, section is silently absent.
- No changes to `analytics-api.ts`, `actions.ts`, or `utils.ts` (code already in place, only tests are missing).

## Decisions

### D1 — `Promise.all` for parallel fetch, single loader

**Decision**: Replace the two separate `.then` chains in `AnalyticsTab` with `Promise.all([getTestCaseRunResults(...), getMetricSnapshots(...)])`. A single `setIsLoading(true)` before and `setIsLoading(false)` in `.finally()` covers both.

**Rationale**: The current code sets `isLoading = false` after results arrive, before snapshots arrive. This means the grid can render and the user can click rows while snapshots are still in flight — they would then see no bindings even though they're available seconds later. `Promise.all` eliminates this window. Both fetches are fast and same-origin, so no meaningful UX penalty from waiting for both.

### D2 — `metricBindings` passed at row-click time (not via effect)

**Decision**: Store `metricBindings` as state in `AnalyticsTab`. Pass it to `RunMetricDetailPanel` via `sidebar.showSidebar(...)` inside `onRowClicked`. Include `metricBindings` in `useCallback` deps.

**Rationale**: `showSidebar` captures a ReactNode snapshot — the sidebar content does not live-update when parent state changes. Since `Promise.all` ensures bindings are loaded before the loader disappears (and therefore before rows are clickable), the value passed at click time will always be the fully resolved map. No effect-based re-open logic needed.

### D3 — Flat binding rows: property | source-type chip | value

**Decision**: Merge `configBindings` and `inputBindings` into a single flat list. Each row: `property` (label column), source-type chip (`[CONSTANT]` / `[TESTCASE]` / `[RESPONSE]`), value column.

**Value resolution**:
- `Constant` → `String(source.value)` (handles string, string[], Record[] via stringify)
- `TestCase` / `Response` → `source.columnName ?? ''`

**Source-type chip colors** — reuse the existing typeChip pattern from `AdaptiveValueRow`:
- `CONSTANT` → `text-accent-secondary bg-accent-secondary-alpha` (existing JSON/Array chip style)
- `TESTCASE` → `text-success bg-success-alpha`
- `RESPONSE` → `text-accent-primary bg-accent-primary-alpha`

**Rationale**: Flat list matches the user's stated preference. The existing typeChip CSS is already established as the in-app badge pattern; reusing it keeps visual consistency without new tokens.

### D4 — Metric Bindings sub-section uses `AdaptiveValueGrid` collapsible pattern

**Decision**: Wrap the bindings table in the same section/button toggle structure as `AdaptiveValueGrid` — title `RunsI18nKey.MetricBindings` with chevron, starts collapsed.

**Rationale**: Consistent with the newly established collapsed-by-default pattern for all detail panel sections. Bindings are supplementary context, not the primary result — collapsed default keeps the panel scannable.

### D5 — Grid layout for binding rows

**Decision**: Use a 3-column CSS grid (`grid-cols-[minmax(70px,140px)_auto_1fr]`) matching the `AdaptiveValueRow` column proportions. Property in col 1, chip in col 2, value in col 3.

**Rationale**: Aligns visually with the existing key-value rows above it in the same panel. Reuses proven column sizing rather than introducing a new table layout.

## Risks / Trade-offs

- **`tsmdName` ↔ `group.title` coupling** — `snapshotsToBindingsMap` keys by `tsmdName`; `group.title` comes from the `metricValues` record key. These are the same concept from the backend but different fields. If they ever diverge (e.g., metric renamed), bindings silently won't show. Acceptable for now — skip empty state is the spec.
- **`Promise.all` failure mode** — if one fetch fails, both are treated as failed (loader never clears unless `.catch` is added). Mitigation: wrap in try/catch or use `Promise.allSettled` and handle partial failure gracefully.
