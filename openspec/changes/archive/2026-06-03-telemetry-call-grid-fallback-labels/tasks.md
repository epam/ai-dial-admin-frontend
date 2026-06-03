## 1. i18n keys

- [x] 1.1 Add `NoProject`, `NoProjectTooltip`, `DirectCall`, `DirectCallTooltip`, `DirectCallByKeyOrUserTooltip` to `TelemetryI18nKey` in `constants/i18n.ts`
- [x] 1.2 Add matching strings to `locales/en.ts` Telemetry block: `No Project`, `Called outside of any project`, `Direct call`, `Called directly via Try out - no parent deployment` (MCP), `Called directly by key or user - no parent deployment` (Route)

## 2. Fallback cell renderer

- [x] 2.1 Add `TelemetryFallbackCellRenderer` in `components/Grid/CellRenderers/`, modeled on `ImportValidationCellRenderer` (uses `DialTooltip` + `IconInfoCircle`, info icon directly after the label)
- [x] 2.2 Export a shared `isMissingTelemetryValue` predicate (`!value || value === 'undefined'`)
- [x] 2.3 Render `params.valueFormatted ?? params.value` as the cell text; when `isMissingTelemetryValue(params.value)`, append `IconInfoCircle` in a `DialTooltip` showing the `tooltip` from `cellRendererParams` (renderer takes no `t`)

## 3. Reusable column defs (`constants/grid-columns/base-columns.ts`)

- [x] 3.1 Add `CALLS_PROJECT_COLUMN = (t) => ColDef` (field `name`, header `Project`) with `valueFormatter` → `NoProject`, `cellRenderer: TelemetryFallbackCellRenderer`, `cellRendererParams: { tooltip: t(NoProjectTooltip) }`
- [x] 3.2 Add `CALLS_PARENT_DEPLOYMENT_COLUMN = (t, tooltipKey = DirectCallTooltip) => ColDef` (field `parent_deployment`, header `Parent Deployment`) with `valueFormatter` → `DirectCall`, `cellRendererParams: { tooltip: t(tooltipKey) }` — tooltip key defaults to the MCP "via Try out" message, overridable per grid

## 4. Wire into call-dashboard grids (`constants/grid-columns/grid-columns.tsx`)

- [x] 4.1 Convert the five column consts to `(t) => ColDef[]` factories reusing the base columns: `PROJECT_GRID_COLUMNS`, `MCP_PROJECTS_CONSUMPTION_COLUMNS`, `CALL_BY_PROJECT_COLUMNS` use `CALLS_PROJECT_COLUMN(t)`; `MCP_CALLS_BY_DEPLOYMENT_COLUMNS` uses `CALLS_PARENT_DEPLOYMENT_COLUMN(t)` (default tooltip), `CALL_BY_PARENT_DEPLOYMENT_COLUMNS` uses `CALLS_PARENT_DEPLOYMENT_COLUMN(t, DirectCallByKeyOrUserTooltip)`
- [x] 4.2 Update call sites to pass `t`: `ConsumptionDashboard.tsx`, `RouteDashboard.tsx`, `McpDashboard.tsx`
- [x] 4.3 `constants/grid-columns/tests/grid-columns.spec.ts`: update `PROJECT_GRID_COLUMNS` usage to call the factory with a mock `t`
