## Why

On the Telemetry call dashboards, rows whose backend value is empty render poorly: the project-name grids show a blank cell when a call was made outside any project, and the parent-deployment grids show the literal string `undefined` when a call had no parent deployment (e.g. a direct Try-out call). Both read as broken data rather than a meaningful state. (Issue #3529)

## What Changes

- Add a presentational fallback in the call-dashboard grids: when a cell's value is missing it renders an explanatory label plus an info-circle (ⓘ) tooltip, instead of a blank cell or `undefined`.
  - **Project name** column → label `No Project`, tooltip `Called outside of any project`.
  - **Parent deployment** column → label `Direct call`, tooltip `Called directly via Try out - no parent deployment`.
- Cells with a real value are unchanged.
- A value is treated as missing when it is falsy **or** the literal string `"undefined"` (covers the parent-deployment case).
- The fallback label also flows through to the **copy** action: right-click → Copy on a fallback cell copies `No Project` / `Direct call`, not an empty string or `undefined`. (The grid's copy reads `getCellValue({ useFormatter: true })`, so the label must come from a `valueFormatter`, not just the cell renderer.)
- Add four i18n keys for the new labels/tooltips.
- Convert the five affected column-def constants to factory functions `(t) => ColDef[]` so the `valueFormatter` (which cannot use the `useI18n()` hook) can resolve the localized labels — following the existing `CONTAINERS_COLUMNS` factory pattern.
- Scope: the three project-name grids (Consumption "Calls by Projects", MCP, Route) and the two parent-deployment grids (MCP, Route).
- The fix is presentational only — `getGridData` and backend data are not changed; filtering/sorting continue to operate on the raw value.

## Capabilities

### New Capabilities
- `telemetry-call-grid-fallback-labels`: Defines how Telemetry call-dashboard grids render missing project-name and parent-deployment values as labeled fallback cells with info tooltips.

### Modified Capabilities
<!-- none: no existing spec captures this behavior -->

## Impact

- `apps/ai-dial-admin/src/components/Grid/CellRenderers/` — new fallback cell renderer (modeled on `ImportValidationCellRenderer`, using `DialTooltip` + `IconInfoCircle`).
- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — convert 5 column defs to `(t) => ColDef[]` factories and add `valueFormatter` + `cellRenderer`: `PROJECT_GRID_COLUMNS`, `MCP_PROJECTS_CONSUMPTION_COLUMNS`, `CALL_BY_PROJECT_COLUMNS` (field `name`); `MCP_CALLS_BY_DEPLOYMENT_COLUMNS`, `CALL_BY_PARENT_DEPLOYMENT_COLUMNS` (field `parent_deployment`).
- Call sites that must pass `t` (all already call `useI18n()`): `ConsumptionDashboard.tsx`, `RouteDashboard.tsx`, `McpDashboard.tsx`.
- `apps/ai-dial-admin/src/constants/i18n.ts` + `apps/ai-dial-admin/src/locales/en.ts` — four new `TelemetryI18nKey` entries.
- Tests: new renderer spec; update `constants/grid-columns/tests/grid-columns.spec.ts` for the `PROJECT_GRID_COLUMNS` factory signature; existing dashboard specs unaffected in behavior.
