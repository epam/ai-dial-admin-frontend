## Why

Users cannot add multiple filter parameters in the MCP Analytics dashboard. When attempting to filter by multiple entities or projects (e.g., multiple MCP deployments), they must create separate filters for each value. Worse, when trying to add a second filter, the dropdown shows the previously selected entity instead of allowing a fresh selection, making it impossible to add additional filters.

This severely limits analytics capabilities - users cannot easily view aggregated data across multiple deployments or projects, requiring manual workarounds or external tooling.

Issue: [#2807](https://github.com/epam/ai-dial-admin-frontend/issues/2807)

## What Changes

Transform the filter system from single-value to multi-value selection:

- **Data Model**: Change `FilterData.value` from `string` to `string[]` to support multiple selections
- **UI**: Enable multi-select on Entity and Project dropdowns when using Equal or NotEqual conditions
- **Display**: Show selected values in filter chips, with smart truncation (first two values + count for 3+)
- **Query Generation**: Update query logic to use `$in`/`$nin` operators for array values

## Capabilities

### New Capabilities

**Multi-Select Filtering**
- Users can select multiple entities/projects in a single filter
- Available for Equal and NotEqual conditions on Entity/Project dropdowns
- Smart display: shows first 2 values + count if more (e.g., "MCP-1, MCP-2, +3 more")

### Modified Capabilities

**Filter Data Model**
- `FilterData.value`: `string` → `string[]`
- Query generation now supports array values with `$in`/`$nin` operators

## Non-goals

- Multi-select for text-based conditions (Contains, StartsWith, EndsWith) - these remain single text input
- Backward compatibility with existing saved filters (if any exist in user preferences/URLs)
- Conditional multi-select toggle (it's always enabled for dropdown-based filters)
- Virtualization or search for large option lists (optimize later if needed)

## Impact

**Files Modified:**
- `apps/ai-dial-admin/src/models/telemetry.ts` - FilterData interface
- `apps/ai-dial-admin/src/components/Telemetry/TelemetryControls/Filters/CreateFilter.tsx` - Enable multi-select
- `apps/ai-dial-admin/src/components/Telemetry/TelemetryControls/Filters/AddFilter.tsx` - Handle array state
- `apps/ai-dial-admin/src/components/Telemetry/TelemetryControls/Filters/Filter.tsx` - Display multiple values
- `apps/ai-dial-admin/src/utils/telemetry.ts` - Query generation for arrays

**Scope:** Medium - touches data model, UI components, state management, and query generation
**Risk:** Medium - breaking change to FilterData interface, requires careful query testing
**User Impact:** High - unlocks key analytics capability, improves UX significantly
