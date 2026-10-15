## 1. Card UI

- [x] 1.1 Extract `MetricCard.tsx` (layer-2 shell, header Base ghost Delete/Edit, description, Condition / Configuration / Outputs / Inputs rows)
- [x] 1.2 Update `MetricBindingsDisplay` for 84px labels (no colon) and full-width long tags
- [x] 1.3 Metric-card Show more (tiny-semi + chevron) via `MetricCardDescription`; leave shared `ExpandableText` unchanged
- [x] 1.4 Wire `Metrics.tsx` to render `MetricCard` per bound metric

## 2. Tests

- [x] 2.1 Update `MetricBindingsDisplay.spec.tsx` and `Metrics.spec.tsx` for new layout
- [x] 2.2 Add `MetricCard.spec.tsx` covering Outputs visibility and long-input tags
- [x] 2.3 Run focused vitest for touched specs
