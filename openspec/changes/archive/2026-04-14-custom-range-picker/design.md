## Context

`TimeFilter` is the time-window selector used across Telemetry dashboards, Usage Log, and Activity Audit. It needed two changes: enforcement of a configurable max date range, and a UX redesign from two-input popover pickers to a single inline calendar with click-based selection rules.

## Decisions

### 1. FSM for selection state

Three-state reducer: `empty → single(date) → interval(anchor, latest)`. The `anchor`/`latest` pair tracks the user's most recent click for deterministic interval-shift on middle-click. Pure function in `range-fsm.ts` — no React, fully unit-testable.

`maxDays` is optional. When undefined, any click within reach forms an interval; when set, clicks beyond `maxDays - 1` from the anchor reset to single.

### 2. DialSelect as container with footer flyout

Presets render as native `DialSelect` options. "Custom" row lives in the `footer` slot. The calendar panel uses `absolute left-full bottom-0` to fly out to the right. This preserves the trigger button styling and click-outside-to-dismiss from the design system.

Known limitation: calendar may overflow viewport on right edge. Accepted as low-priority since the filter is typically positioned left.

### 3. Local `isCustom` state in TimeFilter and hook

No `isCustomRange`/`setIsCustomRange` prop drilling. TimeFilter tracks its own UI mode. The `useTimeFilter` hook tracks `isCustom` for query-time decision: presets recompute range from "now" on each query (sliding window for auto-refresh), custom ranges use fixed dates.

### 4. Environment-driven configuration

`AUDIT_MAX_RANGE_DAYS` env var → `AppContext.auditMaxRangeDays` → `TimeFilter.maxRangeDays` → `RangePicker.maxDays` → FSM `reduce()`. When not set, no cap applied — badge hidden, all days reachable, FSM treats every click as within reach.

### 5. `useTimeFilter` hook

Extracted from 3x duplicated code in Dashboard, UsageLog, ActivityAuditList. Encapsulates `timePeriod`/`timeRange`/`isCustom` state, initialization from `defaultTimeFilter: TimeFilterValue`, and `onTimePeriodChange`/`onTimeRangeChange` callbacks. Uses `useState` initializers (no useEffect). `timePeriod` is always `string` — eliminates `timePeriod &&` guards.

### 6. CSS specificity strategy

Library's `react-datepicker.css` applies `background-color: #216ba5` to `--selected`/`--in-range` at low specificity. Our overrides nest under `.react-datepicker-popper` (popper mode) and `.dial-range-calendar` (inline mode) — both higher specificity. Shared via comma-separated selector, no SCSS mixin.

### 7. `selectsRange` for native range highlighting

Using `selectsRange` prop gives us `--range-start`, `--in-range`, `--range-end` CSS classes from the library. `onSelect` (not `onChange`) feeds the raw clicked date to the FSM. This avoids fighting the library's built-in selection logic while keeping our FSM in control.

## Risks

- **Calendar flyout overflow**: Accepted as known limitation (low priority)
- **`selectsRange` + custom FSM**: Library's internal range state may diverge from FSM state on edge cases. Mitigated by controlled `startDate`/`endDate` props from FSM.
- **Locale-dependent date display**: `formatDate` and month label use browser locale. Tests assert output properties rather than specific formats.
