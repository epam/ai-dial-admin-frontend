## Why

The Trends tab summarizes the last `TRENDS_RUN_WINDOW` (10) runs at the **run** level — one overall
score per run, and (via `add-trends-runs-passed-threshold`) how many of those runs cleared the
suite's `overallScoreThreshold`. Nothing on the tab shows the **case**-level outcome mix inside a
run, so a suite whose overall score is steady while its failure mix churns looks healthy. The new
backend endpoint `GET /api/v1/analytics/eval-summaries/test-case-pass-rate/{testSuiteId}?lastN=`
returns exactly those per-run counts, so the gap is now a frontend-only one.

## What Changes

- Add a **Cases Passed** panel to the Trends tab, sharing a row with Overall Score Trend at an even
  width split below the KPI strip, in the row's second half: a stacked bar per run (oldest → newest) on the left and a
  latest-run readout on the right.
- Each bar stacks four groups bottom-up — pass (`successPassedCount`), fail (`successNotPassedCount`), error
  (`failedCount`) and not scored (`successNoVerdictCount`) — over a fixed-height track whose full height is
  the run's `totalCount`, so bars stay comparable across runs. A run whose buckets sum below `totalCount` leaves the remainder as
  unfilled track.
- Each bar column is an anchor to that run's detail page (`/runs/{testRunName}?id={id}`), so
  middle-click and cmd/ctrl-click work. The response carries no run name, status or timestamp, so
  those come from the suite's runs list joined on `testSuiteRunId`; runs missing from it render
  non-interactive and lose their date and in-progress marker.
- Hover **and** keyboard focus on a bar show one tooltip: run label, date, per-bucket counts, plus an
  "In progress" line for a `RUNNING` run and an "N not run" line for a short sum.
- Latest-run readout: run label linking to the same destination, date, `passed / total` as the
  primary metric with a "cases passed" caption, failed and errored counts, and a delta chip against
  the previous run's passed count. The chip is omitted when the window has fewer than two runs.
- When the latest run reached no pass/fail verdict at all (`successPassedCount` and `successNotPassedCount`
  both `0`, `successNoVerdictCount` above `0`), the primary metric is
  replaced by a "Lack scoring" note, where a `0 / N` readout would be wrong. Read from the run's
  counts, not from the suite's `overallScoreThreshold` — see design.md D11.
- New API client method, server action, response model, and i18n keys for the panel.
- Retitle the Overall Score KPI from `· {n} Runs` to `· Latest Run`. Its value is the newest run's
  score, not an aggregate over the window, so the shared suffix was wrong on that card alone.

## Non-goals

- No change to the existing **Runs Passed Threshold** KPI card. It counts runs against the
  threshold; this panel counts cases within runs. Both stay.
- No baseline-run comparison. The suite has no baseline concept, so the only comparison is against
  the immediately previous run in the window.
- No new structured-query usage — the panel reads the dedicated endpoint, not `eval_summaries` via
  `executeStructuredQuery`.
- No configurable window size. `lastN` is the existing `TRENDS_RUN_WINDOW` constant.
- No drill-down inside the panel beyond the per-run links (no per-case listing, no segment-level
  click targets).
- No change to Overall Score Trend or Metric Trends.

## Capabilities

### New Capabilities

- `test-suite-trends`: case-level pass-rate panel behavior — bar composition and ordering, per-run
  navigation, tooltip content, latest-run readout and delta, and the loading / empty /
  fewer-than-window / lack-scoring / in-progress states.

  Note: `add-trends-runs-passed-threshold` also introduces this capability and has not been archived
  yet, so `openspec/specs/test-suite-trends/spec.md` does not exist on disk. The two deltas add
  disjoint requirements; whichever change archives second folds into the other's consolidated spec.

### Modified Capabilities

_(none)_

## Impact

- `apps/ai-dial-admin/src/models/evaluation/case-pass-rate.ts` — new response/run DTOs.
- `apps/ai-dial-admin/src/server/eval/analytics-api.ts` — new `getTestCasePassRate` method.
- `apps/ai-dial-admin/src/app/[lang]/runs/actions.ts` — new server action.
- `apps/ai-dial-admin/src/components/TestSuites/Trends/` — `use-trends-data.ts` (adds the fetch and
  isolates its failure), `models.ts`, `constants.ts`, `Trends.tsx`, and a new `CasePassRate/`
  directory with the panel, bar, latest-run detail, and a pure series-building util.
- `apps/ai-dial-admin/src/components/Common/PassFailStatus/` — `PassFailStatusBreakdown` gains an
  optional `errorLabel` override. Shared with Run Summary and Run Compare, so the addition must stay
  opt-in.
- `apps/ai-dial-admin/src/constants/i18n.ts`, `src/locales/en.ts` — new TestSuites keys.
- Co-located unit and component tests under `Trends/CasePassRate/tests/` and
  `Common/PassFailStatus/tests/`.
