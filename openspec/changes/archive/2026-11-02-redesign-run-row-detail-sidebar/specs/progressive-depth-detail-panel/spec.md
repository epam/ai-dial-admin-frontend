## REMOVED Requirements

### Requirement: ExecutionStatusBar displays execution metadata as horizontal badges
**Reason**: The single-run side panel no longer uses a status bar; execution status, duration and HTTP code are rows in the Execution section of the Field | Values table.
**Migration**: See the `run-row-details` capability.

### Requirement: AdaptiveValueGrid renders key-value pairs with progressive disclosure
**Reason**: Test case data and extracted columns are sections of the Field | Values table; long values truncate and open in a pop-up instead of expanding in place.
**Migration**: See "Long values are truncated and open in a pop-up" in `run-row-details`.

### Requirement: MetricCardsGrid displays metric values as visual cards with per-card selection
**Reason**: Metric values are rows in a metric section of the Field | Values table, coloured by the heat-map scale; per-card selection no longer exists.
**Migration**: See "Side panel presents the row as a Field | Values table" in `run-row-details`.

### Requirement: MetricCard error variant displays failed metrics with error styling
**Reason**: Cards were removed. A failed metric shows its failed label in its value cell.
**Migration**: See `run-row-details`.

### Requirement: MetricInfoPanel shows selected metric's details using CodeViewer blocks
**Reason**: Per-metric info (reasoning) is not part of the redesigned side panel.
**Migration**: None. The information is still returned by the API and is not shown in the run detail view.

### Requirement: RunResultDetailPanel uses progressive depth components
**Reason**: The panel and the components it composed (`ExecutionStatusBar`, `AdaptiveValueGrid`) no longer exist.
**Migration**: None.

### Requirement: RunMetricDetailPanel uses progressive depth components with per-metric selection and shows request/response
**Reason**: `RunMetricDetailPanel` was replaced by the shared row-detail panel in its right-sidebar position, including the Request / Response section; the JSON viewer toggle was dropped by the redesign.
**Migration**: See the `run-row-details` capability; Request / Response fields are shown or hidden through Display.

### Requirement: getMetricGroups utility structures metric data for card rendering
**Reason**: The utility only fed the metric cards and was removed with them.
**Migration**: None.
