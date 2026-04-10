## Why

The run detail panels (`RunResultDetailPanel`, `RunMetricDetailPanel`) display test case data as a flat, always-expanded grid. Two gaps exist: `extractedColumns` — values extracted from the response by the backend — are never shown in the panel UI, and string-array values in test case data are coerced to a comma-joined string instead of showing each item distinctly. Making the `AdaptiveValueGrid` collapsible keeps the panel compact when sections aren't needed.

## What Changes

- **`AdaptiveValueGrid` always collapsible** — the section title row becomes a toggle button with a chevron icon; grid starts collapsed by default. No new props — behaviour is unconditional.
- **Array-of-strings value support** — `getDetailEntries` detects `string[]` values and returns them as `string[]` instead of `String(val)`. `AdaptiveValueGrid` entry type widens to `[string, string | string[]]`. `AdaptiveValueRow` renders `string[]` as stacked lines in the value column.
- **Extracted Columns section** — both `RunResultDetailPanel` and `RunMetricDetailPanel` gain a new `AdaptiveValueGrid` section driven by `result.extractedColumns`, placed after the Test Case Data section and before Request/Response viewers.
- New i18n key `RunsI18nKey.ExtractedColumns`.

## Capabilities

### New Capabilities

- `adaptive-value-grid-collapsible`: `AdaptiveValueGrid` is always collapsible — title row acts as toggle, starts collapsed, no props required.
- `detail-entries-array-values`: `getDetailEntries` and the grid/row components support `string[]` values, rendering each item on its own line in the value column.
- `detail-panel-extracted-columns`: Both run detail panels expose an "Extracted Columns" section using `AdaptiveValueGrid` fed from `result.extractedColumns`.

### Modified Capabilities

<!-- No existing spec-level capabilities are changing. -->

## Impact

- `components/Runs/Details/AdaptiveValueGrid.tsx` — add toggle state + chevron button; widen `entries` type
- `components/Runs/Details/AdaptiveValueRow.tsx` — handle `string | string[]` value prop
- `components/Runs/View/utils.ts` — `getDetailEntries` returns `[string, string | string[]][]`
- `components/Runs/Details/RunResultDetailPanel.tsx` — add Extracted Columns section
- `components/Runs/Details/RunMetricDetailPanel.tsx` — add Extracted Columns section
- `constants/i18n.ts` — new `RunsI18nKey.ExtractedColumns`
- `locales/en.ts` — new string for `ExtractedColumns`
- Test files: `AdaptiveValueGrid.spec.tsx`, `AdaptiveValueRow` tests (inline), `utils.spec.ts`
