## MODIFIED Requirements

### Requirement: FSM-driven date selection

The custom range picker SHALL use a pure reducer with three states (`empty`, `single`, `interval`) to interpret every day click. When `maxDays` is undefined, all clicks from single state SHALL form an interval with no reach limit. A click on the day that is already the single selection SHALL form a one-day interval on that day, so that exactly one calendar day remains selectable after the single-date commit rule widens a first click to the current day.

#### Scenario: Single to interval within reach
- **WHEN** state is `single(A)`, user clicks date X, and `|X−A|` ≤ `maxDays−1`
- **THEN** state SHALL become `interval(anchor: A, latest: X)`

#### Scenario: Interval middle click shifts preserving latest
- **WHEN** state is `interval(a, l)` and user clicks date M strictly between min(a,l) and max(a,l)
- **THEN** state SHALL become `interval(anchor: l, latest: M)`

#### Scenario: Unlimited mode when maxDays not set
- **WHEN** `maxDays` is undefined and state is `single(A)`, user clicks any date X
- **THEN** state SHALL become `interval(anchor: A, latest: X)` regardless of distance

#### Scenario: Second click on the selected day forms a one-day interval
- **WHEN** state is `single(A)` and user clicks day A again
- **THEN** state SHALL become `interval(anchor: A, latest: A)` and the committed range SHALL be `A 00:00:00.000` → `A 23:59:59.999`, so a single calendar day stays reachable in two clicks

## ADDED Requirements

### Requirement: Single-date custom range commits through the current day

When the custom range picker holds only a start date, the committed range SHALL end at the end of the current day rather than at the end of the start day, so that one click plus Apply reproduces the "from a point in the past until now" shape every sliding-window preset already has. The rule SHALL live in the shared picker, so every consumer of the shared time filter — the entity Audit tab's Activities list and `UsageLog` alike — SHALL commit the same range for the same gesture; no consumer SHALL be able to opt out of it.

Where a consumer sets a maximum range (`maxRangeMs`, derived from backend dataset retention), the widened end SHALL be clamped so the committed span never exceeds the cap. The committed range SHALL never end after the current day. No notification SHALL be raised by committing a range; the only feedback is the control's own label and the refreshed list.

#### Scenario: Single date commits through the end of today
- **WHEN** a consumer without a `maxRangeMs` cap (the entity Audit tab's Activities list) renders the time filter, the user opens Custom, clicks a single past day A, and clicks Apply
- **THEN** the committed range SHALL be `A 00:00:00.000` → today `23:59:59.999`, the Custom row SHALL show that start–end pair as text before Apply is pressed, the dropdown SHALL close, and the list SHALL be refreshed for the committed range

#### Scenario: Single date on a capped consumer clamps to the cap
- **WHEN** a consumer sets `maxRangeMs` (so `maxDays` is `Math.floor(maxRangeMs / 86_400_000)`), the user clicks a single day A more than `maxDays − 1` days before today, and clicks Apply
- **THEN** the committed range SHALL be `A 00:00:00.000` → `A + (maxDays − 1) days 23:59:59.999`, the committed span SHALL NOT exceed `maxDays` calendar days, and that end SHALL be the last day the calendar still shows as within reach of A

#### Scenario: Clicking today commits today only
- **WHEN** the user clicks today as the single date and clicks Apply
- **THEN** the committed range SHALL be today `00:00:00.000` → today `23:59:59.999`, and the committed end SHALL NOT be a future day

#### Scenario: Two-date range commits exactly the dates picked
- **WHEN** the user clicks two distinct days A and B and clicks Apply
- **THEN** the committed range SHALL be `min(A,B) 00:00:00.000` → `max(A,B) 23:59:59.999` with no widening toward today, and the Custom row SHALL show that same pair as text

#### Scenario: UsageLog inherits the single-date default
- **WHEN** the `UsageLog` view's custom picker receives one click on a day within reach of today, followed by Apply
- **THEN** the committed range SHALL be that day → the end of today, identical to the entity Audit tab's Activities list, because the commit rule belongs to the shared picker and not to either consumer

### Requirement: Since Creation option on the entity Audit tab's Activities list

The time filter SHALL support a period option anchored to an absolute start date rather than to a sliding offset, resolved against the option list the consumer supplies rather than against the shared, entity-agnostic preset list. The entity Audit tab's Activities list SHALL supply such an option, labelled from the `Telemetry.SinceCreation` i18n key, anchored to the creation timestamp of the entity in scope (`ModifiedEntity.createdAt` from the admin backend's entity payload, which may arrive as an ISO string or as a millisecond timestamp serialized as a string).

The option SHALL be offered only where an entity with a usable creation timestamp is in scope. It SHALL NOT be offered on the global activity-audit list, on the Dashboard, Traces or Conversations sub-tabs of the entity Audit tab, or on any consumer that sets a range cap. Selecting it SHALL behave like every other preset: it commits immediately, it is recomputed against "now" on every refresh, and it raises no notification of its own — a failed refresh SHALL leave the list in its existing failure state exactly as a preset refresh does today.

#### Scenario: Option offered when the entity carries a creation timestamp
- **WHEN** the Activities sub-tab of an entity's Audit tab renders and the entity in scope has a usable `createdAt`
- **THEN** the time filter's preset list SHALL show a `Telemetry.SinceCreation` option after the sliding-window presets and before the Custom row, and every existing preset SHALL still be listed unchanged

#### Scenario: Selecting Since Creation lists activity from the creation timestamp to now
- **WHEN** the user clicks the Since Creation option
- **THEN** the selection SHALL commit immediately, the dropdown SHALL close, the trigger SHALL show the option's label rather than a raw period id or a date pair, and each activity request SHALL carry a start date equal to the entity's creation timestamp and an end date equal to the time of that request — recomputed on every refresh, not frozen at the moment of selection

#### Scenario: Option absent when the entity has no usable creation timestamp
- **WHEN** the entity in scope has no `createdAt`, or its `createdAt` cannot be parsed into a valid date
- **THEN** the Since Creation option SHALL NOT appear, the preset list SHALL be exactly the shared preset list, and no disabled row, tooltip or error SHALL be rendered in its place

#### Scenario: Option absent where no entity is in scope
- **WHEN** the global activity-audit list renders its time filter with no entity in scope
- **THEN** the Since Creation option SHALL NOT appear and the preset list SHALL be exactly the shared preset list

#### Scenario: Option absent on the sibling Audit sub-tabs
- **WHEN** the Dashboard, Traces or Conversations sub-tab of the entity Audit tab renders its time filter, with the same entity in scope
- **THEN** the Since Creation option SHALL NOT appear on any of them

#### Scenario: Since Creation does not travel to a sibling Audit sub-tab
- **WHEN** Since Creation is selected on the Activities sub-tab and the user switches to the Dashboard, Traces or Conversations sub-tab, which shares the Audit tab's time-filter selection
- **THEN** that sub-tab SHALL initialise with the default preset instead of the option id it cannot resolve, its trigger SHALL NOT show an unresolved period id, its range SHALL NOT be an empty "now to now" window, and switching back to Activities SHALL show Since Creation selected again

#### Scenario: A capped consumer never offers an anchored option
- **WHEN** a consumer sets `maxRangeMs` and its option list contains an option anchored to an absolute start date
- **THEN** that option SHALL be filtered out of the preset list along with any sliding preset whose offset exceeds the cap, because an anchored option's span grows without bound and cannot be checked against the cap
