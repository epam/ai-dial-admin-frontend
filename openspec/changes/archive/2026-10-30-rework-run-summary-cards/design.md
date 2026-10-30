## Context

See `proposal.md` for motivation and `specs/run-summary-kpi-cards` for behavior. Facts about the current code
that shape the approach:

- `Runs/Summary/Analytics.tsx` (single) and `Runs/Compare/Summary/Analytics.tsx` (compare) both render
  ui-kit `AnalyticsCard`. The kit card already supports `compareValues` (two titled sides), a title-adjacent
  `delta` badge (`deltaPositive` flips colour, `deltaUnit` is a **suffix**), `error`, and ReactNode `title`,
  `value` and `description`, so the card shell does not need replacing.
- The Test Suite Trends KPI strip (archived `refactor-test-suite-trends`, spec `test-suite-trends`) already
  implements most of the new design: `Common/ChevronBadge` (above/below glyph), `buildOverallScoreMethodTooltip`
  (Mean / Weighted mean / Function), above/below tooltip copy, `passRateBarColor` / `formatPassRatePercent`,
  `RunTestCaseSegments` (above / below / errorOrNa), `useSourceKindLabel` / `resolveSuiteSourceKind`, and
  `getRunsTotalCosts`. Trends renders its own `KpiCardFrame`, not `AnalyticsCard`.
- Single-run cost state (pending, error, dash, per-run eligibility: transitional status, MCP/Route suite,
  unpriced model, 12 h stale rule) is wired inline in `Runs/Summary/Analytics.tsx` over `useRunCosts`,
  `useDeploymentType`, `useModelPricing`. Compare has no cost cards today.
- `RunAnalyticsSlice` holds `statusCounts` (passed / failed / error / total) and `avgRunTimeMs` /
  `avgMetricEvalDurationMs`; the compare "matching-only" mode builds the same slice from the comparison
  endpoint's `unmatchedEvalSummaryIds` / `unmatchedEvalTestCaseIds` exclusion filters.
- `SuiteSnapshot` carries `overallScoreThreshold` and `testCaseOverallScore` but **not** the suite-level
  `overallScore` definition (Mean / Weighted mean / Function). `SummaryTab` and `use-summary-overview-data`
  already fetch the live `TestSuite` for the header.
- The single run strip is a flex row from `xl` up (`ANALYTICS_KPI_GRID_CLASS`); compare is
  `flex flex-col sm:flex-row sm:flex-wrap`.

## Goals / Non-Goals

**Goals:**
- One set of per-run card *content* components used by both the single strip and each side of the compare
  cards, so formatting, states and tooltips cannot drift between the two.
- Reuse Trends building blocks instead of duplicating them; extract only what a third caller forces.
- Keep the existing cost-eligibility and polling rules byte-for-byte; change only the data shape and render.

**Non-Goals:**
- Replacing `AnalyticsCard` with a bespoke card frame.
- Touching Trends data fetching (runtime still averages there).
- Persisting anything or adding backend endpoints.

## Decisions

### 1. Card shell: keep `AnalyticsCard`; compose content as ReactNodes

Single: `<AnalyticsCard title value description className error />`. Compare: the same card with
`compareValues=[{title: runName, value: <content>}, …]` plus `delta`. The five per-run content pieces live in
`Runs/Summary/Cards/` (one component per file, per `components.md` §3): `TestCasesCompletedValue`,
`PassRateValue`, `OverallScoreValue`, `RuntimeBreakdownValue`, `CostBreakdownValue`. Each takes plain data
(already-derived numbers/flags) and renders value + the lines under it; it knows nothing about single vs
compare. Overall Score's card-level "Based on completed test cases" label is passed as `description`, which in
compare mode stays below both runs. In compare the info control sits beside each score (the value component
takes `isInfoInline`), in single mode it sits on the description row (per the two Figma frames).

*Alternative — build a `KpiCardFrame`-style card like Trends:* rejected; it would re-implement compare layout,
divider, delta badge and error tag that the kit already provides and keep the Runs strip visually in sync
with the rest of the kit.

*Open risk with this choice:* `AnalyticsCard` is a 2.0 kit component whose `delta` is a number with a suffix
unit. Runtime (`+110s`), rate (`+87%`) and counts (`-3`) fit; cost needs a `$` **prefix** (`-$10`) and the
overall-score delta needs three decimals. At apply time confirm the kit's number formatting through the
ui-kit MCP (`getEntityDetails AnalyticsCard`); if it cannot render prefix/precision, pass a ReactNode `title`
that appends a ui-kit `Badge` (green/red) for those cards, using the same sign/colour helper as the other
cards (`getMetricDelta` + polarity). This is a contained fallback, not a new component family.

### 2. Completion model derived from status counts, not a second query

Today's single `test_case_eval_scores` aggregate (grouped by `passed`, `execution_status`) already has every
number. Add `unscored` (SUCCESS with null `passed`) to `TestCaseStatusCounts` and derive in a pure util
`toCompletionBreakdown(counts, hasThreshold)` → `{ total, completed, above, below, errorOrNa }`:
threshold set → `completed = passed + failed`, `above = passed`, `below = failed`, else
`completed = passed + failed + unscored`, `above = below = 0`; `errorOrNa = total − completed`. The rate is
`(hasThreshold ? above : completed) / total`. This matches `parseRunTestCaseSegments` in Trends (same
classification) without importing its run-order shape. The slice stays threshold-agnostic, so the matched-only
compare path (`toMatchedAnalyticsSlice`) and the full-run path keep sharing it.

*Alternative — reuse `parseRunTestCaseSegments` directly:* rejected; it is keyed by `runOrder` and requires
the threshold at parse time.

### 3. Runtime: true totals via `sum`, matched-only via exclusion ids

Replace `buildAvgRunTimeQuery` / `buildAvgMetricEvalDurationQuery` with `buildTotalRunTimeQuery(runId,
excludeEvalSummaryIds)` and `buildTotalMetricEvalDurationQuery(...)` using `fn('sum', [...])` over
`exec_duration_ms` / `metric_eval_duration_ms`; the slice carries `totalRunTimeMs` and
`totalMetricEvalDurationMs`. Both queries take the same exclude-ids filter the metric-eval average already
had, so matched-only compare works for runtime (the old source-time average had no exclusion and the matched
slice borrowed the run-level value — now fixed). Total = sum of the present parts (reuse the Trends
`comboTrendTotal` semantics: null only when both are null). Display: seconds, one decimal, `s` suffix, no
space (`632s`), via `formatRunTimeSeconds` (renamed from `formatAvgRunTimeSeconds`).

*Alternative — sum of the two averages (what Trends shows today as "Total Runtime"):* rejected as a *total*
that is really "average per test case", mislabelled by the card title; it also cannot scale with the number
of test cases. Flipping to averages later is a two-query change.

### 4. Cost: switch to the run-totals endpoint, keep the state machine

`useRunCosts` currently polls `getRunCosts` (averages). The new card needs totals and a source/metrics split,
which `getRunsTotalCosts([runId])` already returns (`testCaseCost`, `metricEvalCost`, `totalCost`) and the
Runs list / Trends already use. Change `useRunCosts` to call it for one id and normalise to
`{ sourceCost, metricsCost }` (first element, missing → not-ready). `hasRunCostFigure` becomes "either part is
finite". Polling cadence, `COST_FETCH_MAX_WAIT_MS`, stale-run single read, and the `canHaveCosts` gating are
untouched. `getRunCosts` / `RunCosts` / their tests are removed if no caller remains (grep before deleting).

Extract the eligibility wiring now inline in `Analytics.tsx` into a hook `useRunCostState(run,
metricSnapshotCount)` returning `{ costs, isPending, hasError, display, … }`. The single strip calls it once;
compare calls it per run (hooks called twice at top level, not in a loop). This is the "third caller" that
justifies the extraction (single + two compare sides).

Absent-part rule: total = sum of present parts; a part whose value is null renders `—`. The
"zero metrics → Metrics value is `—` immediately" rule stays keyed on `metricSnapshotCount === 0`; compare
needs a count per run, so `use-summary-overview-data` exposes `primaryMetricCount` / `comparedMetricCount`
from the metric snapshots it already loads (confirm at apply time; if only the union of options is kept,
derive per-run counts from each run's own snapshot response before unioning).

### 5. Overall-score method comes from the live suite; threshold from the snapshot

`buildOverallScoreMethodTooltip(suite, t, metricCount)` is reused as-is from Trends via `@/` import (no
move — Trends already imports `hasOverallScoreThreshold` from Runs the other way, so the cross-feature
dependency is established). Because `SuiteSnapshot` lacks the suite-level definition, the tooltip reads the
suite fetched for the header (`testSuite` in `SummaryTab`; `primaryTestSuite` / `comparedTestSuite` in
compare, passed down to `Analytics`). If the suite is not loaded or failed, the info control is omitted
(spec). Known limitation: a suite edited after the run shows its current method; the per-test-case
`testCaseOverallScore` and threshold the run actually used are in the snapshot, but the suite-level method is
not, and adding it to the snapshot is a backend change outside this scope.

Above/below uses `run.suiteSnapshot.overallScoreThreshold` (inclusive `>=`), exactly as today's
`hasOverallScoreThreshold` gate. Score shown with `toFixed(3)`.

### 6. Pass-rate bar: extract to `Common/`, Trends adopts it

Three callers now draw the same bar (Trends `PassRateCard`, single run, each compare side). Extract
`Common/PassRateBar` (percent value, colour from the ≥70 / 40–69 / <40 rule, `role="progressbar"` with
`aria-valuenow`/`aria-valuetext` and an accessible name from the card title). Move `passRateBarColor` and
`formatPassRatePercent` next to it and have Trends import from the new location; Trends keeps its own
`segmentPassRate`. Colours: the Trends util hard-codes hex. Replace with the existing `score-abs-*` Tailwind
tokens if the Figma palette (node 1344-40512) maps onto them, otherwise keep the three values as named
constants in one place and flag the token gap to design — never reintroduce inline hex at call sites
(`components.md` §6). The kit `ProgressBar` is not used: it has no per-value colour prop and its 8/4 px sizing
differs from the design's thin bar.

### 7. Tooltips and accessibility

- Hover surfaces use the kit `Tooltip`. Their triggers must also work from the keyboard (`a11y.md`
  "Keyboard parity"): the score value and the completed-count value are focusable (`tabIndex={0}`) with the
  tooltip bound to focus too; the info control is a real `<button type="button">` with
  `aria-label={Calculation method}` (as in Trends).
- The above/below glyph is decorative (`aria-hidden`), so the value wrapper carries the state for assistive
  tech (`role="group"` + `aria-label` = the same sentence as the tooltip, or an `sr-only` span).
- Completed-count breakdown rows are plain text; the glyphs next to them are `aria-hidden`.
- Colour tokens only; `text-error` / `text-secondary` pairs per `a11y.md` contrast table.

### 8. Strip layout

Single: keep `ANALYTICS_KPI_GRID_CLASS` (5 cards fit the existing 3-column → flex-row breakpoint ladder).
Compare: keep the existing flex-wrap row; with five cards `min-w-0 flex-1` as today. No new breakpoints.

### 9. Source-type label

`useSourceKindLabel(suite)` and `resolveSuiteSourceKind` take a `TestSuite`; the snapshot has the same
`deploymentRef` / `mcpDeploymentRef` / `routesRef`. Widen their parameter type to
`Pick<TestSuite, 'deploymentRef' | 'mcpDeploymentRef' | 'routesRef'>` so the snapshot passes without a cast;
keep the "Source" fallback when no kind resolves. The compare strip resolves one label per run.

### 10. Removals

After the cards move, `PassFailFraction` / `PassFailStatusBreakdown` (and `constants.ts`/`models.ts`) have no
callers in `Runs/`. Grep for other users; delete the component, its specs and the now-unused Runs i18n keys
(`TestCasesPassed`, `AvgTestCaseRunTime`, `AvgMetricEvalLatency`, `TestCaseLlmCost`, `MetricEvalCost`,
`AvgPerTestCase`, `OverallScoreDescription`) if nothing else references them. Reuse existing Trends /
TestSuites keys for identical copy (`TrendsOverallScore*ThresholdTooltip`, `TrendsThresholdLabel`,
`TrendsMetricsLabel`, `OverallScoreCalculationMethod`, `TrendsTotalTestCases`, Completed / Above / Below /
Error-or-N/A labels) — check `BasicI18nKey`/`RunsI18nKey`/`TestSuitesI18nKey` before adding new strings
(`components.md` §10). New Runs keys: `TestCasesCompleted`, `ThresholdPassRate`, `CompletionRate`,
`TotalRuntime`, `TotalRunCost`, `BasedOnCompletedTestCases`, plus whichever tooltip labels have no existing
equivalent.

### 11. Compare data flow

`Compare/Summary/Analytics` gains `primaryRun`, `comparedRun` (for snapshot threshold, status, deployment),
`primaryTestSuite`, `comparedTestSuite`, per-run metric counts. `SummaryOverviewTab` already holds the runs
and suites. Deltas: `getMetricDelta(primary, compared)` (second − baseline) unchanged; polarity via
`deltaPositive` for runtime and cost. Mixed-threshold pair: title uses "either has threshold"; the side
without a threshold renders `—` and the rate delta is suppressed (today's behaviour for the passed card,
kept).

## Risks / Trade-offs

- **Backend may not accept `sum` on the eval structured-query endpoint** (the app uses `sum` only against the
  analytics service). → First task verifies a live `sum` query; if rejected, fall back to `avg × count`
  with the count taken from the same exclusion filter (documented trade-off: rounding error ≤ 0.5 ms per
  row), and record the decision in this file.
- **Totals endpoint not-ready shape is unverified** (list vs entry with nulls vs empty body). → The state
  machine treats every non-finite shape as "no figure", so any of them keeps polling; covered by hook tests
  for each shape.
- **Compare cost ignores the matching-only toggle** because cost exists only per run; a user could read the
  matched-only counts next to whole-run cost as inconsistent. → Specified behaviour; no UI note added
  (not in the design). Raise with design if confusing.
- **Runtime semantics differ from Trends** ("Total Runtime" true sum here, average-sum there) until the
  follow-up. → Called out as a non-goal in the proposal.
- **Method tooltip reflects the current suite, not the run-time one** (see decision 5). → Accepted; documented
  in the spec so tests pin it.
- **Kit `delta` formatting limits** (decision 1). → Contained ReactNode-title fallback.
- **Mixed-threshold compare** is a rare edge with a debatable presentation. → Keeps the current em-dash
  behaviour rather than inventing a new one.

## Open Questions

- Exact token mapping for the three pass-rate colours (Figma palette node 1344-40512) — decided while
  implementing; does not change specs or tasks.

## Implementation notes

Deviations from the decisions above, found while applying:

- **Tooltip triggers are `<button type="button">`, not focusable spans** (decision 7). `tabIndex` on a
  non-interactive element trips `jsx-a11y/no-noninteractive-tabindex`; a button is focusable, lint-clean and
  matches the info control.
- **Cost diff uses a local `DeltaBadge`** (decision 1 fallback, applied). The kit card formats `delta` as
  `+<n><unit>` with no precision control, so `-$10` is rendered by a ui-kit-styled pill inside the card
  `title`. Runtime (`s`), rate (`%`), count and score badges use the kit's own `delta`.
  `formatCostDelta(latest, previous)` is latest − previous, so compare calls it as
  `(second run, baseline)`.
- **No new "Based on completed test cases" Runs key**: the identical Trends copy
  (`TestSuitesI18nKey.TrendsBasedOnCompletedStatic`) is reused, as are the Completed / Above / Below /
  Error-or-N/A / Total / Threshold / Metrics labels. New Runs keys are the five card titles only. The
  "Error" line label reuses `ErrorI18nKey.Error`.
- **Cost state while only the Metrics value is known** (zero-metrics run, cost still pending): the total and
  the source value show the Calculating label and Metrics shows a dash; the "usually under 10 min" copy is
  used only when the Metrics value is also pending.
- **Compare "no results" Error for cost** is evaluated only from full-run slices; in matching-only mode the
  matched runtime being absent does not mark a run's cost as Error.
- **`sum` support (task 1.1) is confirmed**: the Total Runtime card renders its `sum` query result against the
  live eval backend, so the `avg × count` fallback in Risks was not needed.
