## REMOVED Requirements

### Requirement: RunResultDetailPanel displays Extracted Columns section
**Reason**: `RunResultDetailPanel` no longer exists, and the grid component it names is removed.
**Migration**: The bottom pivot and the right table both show an Extracted section; see `run-result-row-details`.

### Requirement: RunMetricDetailPanel displays Extracted Columns section
**Reason**: `RunMetricDetailPanel` is removed in favour of the Field/Values table.
**Migration**: See `run-result-row-details`, whose table includes the Extracted section.
