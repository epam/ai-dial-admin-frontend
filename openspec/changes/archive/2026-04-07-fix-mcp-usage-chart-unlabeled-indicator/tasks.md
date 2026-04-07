## 1. i18n Key

- [x] 1.1 Add `Unknown = 'Telemetry.Unknown'` to `TelemetryI18nKey` in `src/constants/i18n.ts`
- [x] 1.2 Add `Unknown: 'Unknown'` translation under Telemetry section in `src/locales/en.ts`

## 2. Chart Data Fix

- [x] 2.1 In `prepareMultiSeriesChartData()` in `src/utils/telemetry.ts` — normalize falsy `row.mcp_method` to `t(TelemetryI18nKey.Unknown)` when building `timeSet`/`methodSet` (lines 134–137) and when populating `dataByMethod` (lines 146–148)

## 3. Tests

- [x] 3.1 Add unit test in `src/utils/tests/telemetry.spec.tsx` — verify `prepareMultiSeriesChartData()` maps rows with empty/undefined `mcp_method` to a series named "Unknown" with a corresponding legend entry

## 4. Quality Checks

- [x] 4.1 Run lint, format, and full test suite to verify no regressions
