## Why

Bound metrics on the Metrics tab still render as flat list rows (`border-b`) that omit Outputs and misalign Condition / Configuration / Inputs relative to the redesigned Evaluation Figma. Operators need a compact card that surfaces configuration, inputs, and output field names from the already-loaded `outputSchema`.

## What Changes

- Replace each metric list row with a layer-2 card (avatar, name, Delete/Edit, expandable description).
- Align Condition / Configuration / Outputs / Inputs as labeled rows (84px labels, tag chips for bindings and output field names).
- Show Outputs as tags from `outputSchema.properties` keys (data already present from the aggregated fetch); omit empty binding/output rows.
- Long input binding values render as full-width multi-line tags.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `test-suite-metrics-tab`: metric list card layout and Outputs row from `outputSchema`.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Metrics/Metrics.tsx` — map to `MetricCard`.
- New `MetricCard.tsx`; update `MetricBindingsDisplay.tsx` and shared `ExpandableText` (Show more chevron).
- Specs for Metrics / MetricBindingsDisplay / MetricCard.
- No backend or fetch-model changes.
