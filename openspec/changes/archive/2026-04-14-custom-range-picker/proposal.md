## Why

The custom range picker in `TimeFilter` allowed arbitrary date ranges, but the backend enforces a configurable maximum window on telemetry queries. Users could build ranges that the DB would reject. The picker also used two independent From/To inputs with popover calendars, which didn't support the click-based selection rules the design required.

## What Changed

- **Configurable max range**: `AUDIT_MAX_RANGE_DAYS` env var controls the cap. When set, the FSM enforces it, a "Max N days" badge is shown, and out-of-reach days are dimmed. When unset, no restriction.
- **Single inline calendar**: `RangePicker` uses `ReactDatePicker` with `selectsRange` and `inline` mode. Custom `renderCustomHeader` with locale-aware month label. Future dates disabled via `maxDate`.
- **Selection FSM**: Pure reducer `reduce(state, click, maxDays?)` with three states (`empty`, `single`, `interval`). `anchor`/`latest` pair tracks which endpoint to preserve on interval-shift.
- **TimeFilter redesign**: `DialSelect` renders presets as native options. Custom row in `footer` with calendar flying out to the right. Cancel/Apply commit semantics with local `isCustom` state.
- **`useTimeFilter` hook**: Eliminates 3x duplicated state/init/callback logic across Dashboard, UsageLog, ActivityAuditList. Returns `timePeriod`, `timeRange`, `getCurrentTimeRange`, and change callbacks.
- **Simplified state**: Removed `isCustomRange`/`setIsCustomRange`/`innerIsCustomRange` prop drilling. Each consumer tracks custom mode locally via the hook. `EntityAudit` just passes a `TimeFilterValue`.
- **Type improvements**: `TimeFilterValue` alias, `isTimeRange` guard, `useState` initializers (no useEffect), `timePeriod` always `string` (never undefined).
- **Locale-aware dates**: `formatDate` and month label use `toLocaleDateString(undefined, ...)` — renders in user's browser locale.

## Non-goals

- Time-of-day picker (deferred)
- Replacing `DatePicker` component (still used in `ActivityAudit/Modals/Revisions.tsx`)
- Changing `TimeRange` model
- Switching date-picker libraries
- Portal-based calendar positioning (known viewport overflow limitation)

## Capabilities

### Modified Capabilities
- `custom-range-picker`: Cap-aware inline calendar range picker with FSM-driven selection, configurable via `AUDIT_MAX_RANGE_DAYS` env var

## Impact

- **New files**: `hooks/use-time-filter.ts`, `RangePicker/range-fsm.ts`, `TimeFilter/TimeFilter.spec.tsx`
- **Rewritten**: `RangePicker.tsx`, `TimeFilter.tsx`, `date-picker.scss`
- **Simplified**: `Dashboard.tsx`, `UsageLog.tsx`, `ActivityAudit/List/List.tsx`, `EntityAudit.tsx` — all use `useTimeFilter` hook
- **Config**: `AUDIT_MAX_RANGE_DAYS` in `.env.template`, `README.md`, `AppContext`, `layout.tsx`
- **Types**: `TimeFilterValue`, `isTimeRange` in `time-range.ts`
- **Removed**: `RangePicker/constants.ts`, `isCustomRange`/`setIsCustomRange` props from all components, 7d/30d presets
