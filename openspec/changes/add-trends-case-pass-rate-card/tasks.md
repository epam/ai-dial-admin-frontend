## 1. API layer

- [x] 1.1 Add `apps/ai-dial-admin/src/models/evaluation/case-pass-rate.ts` with `CasePassRateRun`
      (`testSuiteRunId`, `computationId`, `failedCount`, `successPassedCount`, `successNotPassedCount`, `successNoVerdictCount`,
      `totalCount`) and `CasePassRateResponse` (`testSuiteId`, `runs`). Names come from the backend's
      `RunPassRateDto`, not its internal `RunPassRateStats` projection. The DTO's `status` and
      `runCreatedAtMs` go unused; run metadata is joined from the runs list (design.md D8). Verify
      `npm run typecheck` passes.
- [x] 1.2 Add `AnalyticsApi.getTestCasePassRate(testSuiteId, lastN, token)` in
      `apps/ai-dial-admin/src/server/eval/analytics-api.ts`, hitting
      `${ANALYTICS_RESULTS_URL}/test-case-pass-rate/${encodeURIComponent(testSuiteId)}?lastN=${lastN}`
      and returning `Promise<CasePassRateResponse | null>`. Verify a unit test asserts the built URL
      encodes the suite id and carries `lastN`.
- [x] 1.3 Add the `getTestCasePassRate(testSuiteId, lastN)` server action to
      `apps/ai-dial-admin/src/app/[lang]/runs/actions.ts`, following the existing
      `getUserToken(getIsEnableAuthToggle(), headers(), cookies())` shape used by its siblings. Verify
      `apps/ai-dial-admin/src/app/[lang]/runs/actions.spec.ts` covers it delegating to the api method
      with the token.

## 2. Series building util

- [x] 2.1 Add `CasePassRateBar`, `CasePassRateLatestDetail` and `CasePassRateSeries` to
      `apps/ai-dial-admin/src/components/TestSuites/Trends/models.ts`, and add `casePassRate:
      CasePassRateSeries | null` to `TrendsData` with `null` in `emptyTrendsData()`
      (`utils/parse-trends.ts`). Verify existing `utils/tests/parse-trends.spec.ts` expectations are
      updated and pass.
- [x] 2.2 Implement `buildCasePassRateBars(response, runs)` in
      `apps/ai-dial-admin/src/components/TestSuites/Trends/CasePassRate/utils/case-pass-rate.ts` per
      design.md D7 — reverse the endpoint's newest-first array, index `runs` by `id` once, take the
      label, date, status and href from the join (D8) with a short `testSuiteRunId` prefix as the label
      fallback, emit the four groups' percentages and `notRunCount` clamped at `0`. Verify its unit
      spec covers reversal, the join, fallback label, missing-run `href: null`, short group sum, and
      `totalCount` of `0`.
- [x] 2.3 Implement `getLatestRunDetail(bars)` in the same util — latest bar, `passedDelta` vs the
      previous bar, `null` delta for a single bar, and `isLackingScoring` when the latest bar has no
      pass/fail verdict at all (design.md D11). Verify its unit spec covers positive / zero /
      negative delta, single bar, empty input, and the lack-scoring flag.

## 3. Shared status breakdown

- [x] 3.1 Add `notScored` entries to `STATUS_DOT_CLASSES` (`text-warning`) and `STATUS_DOT_ICONS`
      (`IconCircleDashed`) in `apps/ai-dial-admin/src/components/Common/PassFailStatus/constants.ts`,
      and optional `notScored?: number` and `isVertical?: boolean` props on `PassFailStatusBreakdown`
      that render a fourth status, one per line, only when provided. Verify the existing
      `Common/PassFailStatus/tests/PassFailStatusBreakdown.spec.tsx` still passes unchanged and a new
      case asserts the fourth status appears only with the prop.
- [x] 3.2 Confirm Run Summary, Run Compare Analytics and Trends `RunsPassedThresholdCard` render
      unchanged with the prop omitted. Verify their existing specs pass with no edits.

## 4. Data hook

- [x] 4.1 Extend `apps/ai-dial-admin/src/components/TestSuites/Trends/use-trends-data.ts` with a third
      concurrent `getTestCasePassRate(suiteId, TRENDS_RUN_WINDOW)` call wrapped in its own
      `try`/`catch` resolving to `null`, so a failure leaves the other two fetches intact (design.md
      D6), and pass the built series into `parseTrendsData`. Verify a hook spec asserts: success
      populates `casePassRate.bars`; a rejected pass-rate call yields `casePassRate: null` while
      `runOrder` and `kpis` are still populated; `runs: []` yields `bars: []`.

## 5. Panel UI and i18n

- [x] 5.1 Add the panel's i18n keys to `TestSuitesI18nKey` in
      `apps/ai-dial-admin/src/constants/i18n.ts` and English strings to
      `apps/ai-dial-admin/src/locales/en.ts` — panel title, `Latest Run`, `cases passed`, `not scored`,
      `in progress`, `not run` count, `vs prev`, `Lack scoring`, `no runs yet` and data-unavailable. Reuse `RunsI18nKey.Pass` / `Fail` / `ExecError` and
      `BasicI18nKey` labels where they already exist (`components.md` §10). Verify keys resolve in a
      component render (mocked `t()` returns the key).
- [x] 5.2 Implement `CasePassRate/RunBar.tsx` — anchor column when `href` is set and a
      non-focusable `div` when it is `null`, fixed-height `bg-layer-1` track, absolutely stacked
      non-zero segments bottom-up with the D2 tokens and a 1px `border-tertiary` hairline between adjacent
      segments, `aria-hidden` on nothing but decorative nodes, accessible name covering run label,
      date and all four counts out of `totalCount`, accent border and label for the latest bar,
      visible `focus-visible` ring, and a `DialTooltip` carrying label, date, four counts, plus the
      in-progress and not-run lines. Verify its component spec queries the bar by role and accessible
      name, asserts `href`, asserts the non-interactive variant is absent from the tab order, and
      asserts zero-count buckets render no segment.
- [x] 5.3 Implement `CasePassRate/LatestRunDetail.tsx` — run label as a link (plain text when
      unresolvable), date, `PassFailFraction` with the `cases passed` caption, `PassFailStatusBreakdown`
      for failed/errored, and the delta chip (`bg-accent-secondary-alpha text-accent-secondary` for
      `>= 0`, `bg-error text-error` for `< 0`, omitted when `passedDelta` is `null`). Replace the
      fraction with the lack-scoring note when `isLackingScoring`. No `base:` chip. Verify its
      component spec covers link vs plain text, delta sign and treatment, chip omission for one run,
      and the lack-scoring substitution.
- [x] 5.4 Implement `CasePassRate/CasePassRatePanel.tsx` — `SummarySection` chrome titled
      `Cases Passed · Last {n} Runs`, `flex-col xl:flex-row` split with `xl:border-l border-secondary`,
      left column holding the compact legend and the bar row (oldest first, divider before the latest
      bar), right column holding `LatestRunDetail` under a `Latest Run` heading that moves into the
      card header at xl so the two columns start level. Render the
      loading skeleton (frame, empty tracks, placeholder readout), the `bars: []` "no runs yet" line,
      and the `casePassRate === null` unavailable line. Verify its component spec covers all three
      states plus a 4-run window rendering exactly 4 bars.
- [x] 5.4b Retitle the Overall Score KPI in
      `apps/ai-dial-admin/src/components/TestSuites/Trends/KpiStrip.tsx` to
      `Overall Score · Latest Run`, since `latestOverallScore` is the newest run's score rather than
      an aggregate over the window, and move Avg Test Suite Run Time to the end of the strip so the
      score cards sit together. Rename `CasePassRateLatestRun` to `TrendsLatestRun`, now that two
      features share the label. Verify the existing Trends specs pass unchanged.
- [x] 5.5 Render `CasePassRatePanel` in
      `apps/ai-dial-admin/src/components/TestSuites/Trends/Trends.tsx` below `KpiStrip`, in the
      second half of an even-split row it shares with `OverallScoreTrend`, passing `data.casePassRate` and `isLoading`. Verify
      `tests/Trends.spec.tsx` asserts the panel's presence, its position relative to the two siblings
      and that both halves sit in one row container.

## 6. Tests

- [x] 6.1 Author the unit and component specs named in tasks 1.2–5.5 as co-located
      `tests/<name>.spec.ts(x)` files under `Trends/CasePassRate/`, `Trends/CasePassRate/utils/`,
      `Common/PassFailStatus/` and `server/eval/`, following `.claude/rules/testing.md` (role and
      accessible-name queries, mocks added to `test-setup.tsx` rather than inline). Verify
      `npx vitest run src/components/TestSuites/Trends src/components/Common/PassFailStatus` from
      `apps/ai-dial-admin/` passes.
- [x] 6.2 Add `npm run typecheck:specs` coverage discipline for the new specs: type the pass-rate
      fixtures against `CasePassRateResponse` rather than `any`, so this change adds no new entries to
      the reported spec-typecheck count. Verify the count reported by `npm run typecheck:specs` does
      not name any file added by this change.

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format:write`, `npm run typecheck` and `npm run test` and fix
      everything this change introduced. Verify all four are clean.
