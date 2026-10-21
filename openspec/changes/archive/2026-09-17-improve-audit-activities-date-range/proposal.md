# Improve custom date range UX and add "Since Creation" in Audit / Activities

Issue: epam/ai-dial-admin-frontend#4199

## Why

The Activities sub-tab of an entity's Audit tab (`ActivityAuditList`,
`apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`) renders the shared `TimeFilter`
control (`apps/ai-dial-admin/src/components/Common/TimeFilter/TimeFilter.tsx`) with its predefined
list `timePeriodOptionsConfig` (`apps/ai-dial-admin/src/constants/global-time-filter.ts`) — `Last 15m`
… `Last 30d` — every one of which is a sliding window ending at "now" (`getTimeRangeById`,
`apps/ai-dial-admin/src/utils/time-filter/get-time-range-id.ts`). The custom option opens
`RangePicker` (`apps/ai-dial-admin/src/components/Common/RangePicker/RangePicker.tsx`), backed by the
pure FSM in `range-fsm.ts`. Reading that FSM: a single day click puts the picker in `single` state,
and `toCommit` (`range-fsm.ts:112-125`) already normalizes a `single` state into a same-day
`{startDate, endDate}` pair — `endDate` defaults to `startDate` when no second date has been clicked,
not to today. Because `canApply` in `TimeFilter.tsx:84` is `draft.mode === 'custom' && draft.range !== null`,
Apply is already enabled after that first click, so a user who intuitively expects "from that date to
today" (matching how every preset behaves) instead gets exactly the one day they clicked, with nothing
in the UI signalling that a second click was needed. `openspec/specs/custom-range-picker/spec.md`'s
"Custom requires Apply" scenario ("user clicks Custom, selects **dates**, and clicks Apply") describes
the two-click path but has no scenario for what a single-date Apply produces — this is a real gap, not
a spec the code already violates.

Separately, there is no way to see all activity since an entity was created without first reading its
creation date from the Properties tab, switching back to Audit, and manually placing both calendar
dates.

## What Changes

- **Default the custom range's end date to today when only a start date has been picked**, so a
  single click plus Apply reproduces the "from a point in the past to today" mental model every preset
  already uses. This is a `RangePicker`/FSM-level change (`toCommit`'s `single`-state handling), so it
  applies to `RangePicker` wherever it is mounted — both entity-scoped `ActivityAuditList` and
  `UsageLog` (`apps/ai-dial-admin/src/components/UsageLog/UsageLog.tsx:93`), which renders the same
  `TimeFilter`/`RangePicker` pair. A `UsageLog` custom-range user gets the identical benefit; nothing
  about `UsageLog`'s own behavior is otherwise touched.
- **Add a `Since Creation` predefined option**, visible only where an entity with a known creation
  timestamp is in scope — the Activities sub-tab of an entity's Audit tab
  (`ActivityAuditList` rendered with an `entity` prop from `EntityTabs/Audit/EntityAudit.tsx`). Its
  start date is the entity's `createdAt` (declared on `ModifiedEntity`,
  `apps/ai-dial-admin/src/models/dial/base-entity.ts:5`, already read and displayed today by
  `EntityInfoHeader`, `apps/ai-dial-admin/src/components/EntityHeaderControls/Info/InfoHeader.tsx:20`);
  its end date is today, recomputed on every refresh like every other preset. The option SHALL NOT
  appear on the global `/activity-audit` list (no `entity`), on `UsageLog`, or on `Telemetry/Dashboard`
  — both of the latter accept the same `entity?: BaseEntity` prop and share the same
  `useTimeFilter`/`TimeFilter` pair, but the issue is scoped to the Audit tab's Activities list only.
  It also SHALL NOT appear when `entity.createdAt` is absent (the field is optional).

## Impact

- **Shared component — `TimeFilter` (`Common/TimeFilter/TimeFilter.tsx`)**: already accepts an optional
  `timePeriodOptions` override (currently unused by any caller; `getTimePeriodOptionsByMaxMs` falls
  back to the module-level `timePeriodOptionsConfig` when it is omitted). `Since Creation` is added by
  having `ActivityAuditList` pass an entity-scoped options list through this existing prop rather than
  by mutating the shared `timePeriodOptionsConfig` array — the array stays global and unaffected, so
  `UsageLog` and `Telemetry/Dashboard` are untouched by the new option itself.
- **Shared computation path — `getTimeRangeById` / `useTimeFilter` (`src/utils/time-filter/get-time-range-id.ts`,
  `src/hooks/use-time-filter.ts`) and `ActivityAuditList`'s own `getTimeRangeById(timePeriod)` call
  (`List.tsx:204`)**: all three resolve a preset id by looking it up in the static, entity-agnostic
  `timePeriodOptionsConfig`. `Since Creation`'s start date is per-entity, so it cannot be a plain new
  entry in that array — the resolution path from a period id to a date range has to be able to consult
  the entity in scope. This is the central technical fact the design has to account for; it does not
  change what any existing preset id resolves to.
- **Shared FSM — `RangePicker`/`range-fsm.ts`**: `toCommit`'s single-state branch changes for every
  caller of `RangePicker` (`ActivityAuditList`, `UsageLog`). No other FSM transition (`empty` → `single`
  → `interval`) changes.
- **Spec** — `openspec/specs/custom-range-picker/spec.md`'s "TimeFilter layout with DialSelect and
  footer flyout" requirement needs a new scenario for the single-date-then-Apply case; it currently has
  none. Whether `Since Creation` gets its own requirement there or in one of the activity-audit specs
  (`activity-audit-deployments-tab`, or a new one) is for SA to decide.
- **i18n**: one new key, `TelemetryI18nKey.SinceCreation` (`Telemetry.SinceCreation`), following the
  existing `TelemetryI18nKey.Custom = 'Telemetry.Custom'` pattern
  (`apps/ai-dial-admin/src/constants/i18n.ts:742`).

## Non-goals

- No change to any preset's own offset or label (`Last 15m` … `Last 30d` are unaffected).
- No `Since Creation` option on the global `/activity-audit` list, on `UsageLog`, or on
  `Telemetry/Dashboard` — scoped to the entity Audit tab's Activities sub-tab only, per the issue.
- No fallback UI for an entity whose `createdAt` is missing — the option is simply absent; no
  disabled-with-tooltip treatment.
- No change to the `maxRangeMs` cap behavior already specified for `UsageLog`/telemetry consumers
  (`custom-range-picker/spec.md`, "Configurable max range sourced from backend dataset retention") —
  `ActivityAuditList` remains uncapped as it is today.
- No redesign of the `TimeFilter` dropdown layout, the calendar UI, or the Apply/Cancel flow beyond the
  single-date default-to-today change.
- No change to `Dashboard`'s or `UsageLog`'s own default time period or initialization behavior.
