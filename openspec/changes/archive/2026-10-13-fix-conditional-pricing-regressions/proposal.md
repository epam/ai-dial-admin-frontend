## Why

Conditional model pricing was introduced with a readable formatter and read-only pricing controls, but two regressions remain: decision-tree rates render as `[object Object]` in the Models grid, and a selected decision-tree field can be cleared locally from a read-only model. These make conditional pricing misleading in the list and violate read-only access expectations.

## What Changes

- Format conditional prompt, completion, cache read, and cache write rates as readable conditional summaries in the Models grid cells, matching their existing tooltips and token-unit scaling.
- Prevent the selected-field remove action in a conditional pricing decision tree from changing state when the control is disabled.
- Add focused regression coverage for grid formatting and disabled field removal.

## Non-goals

- Change pricing-rate persistence, validation, decision-tree evaluation, or rate unit scaling.
- Change the formatting of flat pricing rates.
- Broaden read-only behavior changes beyond the shared field-removal control used by conditional pricing.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `model-cache-pricing`: Conditional pricing rates must render readably in every Models grid price column, and every decision-tree control must be non-editable in read-only mode.

## Impact

- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` and its grid-column tests.
- `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/SingleValueAutocomplete.tsx` and its component tests.
- No backend API, dependency, or data-contract changes.
