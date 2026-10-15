## REMOVED Requirements

### Requirement: ExecutionStatusBar displays execution metadata as horizontal badges
**Reason**: `ExecutionStatusBar` was used only by the legacy right panel (`RunMetricDetailPanel`), which the Field/Values table replaces; the table shows execution status, HTTP code and duration as rows.
**Migration**: See `run-result-row-details` and the Execution section of the row-detail table.

### Requirement: AdaptiveValueGrid renders key-value pairs with progressive disclosure
**Reason**: `AdaptiveValueGrid` was used only by the legacy right panel; test case data and extracted fields are table rows now.
**Migration**: See `run-result-row-details` (value cells, full-value popup).

### Requirement: MetricCardsGrid displays metric values as visual cards with per-card selection
**Reason**: Metric cards existed only in the legacy right panel; metric values are score cells in the table.
**Migration**: See `run-result-row-details` (value cells).

### Requirement: MetricCard error variant displays failed metrics with error styling
**Reason**: Removed with the metric cards; a failed metric renders as a failed value in the table.
**Migration**: See `run-result-row-details` (value cells).

### Requirement: MetricInfoPanel shows selected metric's details using CodeViewer blocks
**Reason**: The per-metric info panel existed only in the legacy right panel and is deliberately not carried into the table.
**Migration**: None; metric details are no longer shown in the single run's row detail.

### Requirement: RunResultDetailPanel uses progressive depth components
**Reason**: The component no longer exists, and the components it names are removed.
**Migration**: See `run-result-row-details`.

### Requirement: RunMetricDetailPanel uses progressive depth components with per-metric selection and shows request/response
**Reason**: `RunMetricDetailPanel` is removed; its JSON toggle, per-metric selection and code viewers are not carried over. Request and response bodies remain table fields.
**Migration**: See `run-result-row-details`.

### Requirement: getMetricGroups utility structures metric data for card rendering
**Reason**: The utility fed only the metric cards and is removed with them.
**Migration**: None.
