## 1. Parser and cell render

- [x] 1.1 Add highlight types, `parseMetricHighlight`, `getMetricInfoHighlightRaw`, `getHighlightChunkClass`.
- [x] 1.2 Add `HighlightedText` and wire it through `FieldValue`.

## 2. Pivot column from metricInfos

- [x] 2.1 Inject `leaf:highlight` rows in `buildComparisonSections` next to numeric leaves.
- [x] 2.2 Mark highlight fields `isMetric: false` in `buildRowDetailSections`.
- [x] 2.3 Cover with BottomDrawer and row-detail-sections specs.

## 3. Keep the popup untouched

- [x] 3.1 Revert all `ScoreColumn` / `ScoreRunData` / `MetricInfoSection.Raw` / i18n popup changes.

## 4. Spec and gates

- [x] 4.1 Update this change's proposal/design/delta; leave `run-value-popups` main spec alone.
- [x] 4.2 Run vitest on touched specs, typecheck, lint.
