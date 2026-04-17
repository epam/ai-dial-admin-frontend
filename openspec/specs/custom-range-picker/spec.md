## custom-range-picker

Cap-aware inline calendar range picker with FSM-driven selection, configurable via `AUDIT_MAX_RANGE_DAYS` environment variable.

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

### Requirement: Configurable max range via environment variable

The system SHALL support an `AUDIT_MAX_RANGE_DAYS` env var that flows through `AppContext.auditMaxRangeDays` → `TimeFilter.maxRangeDays` → `RangePicker.maxDays` → FSM reducer.

#### Scenario: Max range set
- **WHEN** `AUDIT_MAX_RANGE_DAYS=3`
- **THEN** the calendar SHALL show a "Max 3 days" badge, out-of-reach days SHALL be dimmed, and the FSM SHALL reset anchor on clicks beyond reach

#### Scenario: Max range not set
- **WHEN** `AUDIT_MAX_RANGE_DAYS` is not configured
- **THEN** no badge SHALL be shown, no day dimming SHALL occur, and no range cap SHALL be enforced

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
