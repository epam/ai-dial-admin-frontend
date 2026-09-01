## Context

See proposal.md — Why. Trends already loads last-`TRENDS_RUN_WINDOW` runs with `overallScore` and
`isFailed` via `parseTrendsData`. The suite’s optional `overallScoreThreshold` is already on
`TestSuite` and edited on the Metrics tab. The KPI strip uses local card chrome (`TrendsKpiCard`,
`ScoreRangeCard`) rather than `DialAnalyticsCard`. The X/Y fraction and pass/fail/error legend are
shared with Run Summary / Compare via Common presentational components.

## Goals / Non-Goals

**Goals:**
- Derive threshold stats from existing `TrendsRunPoint[]` + suite threshold without a new fetch.
- Re-aggregate when the threshold changes without refetching Trends data.
- Match Figma Trends card chrome; share fraction + legend UI with Run Summary / Compare through
  domain-free Common components.

**Non-Goals:**
- Extending `parseTrendsData`’s query folding responsibilities beyond attaching an optional stats
  field when convenient.
- Replacing Trends card shells with `DialAnalyticsCard` (Trends keeps its own chrome).

## Decisions

**1. Pure `aggregateThresholdStats(runOrder, threshold)` util; attach stats in `Trends.tsx` via
`useMemo`.**
Keeping aggregation outside `parseTrendsData` preserves that util as “fold query rows → series/KPIs”
and lets the suite threshold update recompute without touching the fetch hook. Alternative:
pass threshold into `parseTrendsData` / `useTrendsData` — rejected because it couples fetch to a
field that does not affect the query and complicates existing parse tests.

**2. `thresholdStats: TrendsThresholdStats | null` on `TrendsKpiData`; null means hide the card.**
`TrendsThresholdStats` is an alias of Common `PassFailErrorCounts`. `KpiStrip` renders
`RunsPassedThresholdCard` only when stats are non-null. `0` threshold still produces a stats object.
Alternative: separate boolean `hasThreshold` — rejected as redundant with nullability.

**3. Common `PassFailStatus` for fraction + legend; Trends card composes them.**
Extract `PassFailFraction` and `PassFailStatusBreakdown` (plus `STATUS_DOT_*`) to
`components/Common/PassFailStatus/`. Run Summary and Compare consume the same pieces. Trends
`RunsPassedThresholdCard` keeps Trends border/padding/title chrome and slots in the Common
fraction + non-compact breakdown (not via `TrendsKpiCard`’s `<p>` description — invalid nesting).
Typography: numerator `dial-display2-text`; denominator `/{total}`; legend icons always 12px;
non-compact legend uses `dial-tiny-text`. Compare keeps `compact` + optional tooltip.

**4. Card placement in the KPI strip.**
Rendered when threshold is set (alongside Overall Score / Avg Run Time / Score Range).

**5. Title uses fixed `TRENDS_RUN_WINDOW`, not `kpis.runCount`.**
Figma shows “Last 10 Runs” as the configured window, not “Last {actual} Runs”.

## Risks / Trade-offs

- **[Risk]** Unscored non-failed runs make `passed + failed + error < total`. → **Mitigation:**
  accepted and specified; legend always shows all three statuses so users see zeros rather than a
  silent missing bucket.
- **[Risk]** Threshold edited on Metrics while Trends is open may not remount if the same suite
  object reference is mutated carefully. → **Mitigation:** `useMemo` depends on
  `selectedTestSuite.overallScoreThreshold` (primitive), so any value change recomputes.
- **[Risk]** Unifying Summary legend to 12px / `dial-tiny-text` and fraction to `dial-display2-text`
  slightly changes Run Summary visuals. → **Mitigation:** intentional alignment with Trends Figma
  and the shared Common component.

## Migration Plan

Frontend-only additive UI plus a presentational extract. Deploy anytime; suites without a threshold
see no Trends card change. Rollback is a plain revert.

## Open Questions

None.
