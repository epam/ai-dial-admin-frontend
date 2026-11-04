# Proposal

## Why

Trends currently applies the editable suite threshold to historical runs, even though each run
stores the threshold used when it was executed. After the suite threshold changes, the latest-run
KPIs and per-run Test Cases tooltips can therefore misrepresent the result the run actually
produced.

## What Changes

- Preserve each run's snapshotted overall-score threshold in Trends run data.
- Use the latest run's threshold for the pass-rate KPI title/value context and Overall Score KPI
  classification.
- Use each individual run's threshold for Test Cases bar classification, empty-evaluation fallback,
  and tooltip labels; use the latest run's threshold for the Latest Run Test Cases gauge.
- Treat a missing threshold in a run snapshot as unset; do not substitute the suite's current value.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-suite-trends`: define threshold behavior from the run snapshot for latest-run KPI cards and
  per-run Test Cases bars/tooltips.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Trends/**` run data, KPI cards, Test Cases data
  parsing, and rendering.
- The structured-query runs projection and mapper, so the run snapshot threshold reaches Trends.
- Co-located Trends unit and component tests.
- No backend API or persisted data changes; the query projects an existing run snapshot field.
