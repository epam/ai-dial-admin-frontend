## 1. Constants and Types

- [x] 1.1 Add `DASHBOARD_VIEW_TYPE` enum (`Chat`, `Mcp`) to `src/types/telemetry.ts`
- [x] 1.2 Add MCP query constants to `src/constants/telemetry.tsx`: `MCP_TOTAL_CALLS_QUERY`, `MCP_TOOL_CALLS_QUERY`, `MCP_UNIQUE_USERS_QUERY`, `MCP_CONSUMPTION_QUERY`, `MCP_CALLS_BY_DEPLOYMENT_QUERY` with extra conditions constants
- [x] 1.3 Add MCP table column definitions to `src/constants/grid-columns/grid-columns.tsx`: `MCP_CONSUMPTION_COLUMNS`, `TOOLS_CONSUMPTION_COLUMNS`, `MCP_CALLS_BY_DEPLOYMENT_COLUMNS`, `MCP_PROJECTS_CONSUMPTION_COLUMNS`
- [x] 1.4 Add new i18n keys to `src/constants/i18n.ts` and locale files
- [x] 1.5 Add `orderBy` to `TelemetryQuery` interface in `src/models/telemetry.ts`
- [x] 1.6 Add `TOOLSET_DEPLOYMENT_PREFIX` constant and `MCP_TABLE_NAME` to `src/constants/telemetry.tsx`
- [x] 1.7 Replace `ENTITY_QUERY`/`PROJECT_QUERY` constants with `getEntityQuery(tableName)`/`getProjectQuery(tableName)` factory functions
- [x] 1.8 Add `mcp_tool_call_name` to `TELEMETRY_GRID_HEADERS_MAP`

## 2. View By Dropdown Component

- [x] 2.1 Create `ViewByFilter` component in `src/components/Telemetry/TelemetryControls/ViewByFilter.tsx` — dropdown with Chat/MCP options using `SelectSize.Sm` and `SelectVariant.Secondary`

## 3. MCP Dashboard Layout

- [x] 3.1 Create `McpSingleValueChartsDashboard.tsx` — Unique Users full-width on top, Total MCP Calls + Total Tool Calls side-by-side below, positioned right of chart
- [x] 3.2 Create `McpDashboard.tsx` — MCP layout with `isEntityView` prop to conditionally hide MCP Consumption table and show no-data for Calls by Deployment in entity views

## 4. Dashboard Integration

- [x] 4.1 Add `showFilters` and `isMcpView` props to `TelemetryControls`
- [x] 4.2 Update `Dashboard.tsx`: `viewType` state, `isMcpOnly` flag for Toolsets/AssetsToolsets, `entityFilterName` with `TOOLSET_DEPLOYMENT_PREFIX` for asset toolsets, `ViewByFilter` for Dashboard/Applications routes, clear filters on view switch
- [x] 4.3 `getData` and `getMcpDataWithConditions` use `structuredClone` to prevent query mutation
- [x] 4.4 `getCurrentTimeRange` recomputes fresh dates for preset periods on each `getData` call (auto-refresh fix)
- [x] 4.5 `getMcpDataWithConditions` factory for queries with extra static conditions (tool calls, calls by deployment)

## 5. Filter Updates

- [x] 5.1 Add `isMcpView` prop to `Filters` component; use `getEntityQuery(tableName)`/`getProjectQuery(tableName)` to fetch filter lists from correct table
- [x] 5.2 Remove `.toLowerCase()` from entity name and filter values in `getFormattedDataFilters`
- [x] 5.3 Add `extraConditions` parameter to `getFormattedFilters`

## 6. Entity Audit Integration

- [x] 6.1 Add `ApplicationRoute.Toolsets` and `ApplicationRoute.AssetsToolsets` to `getAuditTabs` dashboard condition
- [x] 6.2 Add `auditTab` to `getTabsForAsset` for `AssetsToolsets` gated by `dashboardEnabled` feature flag
- [x] 6.3 Add `EntityAudit` rendering in Asset Toolsets `TabsContent.tsx`
- [x] 6.4 Update `TelemetryGrid` to accept optional `null` query (renders no-data without API call)

## 7. Tests

- [x] 7.1 Add unit tests for `ViewByFilter` component
- [x] 7.2 Add unit tests for `McpDashboard` component
- [x] 7.3 Add unit tests for `Dashboard` view switching
- [x] 7.4 Update `getTabsForAsset` test for `AssetsToolsets` with `dashboardEnabled` flag

## 8. Quality Checks

- [x] 9.1 Run lint, format, and type checks — all errors fixed
- [x] 9.2 Run all tests — 382 files, 3269 tests pass
