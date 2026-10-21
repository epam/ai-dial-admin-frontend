## 1. Data model and aggregation

- [x] 1.1 Add `TrendsThresholdStats` and optional `thresholdStats` on `TrendsKpiData` in `src/components/TestSuites/Trends/models.ts`; set `thresholdStats: null` in `emptyTrendsData` / default KPI shape in `parse-trends.ts`. Verify TypeScript compiles for Trends imports.
- [x] 1.2 Add pure `aggregateThresholdStats(runOrder, threshold)` in `src/components/TestSuites/Trends/utils/threshold-stats.ts` with rules from the delta spec. Verify `npx vitest run src/components/TestSuites/Trends/utils/tests/threshold-stats.spec.ts` from `apps/ai-dial-admin/` covers unset→null, pass/fail/error mix, exact threshold pass, `0` threshold, failed-with-score→error, unscored non-failed only in total.
- [x] 1.3 In `Trends.tsx`, `useMemo` over `data.runOrder` + `selectedTestSuite.overallScoreThreshold` to build kpis with `thresholdStats` and pass them to `KpiStrip`. Verify Trends still renders without a threshold and existing parse-trends expectations include `thresholdStats: null`.

## 2. UI and i18n

- [x] 2.1 Add `TestSuitesI18nKey.RunsPassedThreshold` / `TrendsLastNRuns` and English strings in `constants/i18n.ts` and `locales/en.ts`. Verify keys resolve in a component render (mocked `t()` returns the key).
- [x] 2.2 Implement `RunsPassedThresholdCard.tsx` (Figma fraction + pass/fail/error legend with 12px Tabler icons). Verify co-located component spec asserts title keys, `X / Y`, and zero-count legend labels.
- [x] 2.3 Render the card in `KpiStrip.tsx` only when `kpis.thresholdStats != null`. Verify `Trends.spec.tsx`: no card without threshold; with threshold + scores, title and legend keys appear.

## 3. Common PassFailStatus extract

- [x] 3.1 Add `components/Common/PassFailStatus/` (`PassFailErrorCounts`, `STATUS_DOT_*`, `PassFailFraction` with `dial-display2-text`, `PassFailStatusBreakdown` with 12px icons) and co-located specs. Verify Common specs pass.
- [x] 3.2 Rewire Run Summary / Compare Analytics and Trends `RunsPassedThresholdCard` to Common; alias `TestCaseStatusCounts`; delete old Runs Summary fraction/breakdown files. Verify Summary, Compare, and Trends targeted specs still pass.

## 4. Quality checks

- [x] 4.1 Run targeted vitest for Common PassFailStatus, Trends threshold-stats/parse-trends/RunsPassedThresholdCard/Trends, and Run Summary/Compare Analytics specs from `apps/ai-dial-admin/` and confirm all pass.
- [x] 4.2 Run `npm run lint` and `npm run format:write` (or format) and fix any issues introduced by this change.
