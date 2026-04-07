## Why

When all chart legends are disabled on the "Requests per MCP Usage" graph (Audit → Dashboard → MCP view), an unlabeled indicator remains visible. This happens because data rows with empty or undefined `mcp_method` values produce a series with no name — ECharts renders the line but doesn't create a legend item for it, so the user can't toggle it off.

GitHub issue: [#2836](https://github.com/epam/ai-dial-admin-frontend/issues/2836)

## What Changes

- **Normalize undefined/empty method names in chart data preparation**: In `prepareMultiSeriesChartData()` (`src/utils/telemetry.ts`), replace falsy `mcp_method` values with a translated "Unknown" label before building chart series. This ensures every series has a name and a corresponding clickable legend item.
- **Add i18n key for "Unknown"**: Add `Unknown = 'Telemetry.Unknown'` to `TelemetryI18nKey` enum and its translation in `src/locales/en.ts`.

## Capabilities

### New Capabilities

_None — this is a bug fix._

### Modified Capabilities

- `mcp-usage-chart`: Data preparation normalizes missing method names so all series are labeled and toggleable via legend.

## Impact

- **Modified util**: `src/utils/telemetry.ts` — `prepareMultiSeriesChartData()` normalizes falsy `row.mcp_method` to `t(TelemetryI18nKey.Unknown)`
- **Modified constants**: `src/constants/i18n.ts` — new `Unknown` entry in `TelemetryI18nKey`
- **Modified locale**: `src/locales/en.ts` — new translation `"Unknown": "Unknown"`
- **No UI layout changes**: The chart renders identically for normal data; only unnamed series get a visible label
- **No backend changes needed**

## Non-goals

- Filtering out rows with empty `mcp_method` (they represent real requests that should be visible)
- Changing ECharts legend toggle behavior globally
- Adding "Unknown" as a generic/shared i18n key (scoped to Telemetry)
