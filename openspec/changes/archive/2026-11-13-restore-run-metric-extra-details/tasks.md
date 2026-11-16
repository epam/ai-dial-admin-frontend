## 1. Read the extra keys

- [x] 1.1 Add `details: string | null` to `MetricFieldInfo` in `Runs/Details/RowDetails/models.ts` and update its doc comment; verify `npm run typecheck` flags every producer and fixture that must set it.
- [x] 1.2 In `RowDetails/utils/metric-field-info.ts`, build `details` from the leaf entry minus `reason`, `verbose_logs` and `error` (JSON, indented; a non-object entry serialized as is; `0`, `false`, `''` and `[]` values kept; `null` when nothing remains) and count it in the "has any info" check. Keep the reserved keys in `RowDetails/constants.ts` next to `METRIC_INFO_*_KEY`. Verify with the util tests in 3.1.

## 2. Show the details card

- [x] 2.1 Add `MetricInfoSection.Details` (`ValuePopups/models.ts`), the `details` field on `ScoreRunData`, and `Runs.MetricDetails` (`constants/i18n.ts`, `locales/en.ts`, value `details`); map it in `METRIC_INFO_SECTION_I18N` (`ValuePopups/constants.ts`). Verify with `npm run typecheck`.
- [x] 2.2 In `ValuePopups/utils.ts` set `details: formatInfoText(info?.details ?? null)` in `getScoreRunData`; in `ScoreColumn.tsx` render the card between reason and logs (`INFO_SECTIONS` order Reason, Details, Logs, no diff highlights). Verify with the component tests in 3.3.
- [x] 2.3 In `ScoreModal.tsx` replace the constant `DEFAULT_OPEN_SECTION` with the first of Reason, Details, Logs that any column holds, taken once through the `useState` initializer. Verify with the component tests in 3.3 (reason still the default; details open when there is no reason).

## 3. Tests

- [x] 3.1 Update `RowDetails/utils/tests/metric-field-info.spec.ts`: flip "Should ignore entries other than reason and logs" and "Should ignore a leaf entry that is not an object"; add cases for the Set Comparison entry (all six keys, zeros and empty lists kept), reserved keys excluded, a string and an array entry, and no `details` when only reserved keys exist. Run `npx vitest run src/components/Runs/Details/RowDetails/utils/tests/metric-field-info.spec.ts`.
- [x] 3.2 Update `ValuePopups/tests/utils.spec.ts` (`getScoreRunData` carries a JSON-tagged `details`, `null` without info) and any `MetricFieldInfo` fixture in `row-detail-sections.spec.ts`, `BottomDrawer/tests/utils.spec.ts` and `Compare` specs that now needs `details`. Run those files plus `npm run typecheck:specs`.
- [x] 3.3 Add component cases to `Runs/Compare/ExecutionResults/RowCompareDetails/tests/FieldCompareModal.spec.tsx` (the single-run `ScoreModal` and the comparison blocks): details card shown, order reason/details/logs, details open when no column has a reason, reason stays open when it exists, no details card when absent, one-open-at-a-time with details, details only in the column of the run that has it. Run that file.

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass at zero errors, coverage gate not regressed.
