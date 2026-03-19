## Context

The Telemetry Dashboard (`Dashboard.tsx`) currently renders a fixed layout: a line chart, 4 stat cards, and 2 grids (entity consumption + project consumption). All queries target the `analytics` InfluxDB table. The controls bar includes time period, filters (Entity/Project), and auto-refresh.

We need to add an MCP view that replaces the dashboard body with MCP-specific widgets while reusing the same component infrastructure and API endpoint. The MCP view should also be available in entity audit views for Toolsets and Asset Toolsets.

## Goals / Non-Goals

**Goals:**
- Add a "View by" dropdown (Chat | MCP) to the main dashboard and Applications/Models entity audit
- Force MCP-only view for Toolsets and Asset Toolsets entity audit
- Render an MCP-specific layout when MCP is selected
- Reuse existing chart, stat card, grid, and control components
- Support Entity/Project filters on MCP view with filter lists fetched from `mcp_analytics`
- Show no-data state for widgets whose queries aren't ready yet
- Fix auto-refresh to use fresh time ranges for preset periods
- Fix query constant mutation via deep cloning

**Non-Goals:**
- No new API endpoints or backend changes
- No URL/routing changes for view switching
- No per-column search/filter in MCP tables

## Decisions

### 1. View switcher as state in Dashboard component

**Decision:** Add a `viewType` state (`Chat | Mcp`) to `Dashboard.tsx` and conditionally render the body. Add `isMcpOnly` flag derived from route for Toolsets/Asset Toolsets which forces MCP view without showing the switcher.

**Why:** The "View by" dropdown is ephemeral UI state. For entity audit views, the route determines whether MCP is forced. Keeping it as local state + route-derived flag is the simplest approach.

### 2. New McpDashboard component for the MCP body

**Decision:** Create `McpDashboard.tsx` with an `isEntityView` prop to conditionally hide the MCP Consumption table and show no-data for Calls by Deployment when viewing a specific entity.

**Why:** Entity views already filter by deployment, so MCP Consumption (grouped by deployment) is redundant. Calls by Deployment in entity context needs a "caller deployment" field not yet available from the backend.

### 3. Stat cards layout: Unique Users on top, two below

**Decision:** `McpSingleValueChartsDashboard.tsx` renders Unique Users full-width on top, Total MCP Calls and Total Tool Calls side-by-side below, positioned to the right of the line chart.

**Why:** Matches the design mockup layout.

### 4. Entity/Project filters supported on MCP view

**Decision:** Filters remain visible on MCP view. `Filters` component accepts `isMcpView` prop and uses factory functions `getEntityQuery(tableName)` / `getProjectQuery(tableName)` to fetch filter dropdown lists from the correct table. Filters are cleared when switching between Chat and MCP views.

**Why:** MCP data supports the same Entity/Project filter fields. Clearing filters on view switch prevents stale filter values from silently returning empty results.

### 5. Extra query conditions via getData wrappers

**Decision:** Queries with static conditions (e.g., `mcp_method = 'tools/call'`, `mcp_tool_call_name != 'undefined'`) define extra conditions as constants. `Dashboard.tsx` creates `getMcpDataWithConditions` factory that merges these with time/filter conditions. `getFormattedFilters` accepts an optional `extraConditions` parameter.

**Why:** Keeps query constants clean (no `where` clause) while supporting per-query static filters. The factory pattern avoids duplicate getData callbacks for each query.

### 6. Query mutation prevention

**Decision:** `getData` and `getMcpDataWithConditions` use `structuredClone(query)` before mutating the `where` clause.

**Why:** Query constants are module-level shared objects. Without cloning, concurrent calls from multiple components mutate the same object, causing race conditions.

### 7. Auto-refresh time range fix

**Decision:** `getData` computes fresh time range on each call via `getCurrentTimeRange()` which calls `getTimeRangeById(timePeriod)` for preset periods (producing fresh `new Date()`). Custom date ranges use the stored `timeRange` state.

**Why:** Previously, `timeRange` was computed once when the user selected a period and never updated during auto-refresh intervals, causing stale date ranges.

### 8. Asset Toolset entity filter with deployment prefix

**Decision:** For `ApplicationRoute.AssetsToolsets`, the entity filter uses `entity.path` prefixed with `TOOLSET_DEPLOYMENT_PREFIX` (`'toolsets/'`) to match the InfluxDB `deployment` field format.

**Why:** InfluxDB stores MCP deployment IDs as `toolsets/<path>/<name>__<version>` but asset entity `path` omits the `toolsets/` prefix.

### 9. Asset Toolset Audit tab gated by feature flag

**Decision:** `getTabsForAsset` accepts optional `featureFlags` parameter. The Audit tab for Asset Toolsets only appears when `dashboardEnabled` is true.

**Why:** Prevents showing an empty audit view when the telemetry feature is disabled.

### 10. Filter value case sensitivity

**Decision:** Removed `.toLowerCase()` from entity name and user filter values in `getFormattedDataFilters`.

**Why:** The backend InfluxDB queries are case-sensitive. Lowercasing silently broke filters for values with uppercase characters.

## Risks / Trade-offs

- **[Risk] Missing backend queries** → Line chart, Tools Consumption, Projects Consumption, and entity-view Calls by Deployment show no-data. Mitigation: Components handle empty data gracefully. Queries can be added later without UI changes.
- **[Risk] `structuredClone` performance** → Deep cloning on every getData call adds overhead. Mitigation: Query objects are small (few KB), and cloning is fast for simple JSON structures.
- **[Risk] Case-sensitivity change affects Chat filters** → Removing `toLowerCase()` is a behavioral change for existing Chat dashboard filters. Mitigation: The Chat analytics data is also case-sensitive in InfluxDB, so this fix is correct for both views.
- **[Trade-off] Separate McpDashboard vs unified component** → Slightly more code, but zero risk to existing Chat dashboard and cleaner separation of concerns.
