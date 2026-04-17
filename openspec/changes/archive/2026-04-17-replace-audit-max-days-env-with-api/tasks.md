## 1. Constants

- [x] 1.1 Add `TELEMETRY_DATASET_NAME = 'dial_analytics_realtime'` to `apps/ai-dial-admin/src/constants/telemetry.tsx`
- [x] 1.2 Add exported `MS_PER_DAY` to `apps/ai-dial-admin/src/constants/global-time-filter.ts`

## 2. Pure extraction util

- [x] 2.1 Add `extractTelemetryMaxRangeMs(res: ServerActionResponse): number | undefined` to `apps/ai-dial-admin/src/utils/telemetry.ts` (imports `TELEMETRY_DATASET_NAME` from `constants/telemetry`)
- [x] 2.2 Add util tests in `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx` — success, request-failed, dataset-absent, maxTimeRangeMs-missing, non-array response

## 3. TelemetryApi refactor

- [x] 3.1 Update `DASHBOARD_URL` in `apps/ai-dial-admin/src/server/telemetry-api.ts` to use imported `TELEMETRY_DATASET_NAME`
- [x] 3.2 Keep `getDatasets(token)` as a one-line `this.getAction(DATASETS_URL, token)` passthrough (no embedded domain logic)
- [x] 3.3 Update `apps/ai-dial-admin/src/server/tests/telemetry-api.spec.ts` to cover `getDatasets` only (extractor-shape cases live in the util spec)

## 4. AppContext rename

- [x] 4.1 Rename `auditMaxRangeDays?: number` → `telemetryMaxRangeMs?: number` in `apps/ai-dial-admin/src/context/AppContext.tsx` (provider props, context type, value object)
- [x] 4.2 Verify `test-setup.tsx` and any `AppContext.spec` — no existing mock references the old field

## 5. Layout wiring

- [x] 5.1 In `apps/ai-dial-admin/src/app/[lang]/layout.tsx`: remove `process.env.AUDIT_MAX_RANGE_DAYS` read; call `extractTelemetryMaxRangeMs(await telemetryApi.getDatasets(token))`; pass the result to `AppContextProvider` as `telemetryMaxRangeMs`
- [x] 5.2 Grep — no references to `process.env.AUDIT_MAX_RANGE_DAYS` remain

## 6. Preset filter + TimeFilter prop

- [x] 6.1 In `apps/ai-dial-admin/src/constants/global-time-filter.ts`: replace `getTimePeriodOptionsByMaxDays` + `getFilteredTimePeriodOptions` with a single ms-keyed `getTimePeriodOptionsByMaxMs(options, maxRangeMs?)`
- [x] 6.2 Update `apps/ai-dial-admin/src/constants/tests/global-time-filter.spec.ts` — covers undefined (uncapped), zero-matching, 3-day, and Number.MAX_SAFE_INTEGER cases
- [x] 6.3 In `apps/ai-dial-admin/src/components/Common/TimeFilter/TimeFilter.tsx`: rename prop `maxRangeDays` → `maxRangeMs`; compute `maxDays = maxRangeMs != null ? Math.floor(maxRangeMs / MS_PER_DAY) : undefined` and pass to `RangePicker`; import `MS_PER_DAY` from `constants/global-time-filter`
- [x] 6.4 Update `apps/ai-dial-admin/src/components/Common/TimeFilter/TimeFilter.spec.tsx` — use `maxRangeMs`; add preset-filter and badge-presence assertions; import shared `MS_PER_DAY`

## 7. RangePicker shared constant

- [x] 7.1 In `apps/ai-dial-admin/src/components/Common/RangePicker/range-fsm.ts`: import `MS_PER_DAY` from `constants/global-time-filter`; remove the inline copy

## 8. Delete hook, switch telemetry consumers

- [x] 8.1 Delete `apps/ai-dial-admin/src/hooks/use-time-period-options.ts`
- [x] 8.2 `apps/ai-dial-admin/src/components/UsageLog/UsageLog.tsx`: remove `useTimePeriodOptions`; read `telemetryMaxRangeMs` from `useAppContext()`; pass `maxRangeMs={telemetryMaxRangeMs}` to `TimeFilter`
- [x] 8.3 `apps/ai-dial-admin/src/components/Telemetry/Dashboard.tsx`: remove `useTimePeriodOptions` import/call; drop `timePeriodOptions` prop from the `TelemetryControls` call-site (Dashboard no longer forwards it)
- [x] 8.4 `apps/ai-dial-admin/src/components/Telemetry/TelemetryControls/TelemetryControls.tsx`: replace `auditMaxRangeDays` with `telemetryMaxRangeMs` from `useAppContext()`; pass as `maxRangeMs` to `TimeFilter`; drop the now-unused `timePeriodOptions` prop from the interface
- [x] 8.5 Updated specs — none of the three component specs referenced the renamed props (verified)

## 9. Remove cap from ActivityAudit

- [x] 9.1 `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`: remove the `auditMaxRangeDays` destructure from `useAppContext`; remove the `maxRangeDays` prop on `TimeFilter`; remove the now-unused `useAppContext` import

## 10. Cleanup orphaned dataset server action

- [x] 10.1 Delete `getDatasets()` server action in `apps/ai-dial-admin/src/app/[lang]/dashboard/actions.ts` (no live caller after `useTimePeriodOptions` deletion)
- [x] 10.2 Delete its test block in `apps/ai-dial-admin/src/app/[lang]/dashboard/actions.spec.ts`
- [x] 10.3 Remove the `getDatasets: vi.fn(...)` entry from the `UsageLog.spec.tsx` mock

## 11. Docs cleanup

- [x] 11.1 Remove `AUDIT_MAX_RANGE_DAYS` row from `README.md`
- [x] 11.2 Remove the commented `AUDIT_MAX_RANGE_DAYS` entry from `.env.template`

## 12. Sweep + checks

- [x] 12.1 Grep for stale references: `auditMaxRangeDays`, `AUDIT_MAX_RANGE_DAYS`, `getTimePeriodOptionsByMaxDays`, `getFilteredTimePeriodOptions`, `useTimePeriodOptions`, `maxRangeDays`, `getTelemetryMaxRangeMs` — all clear
- [x] 12.2 Run lint, format, tests — lint 0 errors, format clean, all 376 tests pass
