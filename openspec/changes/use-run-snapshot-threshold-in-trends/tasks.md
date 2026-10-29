# Tasks

## 1. Preserve and apply each run's threshold

- [x] 1.1 Add the snapshotted overall-score threshold to `TrendsRunPoint` and populate it from
  `Run.suiteSnapshot` in `parseTrendsData`; verify `parse-trends` tests cover both set and unset
  snapshots.
- [x] 1.2 Update Test Cases segment parsing and empty-result fallback to use each run point's
  threshold; verify parser tests cover mixed thresholds, unscored SUCCESS rows, and empty runs.
- [x] 1.3 Select `overall_score_threshold` in the runs structured query and map it into
  `Run.suiteSnapshot`; verify the query projection and row mapping with regression tests.

## 2. Use run-local thresholds in the Trends UI

- [x] 2.1 Update `PassRateCard`, `OverallScoreOfLatestRunCard`, `TestCasesByRunCard`,
  `RunBar`, `TestCasesBarTooltip`, and `LatestRunCard` to use the threshold associated with the
  latest run or individual bar; show a mixed-window legend when necessary.
- [x] 2.2 Add or update component tests for latest-run KPI threshold labels/classification, each
  bar's tooltip threshold, mixed-threshold legends, and the Latest Run gauge; verify with focused
  Trends Vitest specs.

## 3. Run quality gates

- [x] 3.1 Run focused Trends tests, `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`,
  `npm run format`, and `npm run test`; resolve any regressions.

> Browser verification was omitted at the user's request; focused component tests cover the
> deterministic UI contracts.
