## Why

The Test Suite Trends tab already shows Overall Score, Avg Run Time, and Score Range for the last
`TRENDS_RUN_WINDOW` (10) runs, but it does not surface how those runs compare against the suite’s
optional `overallScoreThreshold`. That threshold is already authored on the Metrics tab and the
per-run overall scores are already loaded for Trends — the gap is a KPI card that was deferred when
Trends shipped. Design exists in Figma (node 10350:84085).

## What Changes

- Add a **Runs Passed Threshold** KPI card to the Trends KPI strip: large `X / Y` metric plus a
  pass / fail / error legend for the last-N Trends window.
- Aggregate threshold outcomes client-side from existing `TrendsRunPoint` data (`overallScore`,
  `isFailed`) and `TestSuite.overallScoreThreshold` — no new backend endpoint or structured-query
  field.
- Hide the card when `overallScoreThreshold` is unset; show it when the threshold is set (including
  `0`).
- Add i18n keys for the card title and “Last {count} Runs” subtitle fragment.

## Non-goals

- No new backend API, structured-query shape, or Trends fetch change beyond using the suite field
  already on the client.
- No change to how `overallScoreThreshold` is edited on the Metrics tab.
- No Overall Score Trend chart changes (threshold markers / badges).
- No browser-verification task (unit/component tests only for this change).

## Capabilities

### New Capabilities

- `test-suite-trends`: Trends tab KPI behavior for runs-passed-threshold aggregation and card
  visibility (Trends had no consolidated capability spec when it shipped).

### Modified Capabilities

_(none)_

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Trends/` — models, parse/aggregate util, `Trends.tsx`,
  `KpiStrip.tsx`, new `RunsPassedThresholdCard.tsx`.
- `apps/ai-dial-admin/src/components/Common/PassFailStatus/` — shared `PassFailFraction` /
  `PassFailStatusBreakdown` reused by Trends and Run Summary / Compare.
- `apps/ai-dial-admin/src/constants/i18n.ts`, `src/locales/en.ts` — new TestSuites i18n keys.
- Co-located unit/component tests under Trends and Common.
