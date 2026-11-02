## REMOVED Requirements

### Requirement: AnalyticsTab fetches results and snapshots in parallel under a single loader
**Reason**: Metric snapshots were fetched only to build bindings for the old side panel. The Execution Result tab no longer fetches them.
**Migration**: None.

### Requirement: AnalyticsTab stores metricBindings and passes them to the detail panel
**Reason**: The row-detail panel no longer receives or shows metric bindings.
**Migration**: None.

### Requirement: RunMetricDetailPanel renders a Metric Bindings sub-section per metric group
**Reason**: Config and input bindings are not part of the redesigned side panel.
**Migration**: None.

### Requirement: Metric Bindings sub-section renders flat rows with property, source-type chip, and value
**Reason**: The sub-section was removed with the old side panel.
**Migration**: None.

### Requirement: snapshotsToBindingsMap converts MetricSnapshot[] to Record<string, MetricBindings>
**Reason**: The helper's only caller was removed.
**Migration**: None.
