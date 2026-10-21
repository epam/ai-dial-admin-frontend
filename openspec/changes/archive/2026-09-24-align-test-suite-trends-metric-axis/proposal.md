## Why

Metric Trend cards already use a 0–1 score domain, but hide their labels and reserve no left-side axis space. This makes their scale harder to read and inconsistent with the Overall Score Trend.

## What Changes

- Render Metric Trend Y axes on the fixed 0–1 score domain with visible `0`, `0.25`, `0.5`, `0.75`, and `1` labels.
- Reserve left chart-grid space for those labels, matching the Overall Score Trend’s readable axis treatment.
- Preserve Metric Trend metric lines, legend/tag filtering, tooltip behavior, grid lines, and hidden X axis.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-suite-trends`: Metric Trend chart scale and axis-label behavior.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/chart-options.ts`
- New focused Metric Trend chart-options unit coverage at `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/tests/chart-options-metric-trend.spec.ts`
- No API, backend-contract, dependency, or data-shape change.

## Non-goals

- Do not alter Overall Score Trend behavior.
- Do not change metric values, metric lines, legend/tags, tooltip, grid lines, or the hidden X axis.
- Do not add browser verification: the user explicitly selected unit-test-only coverage for this small chart-options change.
