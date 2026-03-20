## ADDED Requirements

### Requirement: View by dropdown switches between Chat and MCP dashboards
The Dashboard page SHALL display a "View by" dropdown as the first control in the controls bar on the main Dashboard page and Applications entity audit. The dropdown SHALL have two options: "Chat" (default) and "MCP". Selecting an option SHALL replace the dashboard body with the corresponding layout. The selection SHALL NOT affect the URL. Applied filters SHALL be cleared when switching views.

#### Scenario: Default view is Chat
- **WHEN** the user navigates to the Dashboard page
- **THEN** the "View by" dropdown shows "Chat" and the existing Chat dashboard layout is displayed

#### Scenario: Switching to MCP view
- **WHEN** the user selects "MCP" from the "View by" dropdown
- **THEN** the dashboard body is replaced with the MCP layout (MCP chart, MCP stat cards, MCP tables)
- **AND** any previously applied filters are cleared

#### Scenario: Switching back to Chat view
- **WHEN** the user selects "Chat" from the "View by" dropdown while MCP view is active
- **THEN** the Chat dashboard layout is restored
- **AND** any previously applied filters are cleared

#### Scenario: View by dropdown styling
- **WHEN** the "View by" dropdown is rendered
- **THEN** it uses `SelectSize.Sm` and `SelectVariant.Secondary` matching the adjacent TimeFilter

### Requirement: MCP dashboard displays 3 stat cards
The MCP dashboard layout SHALL display 3 stat cards: "Unique Users" (full width on top), "Total MCP Calls" and "Total Tool Calls" (side by side below). The stat cards group SHALL be positioned to the right of the line chart.

#### Scenario: Stat cards with available data
- **WHEN** the MCP view is active and the API returns data for a stat card query
- **THEN** the stat card displays the numeric value

#### Scenario: Stat cards with no data
- **WHEN** the MCP view is active and the API returns empty data for a stat card query
- **THEN** the stat card displays the existing no-data state

### Requirement: MCP stat card queries
- "Unique Users" SHALL query `count()` from a subquery of `distinct user_hash` from `mcp_analytics` with time range filter.
- "Total MCP Calls" SHALL query `count()` from `mcp_analytics` with time range filter.
- "Total Tool Calls" SHALL query `count()` from `mcp_analytics` where `mcp_method = 'tools/call'` with time range filter.

#### Scenario: Total MCP Calls query
- **WHEN** the MCP view is active
- **THEN** the "Total MCP Calls" card fetches `count()` from `mcp_analytics` filtered by the selected time range

#### Scenario: Total Tool Calls query
- **WHEN** the MCP view is active
- **THEN** the "Total Tool Calls" card fetches `count()` from `mcp_analytics` where `mcp_method = 'tools/call'` filtered by the selected time range

#### Scenario: Unique Users query
- **WHEN** the MCP view is active
- **THEN** the "Unique Users" card fetches `count()` from a subquery selecting `distinct user_hash` from `mcp_analytics` filtered by the selected time range

### Requirement: MCP dashboard displays line chart
The MCP layout SHALL display a "Request per MCP usage" line chart in the same position as the existing Chat chart. Until the time-series query is available, the chart SHALL show the no-data state.

#### Scenario: Chart with no query available
- **WHEN** the MCP view is active and no time-series query is configured
- **THEN** the chart area displays the existing no-data state

### Requirement: MCP dashboard displays tables
The MCP layout SHALL display tables based on the view context:

**Global view (main Dashboard, entity audit without entity filter):**
1. **MCP Consumption** — columns: MCP Name, Calls (query ready)
2. **Tools Consumption** — columns: MCP Name, Tool, Calls (no-data until query ready)
3. **Calls by Deployment** — columns: Deployment Name, MCP Name, Calls (query ready)
4. **Projects Consumption** — columns: Project, Tool Calls, MCP Calls (no-data until query ready)

**Entity view (entity audit with pre-applied entity filter):**
1. **Tools Consumption** — columns: MCP Name, Tool, Calls (no-data until query ready)
2. **Calls by Deployment** — columns: Deployment Name, MCP Name, Calls (no-data until caller deployment field available)
3. **Projects Consumption** — columns: Project, Tool Calls, MCP Calls (no-data until query ready)

MCP Consumption is hidden in entity view as it is redundant when filtered to a single entity.

All tables SHALL use the existing `TelemetryGrid` component with optional `null` query for no-data state.

#### Scenario: Tables in global view
- **WHEN** the MCP view is active on the main Dashboard
- **THEN** all 4 tables are displayed

#### Scenario: Tables in entity view
- **WHEN** the MCP view is active in an entity audit view
- **THEN** MCP Consumption is hidden and Calls by Deployment shows no-data

#### Scenario: Tables layout
- **WHEN** tables are displayed in global view
- **THEN** "MCP Consumption" and "Tools Consumption" are in the first row (side by side)
- **AND** "Calls by Deployment" and "Projects Consumption" are in the second row (side by side)

### Requirement: Entity/Project filters apply to MCP view
The Entity/Project filter controls SHALL remain visible on MCP view. Filter dropdown lists SHALL be fetched from `mcp_analytics` using factory functions `getEntityQuery(tableName)` / `getProjectQuery(tableName)`.

#### Scenario: Filter dropdown lists on MCP view
- **WHEN** the MCP view is active and the user opens the filter dropdown
- **THEN** entity and project lists are fetched from `mcp_analytics`

#### Scenario: Filter dropdown lists on Chat view
- **WHEN** the Chat view is active and the user opens the filter dropdown
- **THEN** entity and project lists are fetched from `analytics`

### Requirement: Time filter and auto-refresh apply to MCP view
The time period filter and auto-refresh controls SHALL apply to MCP queries. For preset periods, the time range SHALL be recomputed with fresh dates on each auto-refresh tick. For custom date ranges, the fixed dates SHALL be used.

#### Scenario: Auto-refresh computes fresh time range
- **WHEN** auto-refresh fires with a preset period (e.g., "Last 2 days")
- **THEN** the time range is recalculated from the current time, not the time when the period was selected

#### Scenario: Custom range stays fixed on auto-refresh
- **WHEN** auto-refresh fires with a custom date range
- **THEN** the original custom start/end dates are used

### Requirement: Toolsets entity audit shows MCP-only dashboard
The Toolsets entity audit view SHALL display only the MCP dashboard layout without a "View by" dropdown. The entity filter SHALL be pre-applied using the toolset name.

#### Scenario: Toolsets audit view
- **WHEN** the user opens the Audit tab for a Toolset entity
- **THEN** the MCP dashboard is shown without the "View by" dropdown
- **AND** data is filtered by the toolset's deployment name

### Requirement: Asset Toolsets entity audit shows MCP-only dashboard
The Asset Toolsets entity view SHALL include an Audit tab (gated by `dashboardEnabled` feature flag) showing only the MCP dashboard. The entity filter SHALL use the full deployment path (`toolsets/<path>`) to match InfluxDB data.

#### Scenario: Asset Toolset audit tab visible
- **WHEN** the `dashboardEnabled` feature flag is true
- **THEN** the Audit tab appears in the Asset Toolset entity view

#### Scenario: Asset Toolset audit tab hidden
- **WHEN** the `dashboardEnabled` feature flag is false
- **THEN** the Audit tab does not appear in the Asset Toolset entity view

#### Scenario: Asset Toolset entity filter
- **WHEN** the MCP dashboard is shown for an Asset Toolset
- **THEN** the entity filter uses `toolsets/<entity.path>` as the deployment value

### Requirement: Applications entity audit supports MCP view
The Applications entity audit SHALL display the "View by" dropdown allowing switching between Chat and MCP dashboards.

#### Scenario: Applications audit view
- **WHEN** the user opens the Audit tab for an Application entity
- **THEN** the "View by" dropdown is shown with Chat (default) and MCP options

### Requirement: Query objects are not mutated
The `getData` callbacks SHALL clone query objects before modifying the `where` clause to prevent mutation of shared query constants.

#### Scenario: Concurrent queries
- **WHEN** multiple components call `getData` with the same query constant simultaneously
- **THEN** each call operates on an independent copy and does not affect other calls

### Requirement: Filter values are case-sensitive
Filter values SHALL NOT be lowercased before being sent in queries.

#### Scenario: Entity filter with mixed case
- **WHEN** a filter value contains uppercase characters
- **THEN** the value is sent as-is to the API without lowercasing
