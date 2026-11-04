## Context

See `proposal.md` for motivation. Today `OverallScoreInfo` receives a whole `TestSuite` — the live one fetched by
`SummaryTab` (single run) or `use-summary-overview-data` (compare) — and hands it to
`buildOverallScoreMethodTooltip`, which only ever reads `suite.overallScore` (type, weights, expression) via
`getOverallScoreFormulaLabelKey`, `getFunctionName` and `getFunctionParameterSources`.

Evidence from the dev backend (read-only probes through the app's own query action, 122 runs sampled):

- `suiteSnapshot` carries `overallScore` in exactly the suite's own shape: `{type:'mean'}`,
  `{type:'weighted_mean', weights:[{metricName, outputField, weight}]}`, or `{type:'custom_function',
  expression:{…}}`. It also carries `overallScoreThreshold`, `testCaseOverallScore` and `metricScoreAggregation`.
- 77 of 104 snapshot-bearing runs have it. All 27 runs created 2026‑04‑22…06‑29 lack it, and the runs created
  2026‑07‑29…10‑26 mostly have it. The date split is not absolute: three October runs (#2122, #2126, #2391) lack
  it too, all of the **same suite**, whose snapshots also lack a threshold and `testCaseOverallScore`, so that
  suite simply never had a method set. Absence therefore means "no method configured", whether the run predates
  the feature or its suite never configured one.
- About 15% of the sample (the oldest runs, Feb–Apr) has no snapshot object at all.
- `snapshotVersion` is `"2"` whether or not the method is present, so it cannot be used to tell them apart.

## Goals / Non-Goals

**Goals:** the tooltip describes what the run was evaluated with, per run, in single run and compare, without
depending on the live suite.

**Non-Goals:** the Trends tooltip (it describes the suite as it is now); the threshold and metric count (already
per run); fetching or caching suites differently for the header.

## Decisions

### 1. A pure resolver decides what to show

`resolveRunScoreMethod(run)` returns `OverallScoreConfig | null`:

- no `suiteSnapshot` → `null` (the info control is omitted);
- snapshot with `overallScore` → that value;
- snapshot without it → `{ type: OverallScoreType.Mean }`.

This keeps the three-way rule in one tested place instead of scattered across components.

*Alternative — fall back to the live suite for old runs:* rejected; that is the bug being fixed, and it would show
today's method for a run that predates the setting.
*Alternative — omit the control for runs without the field:* rejected; "default Mean" is the reading the app
already applies to an unset method, and a tooltip is more useful than none. Runs with no snapshot at all have no such
evidence, so for them the control is omitted rather than guessed.

### 2. Components take the method, not a suite

`SuiteSnapshot` gains `overallScore?: OverallScoreConfig` and `metricScoreAggregation?: string` (documented as
captured at run start). `buildOverallScoreMethodTooltip` and `getOverallScoreFormulaLabelKey` already read only
`overallScore`, so their parameter widens to `Pick<TestSuite, 'overallScore'>` (a full suite still fits, so
Trends is untouched). `OverallScoreInfo` and `OverallScoreValue` take `scoreMethod: OverallScoreConfig | null`
instead of `testSuite`; the control renders only when it is non-null.

### 3. The hooks own the resolution

`useRunKpiCards` returns `scoreMethod` and `useCompareKpiCards` returns `scoreMethods` keyed by slot, both from
`resolveRunScoreMethod`. The `Analytics` components stop taking suite props; `SummaryTab` and
`SummaryOverviewTab` keep their live suite for the header only. As a side effect the control appears
immediately instead of after the suite request, and the "omit until the suite loaded" state disappears.

### 4. Metric count is already historical

The "Mean of N metrics" count comes from the run's own metric snapshots (`getMetricSnapshots(run)`), unchanged.
Weighted-mean lines come from the stored weights, so a metric renamed or removed from the suite later still
shows as the run saw it.

### 5. Spec correction

The Overall Score requirement said the method comes from the current suite "because the snapshot does not carry
it" and omitted the control until the suite loaded. Both are replaced, with scenarios for a method changed after
the run, a snapshot without a stored method (Mean) and a run with no snapshot (no control). The compare requirement's per-run method
scenario is updated to match.

## Risks / Trade-offs

- **"Absent means Mean" is an inference** → it matches how the app already reads a suite with no method, and
  every absent snapshot observed also lacked a threshold and `testCaseOverallScore`. If the backend ever omitted
  the field for a non-default method, such a run would be described as Mean; tighten later if the backend
  guarantees the field.
- **Runs with no snapshot lose the info control** → intentional; nothing records how they were scored.
- **The type now declares fields the backend always sent** → no runtime change beyond the tooltip source; a
  snapshot with an unknown method `type` falls through to the Mean branch exactly as a suite does today.
