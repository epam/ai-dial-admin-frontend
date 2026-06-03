## Context

The Telemetry call dashboards (Consumption, MCP, Route) render grids via `TelemetryGrid` → `GridView` → `AgGridWrapper` (AG Grid). Column defs live in `constants/grid-columns/grid-columns.tsx`. Row data is built by `getGridData` (`utils/telemetry.ts`), which maps raw backend values straight into row objects with no normalization — so an empty project `name` renders as a blank cell, and a `parent_deployment` the backend serializes as `"undefined"` renders as that literal text.

`AgGridWrapper` already sets a default `tooltipValueGetter`/`tooltipComponent` that makes the whole cell hoverable, but it draws no icon. The repo already has the exact pattern we need for "text + ⓘ tooltip": `components/Grid/CellRenderers/ImportValidationCellRenderer.tsx` uses `DialTooltip` + `IconInfoCircle` and resolves text via `useI18n()`.

`AgGridWrapper` also supports a right-click context menu with a **Copy** action (`onCellContextMenu` → `CellContextMenu`). The copied value comes from `event.api.getCellValue({ useFormatter: true })` (`AgGridWrapper.tsx:230`), which applies the column's **`valueFormatter`** but ignores the `cellRenderer`. So a cellRenderer alone fixes the display but the copy would still write `""` / `"undefined"`.

## Goals / Non-Goals

**Goals:**
- Replace blank / `undefined` cells with a clear labeled state plus an ⓘ tooltip, matching the issue screenshots.
- Keep the fix presentational and localized.
- Reuse the existing cell-renderer + tooltip pattern.

**Non-Goals:**
- Changing `getGridData` or backend data normalization.
- Touching grids other than the five call-dashboard grids in scope.
- Adding native AG Grid hover tooltips without an icon (the icon is required to match the design).

## Decisions

- **`valueFormatter` is the single source of the label; the renderer only adds the ⓘ.** The fallback label is produced by a `valueFormatter` (`isMissing(value) ? t(labelKey) : value`). This makes the label appear in the cell *and* in the copied value (copy uses `getCellValue({ useFormatter: true })`). The `TelemetryFallbackCellRenderer` reads `params.valueFormatted` for its text and only decides whether to draw the `IconInfoCircle` + `DialTooltip` based on `isMissing(params.value)`. No label string is duplicated between formatter and renderer.
- **"Missing" = falsy OR literal `"undefined"`.** A shared predicate (`!value || value === 'undefined'`) covers both the blank project case and the stringified `undefined` parent-deployment case, used by both the formatter and the renderer.
- **Factory columns to feed `t` into the formatter.** `valueFormatter` is a plain function and cannot call the `useI18n()` hook, so the five affected column-def constants become `(t) => ColDef[]` factories — matching the existing `CONTAINERS_COLUMNS = (t, …) => [...]` pattern. The tooltip string is passed to the renderer via `cellRendererParams: { tooltip: t(tooltipKey) }`, so the renderer itself needs no `t` and stays purely presentational.
- **Four new i18n keys** under `TelemetryI18nKey` + `en.ts`: `NoProject` = `No Project`, `NoProjectTooltip` = `Called outside of any project`, `DirectCall` = `Direct call`, `DirectCallTooltip` = `Called directly via Try out - no parent deployment`.
- **Wire into 5 column defs**: project `name` columns (`PROJECT_GRID_COLUMNS`, `MCP_PROJECTS_CONSUMPTION_COLUMNS`, `CALL_BY_PROJECT_COLUMNS`) use label `NoProject` / tooltip `NoProjectTooltip`; parent-deployment columns (`MCP_CALLS_BY_DEPLOYMENT_COLUMNS`, `CALL_BY_PARENT_DEPLOYMENT_COLUMNS`) use `DirectCall` / `DirectCallTooltip`. Update the three dashboards (`ConsumptionDashboard`, `RouteDashboard`, `McpDashboard`) to call the factories with their existing `t`.

## Risks / Trade-offs

- **Filtering/sorting on the fallback column.** We use `valueFormatter`, not `valueGetter`, so AG Grid still filters/sorts on the raw value — missing rows group as empty / `"undefined"` and typing "No Project" in a filter won't match. Accepted: keeps the change presentational and avoids altering the data AG Grid operates on. (If filter-by-label is later wanted, add a `filterValueGetter`.)
- **Factory conversion blast radius.** Converting the five consts to `(t) => ColDef[]` touches three dashboards and `grid-columns.spec.ts`. All three dashboards already hold a `t`, so each call site is a one-token change; the spec must call `PROJECT_GRID_COLUMNS(t)` with a mock `t`.
- **`getGridData` left untouched** means any future grid reading `parent_deployment` could still show `"undefined"`. Accepted per the presentational-only scope; the shared `isMissing` predicate can be reused if needed.
- **Native default tooltip vs ⓘ tooltip.** For populated cells the existing default hover-tooltip still applies; for fallback cells the ⓘ tooltip is the intended affordance. The default `tooltipValueGetter` would show the raw value (`""`/`"undefined"`) on cell-body hover — optionally override per column to use `valueFormatted` so the body tooltip matches the label.
