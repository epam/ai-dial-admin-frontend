## Why

The Telemetry Dashboard currently only shows Chat analytics (requests, tokens, costs). With MCP (Model Context Protocol) adoption growing, admins need visibility into MCP usage — total calls, tool usage, per-deployment and per-project breakdowns. Adding an MCP view to the existing dashboard and entity audit views provides this without requiring separate pages.

## What Changes

- Add a "View by" dropdown to the dashboard controls bar with options: **Chat** (default) and **MCP**
- "View by" switcher available on: main Dashboard page, Applications entity audit
- When "MCP" is selected, replace the dashboard body with an MCP-specific layout:
  - Line chart: "Request per MCP usage" (no-data until query ready)
  - 3 stat cards: Unique Users, Total MCP Calls, Total Tool Calls
  - 4 tables: MCP Consumption, Tools Consumption, Calls by Deployment, Projects Consumption
- Entity/Project filters supported on MCP view — filter dropdown lists fetched from `mcp_analytics` table
- Filters reset when switching between Chat and MCP views
- Add MCP-only dashboard to Toolsets and Asset Toolsets entity audit views (no Chat option)
  - Asset Toolsets: Audit tab gated by `dashboardEnabled` feature flag
  - Entity view hides MCP Consumption table (redundant when pre-filtered)
  - Calls by Deployment shows no-data in entity view (needs caller deployment field from backend)
- Asset Toolset entity filter uses full deployment path (`toolsets/<path>`) to match InfluxDB data
- Queries target `mcp_analytics` table via the same API endpoint
- Widgets without ready queries show existing no-data state
- Fix: auto-refresh now computes fresh time range on each tick for preset periods (affects both Chat and MCP)
- Fix: `getData` clones query objects before mutation to prevent race conditions
- Fix: removed `.toLowerCase()` from filter values (backend is case-sensitive)
- Added `orderBy` support to `TelemetryQuery` interface

## Non-goals

- No new routes or URL changes — the "View by" switch is ephemeral UI state
- No per-column search/filter in tables for now
- No new API endpoints — reuse existing telemetry data endpoint
- No token or cost metrics for MCP (only call counts and user counts)

## Capabilities

### New Capabilities

- `mcp-dashboard-view`: Dashboard view switcher and MCP-specific layout with charts, stat cards, and tables querying `mcp_analytics`, including entity audit integration for Toolsets and Asset Toolsets

### Modified Capabilities

_(none — the existing Chat dashboard is unchanged)_

## Impact

- **Components**: `Dashboard`, `TelemetryControls`, `Filters`, `TelemetryGrid` gain conditional logic based on view selection
- **Entity views**: Toolsets and Asset Toolsets gain Audit tab with MCP dashboard; Applications gains MCP view in existing Audit dashboard
- **Constants**: New query constants, column definitions, `TOOLSET_DEPLOYMENT_PREFIX`, factory functions `getEntityQuery`/`getProjectQuery`
- **Models**: `TelemetryQuery` interface extended with `orderBy`
- **Utils**: `getFormattedFilters` supports extra conditions; removed `toLowerCase()` from filter values; `getTabsForAsset` accepts optional feature flags
- **i18n**: New translation keys for MCP-specific labels
- **Bug fixes**: Auto-refresh time range staleness, query constant mutation
- **No API changes**: Same endpoint, different `from` table
- **No breaking changes**: Default view is Chat, existing behavior preserved
