## 1. Pure FSM

- [x] 1.1 Create `components/Common/RangePicker/range-fsm.ts` with `RangeFsmState` type and `reduce(state, click, maxDays?)` reducer
- [x] 1.2 Inline `differenceInCalendarDays` helper (date-fns not a dependency)
- [x] 1.3 Export helpers: `toDisplayRange`, `hydrate(range)`, `toCommit`
- [x] 1.4 Create `range-fsm.spec.ts` — 25 tests covering all transitions + hydrate/toCommit round-trips
- [x] 1.5 All FSM tests pass before touching React layer

## 2. i18n

- [x] 2.1 Add `TelemetryI18nKey.MaxRangeDays` with `'Max {days} days'` in `en.ts`
- [x] 2.2 Removed 7d and 30d presets from `timePeriodOptionsConfig`

## 3. RangePicker

- [x] 3.1 Rewrite to inline `ReactDatePicker` with `selectsRange` for native range highlighting
- [x] 3.2 FSM drives state; `onSelect` feeds raw click to reducer
- [x] 3.3 `maxDays` prop is optional — when undefined, no cap, no badge, no dimming
- [x] 3.4 "Max N days" badge with `border-warning text-primary` styling, `role="status"`
- [x] 3.5 `maxDate={new Date()}` prevents future date selection; forward nav hidden on current month
- [x] 3.6 `dayClassName` dims out-of-reach days (memoized `todayEnd` via `useMemo`)
- [x] 3.7 Browser locale for month label (`undefined` not `'en-US'`)
- [x] 3.8 `.dial-range-calendar` wrapper class for CSS specificity over library defaults

## 4. TimeFilter layout

- [x] 4.1 `DialSelect` renders native preset options + Custom row in `footer`
- [x] 4.2 Calendar panel floats to the right via `absolute left-full bottom-0`
- [x] 4.3 Cancel (`DialNeutralButton`) + Apply (`DialPrimaryButton`) with `ElementSize.Small`
- [x] 4.4 Local `isCustom` state — no `isCustomRange`/`setIsCustomRange` props
- [x] 4.5 Draft/commit/cancel model; preset click commits immediately; Custom requires Apply
- [x] 4.6 `CUSTOM_VALUE_SENTINEL` constant prevents preset highlighting in custom mode
- [x] 4.7 `customSelectedValue` shows "Custom: dates" in trigger; `formatDate` uses browser locale
- [x] 4.8 `maxRangeDays?: number` prop replaces old `maxTimeRangeMs`
- [x] 4.9 `listClassName="overflow-visible min-w-[200px]"` prevents calendar clipping

## 5. CSS

- [x] 5.1 Shared calendar theme via comma-separated `.react-datepicker-popper, .dial-range-calendar` selector
- [x] 5.2 Range styling: `--selected/--range-start/--range-end` use `bg-controls-accent-primary`; `--in-range` uses `bg-accent-primary-alpha`
- [x] 5.3 `--disabled` days get `opacity-30` and no hover
- [x] 5.4 `.dial-range-picker__day--out-of-reach` dims past days beyond reach

## 6. Environment variable

- [x] 6.1 `AUDIT_MAX_RANGE_DAYS` in `.env.template`, `README.md`, `AppContext`, `layout.tsx`
- [x] 6.2 Consumers read `auditMaxRangeDays` from `useAppContext()` and pass to `TimeFilter`

## 7. useTimeFilter hook

- [x] 7.1 Extract `useTimeFilter({ defaultTimeFilter, onTimeFilterChange })` hook
- [x] 7.2 Returns `{ timePeriod, timeRange, isCustom, getCurrentTimeRange, onTimePeriodChange, onTimeRangeChange }`
- [x] 7.3 `useState` initializers (no useEffect), `timePeriod` always `string` (never undefined)
- [x] 7.4 Dashboard, UsageLog, ActivityAuditList all use the hook — eliminated 3x duplication

## 8. Type improvements

- [x] 8.1 `TimeFilterValue` type alias and `isTimeRange` guard in `time-range.ts`
- [x] 8.2 All prop interfaces use `TimeFilterValue` instead of `string | TimeRange`
- [x] 8.3 Removed `timePeriod &&` guards (timePeriod always defined)
- [x] 8.4 Renamed `initTimeFilter` → `defaultTimeFilter`, `onChangeTimeFilter` → `onTimeFilterChange`

## 9. State cleanup

- [x] 9.1 Removed `isCustomRange` / `setIsCustomRange` / `innerIsCustomRange` from all consumers
- [x] 9.2 `isCustom` is local to `TimeFilter` (UI display) and `useTimeFilter` (query sliding)
- [x] 9.3 `EntityAudit` no longer manages `isCustomRange` state — just passes `timeFilter` value
- [x] 9.4 Removed dead `hydrate` `isCustom` parameter
- [x] 9.5 Removed `RangePicker/constants.ts` (all constants dead after refactors)

## 10. Tests

- [x] 10.1 `range-fsm.spec.ts` — 25 unit tests
- [x] 10.2 `RangePicker.spec.tsx` — 10 integration tests
- [x] 10.3 `TimeFilter.spec.tsx` — 6 tests (preset commit, calendar toggle, Apply/Cancel)
- [x] 10.4 `formatDate` test asserts output properties, not duplicated implementation
- [x] 10.5 All 3966 tests pass, 0 errors in lint

