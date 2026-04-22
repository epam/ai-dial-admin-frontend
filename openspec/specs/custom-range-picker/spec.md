## custom-range-picker

Cap-aware inline calendar range picker with FSM-driven selection, configurable via the backend telemetry dataset retention.

## ADDED Requirements

### Requirement: FSM-driven date selection

The custom range picker SHALL use a pure reducer with three states (`empty`, `single`, `interval`) to interpret every day click. When `maxDays` is undefined, all clicks from single state SHALL form an interval with no reach limit.

#### Scenario: Single to interval within reach
- **WHEN** state is `single(A)`, user clicks date X, and `|X−A|` ≤ `maxDays−1`
- **THEN** state SHALL become `interval(anchor: A, latest: X)`

#### Scenario: Interval middle click shifts preserving latest
- **WHEN** state is `interval(a, l)` and user clicks date M strictly between min(a,l) and max(a,l)
- **THEN** state SHALL become `interval(anchor: l, latest: M)`

#### Scenario: Unlimited mode when maxDays not set
- **WHEN** `maxDays` is undefined and state is `single(A)`, user clicks any date X
- **THEN** state SHALL become `interval(anchor: A, latest: X)` regardless of distance

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

### Requirement: Inline calendar with future date restriction

`RangePicker` SHALL render an inline `ReactDatePicker` with `selectsRange` for native range highlighting. Future dates MUST be disabled.

#### Scenario: Future dates disabled
- **WHEN** the calendar renders
- **THEN** dates after today SHALL be disabled and the forward navigation arrow SHALL be hidden on the current month

### Requirement: TimeFilter layout with DialSelect and footer flyout

`TimeFilter` SHALL use `DialSelect` for native preset rendering with a Custom row in the `footer` slot. The calendar panel SHALL fly out to the right. A local `isCustom` state SHALL manage UI display without prop drilling.

#### Scenario: Preset click commits immediately
- **WHEN** user clicks a preset row
- **THEN** the selection SHALL commit to the parent and the dropdown SHALL close

#### Scenario: Custom requires Apply
- **WHEN** user clicks Custom, selects dates, and clicks Apply
- **THEN** the custom range SHALL commit to the parent and the dropdown SHALL close

#### Scenario: Cancel reverts
- **WHEN** user clicks Cancel in the custom panel
- **THEN** no range SHALL be committed and the dropdown SHALL close

### Requirement: useTimeFilter hook eliminates duplication

A shared `useTimeFilter` hook SHALL encapsulate `timePeriod`, `timeRange`, `isCustom` state, initialization from `defaultTimeFilter`, and change callbacks. It MUST be used by Dashboard, UsageLog, and ActivityAuditList.

#### Scenario: Preset sliding window
- **WHEN** `isCustom` is false and `getCurrentTimeRange()` is called
- **THEN** it SHALL recompute range from the preset relative to "now"

#### Scenario: Custom fixed range
- **WHEN** `isCustom` is true and `getCurrentTimeRange()` is called
- **THEN** it SHALL return the committed custom `timeRange`

### Requirement: TimeFilterValue type alias and isTimeRange guard

All consumer prop interfaces SHALL use `TimeFilterValue` type alias instead of inline `string | TimeRange`. An `isTimeRange()` guard MUST be provided for type narrowing.

#### Scenario: Props use TimeFilterValue
- **WHEN** Dashboard, UsageLog, or ActivityAuditList declare `defaultTimeFilter` prop
- **THEN** the type SHALL be `TimeFilterValue`
