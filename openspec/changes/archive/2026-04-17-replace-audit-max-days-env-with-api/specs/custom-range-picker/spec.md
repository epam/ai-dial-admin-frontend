## MODIFIED Requirements

### Requirement: Configurable max range sourced from backend dataset retention

The system SHALL derive the telemetry time-range cap from `GET /api/v1/metrics/datasets` at SSR time, extracting `maxTimeRangeMs` for the `dial_analytics_realtime` dataset, and flowing it through `AppContext.telemetryMaxRangeMs` → `TimeFilter.maxRangeMs` → `RangePicker.maxDays` (with ms-to-days conversion via `Math.floor(ms / 86_400_000)`) → FSM reducer. The cap SHALL apply to telemetry consumers (`UsageLog`, `Telemetry/Dashboard`, `Telemetry/TelemetryControls`) only. The cap SHALL NOT apply to `ActivityAudit/List`.

#### Scenario: Backend retention set for telemetry dataset
- **WHEN** `GET /api/v1/metrics/datasets` returns `dial_analytics_realtime.maxTimeRangeMs = 259_200_000` (3 days)
- **THEN** telemetry consumers' calendar SHALL show a "Max 3 days" badge, out-of-reach days SHALL be dimmed, the FSM SHALL reset anchor on clicks beyond reach, and the preset dropdown SHALL hide presets whose offset exceeds `maxTimeRangeMs`

#### Scenario: Backend retention not set for telemetry dataset
- **WHEN** `GET /api/v1/metrics/datasets` returns `dial_analytics_realtime.maxTimeRangeMs = null` or the dataset is absent from the response
- **THEN** no badge SHALL be shown, no day dimming SHALL occur, no range cap SHALL be enforced, and the full preset list SHALL be visible

#### Scenario: ActivityAudit/List is uncapped
- **WHEN** `ActivityAudit/List` renders `TimeFilter`
- **THEN** `TimeFilter` SHALL receive no `maxRangeMs` prop, `RangePicker` SHALL render no "Max N days" badge, all calendar days up to today SHALL be selectable, and the full preset list SHALL be visible regardless of `telemetryMaxRangeMs`

#### Scenario: Non-integer day retention floors to whole days
- **WHEN** `maxTimeRangeMs = 648_000_000` (7.5 days)
- **THEN** `RangePicker.maxDays` SHALL be `7`, and the preset filter SHALL include only presets whose offset in ms is ≤ `648_000_000`

## REMOVED Requirements

### Requirement: Configurable max range via environment variable
**Reason**: Replaced by backend-sourced `maxTimeRangeMs` from `GET /api/v1/metrics/datasets`. The environment variable was duplicative of backend influx retention configuration, was misnamed for its actual scope (telemetry, not audit), and required hand-syncing with backend state.

**Migration**: Remove `AUDIT_MAX_RANGE_DAYS` from deployment configuration. Configure the desired cap at the backend by adjusting the `dial_analytics_realtime` dataset's max time range (see `ai-dial-admin-backend` `DatasetDeclaration.maxTimeRange`). `ActivityAudit/List` no longer observes any cap; operators relying on the env var to cap the audit range must accept this behavioral change.
