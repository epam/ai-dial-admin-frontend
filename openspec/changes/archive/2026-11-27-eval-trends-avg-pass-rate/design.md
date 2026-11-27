# Design

## Context

Eval Trends already shows “Trends in All Test Suites” with a month-to-date cost card
(`EvalMonthCostCard`). Figma places an average pass-rate card in the same row before that cost card.
The eval backend now returns a suite-weighted summary from
`POST /api/v1/analytics/test-suites/pass-rate` (`passRate`, `previousPassRate`, `suiteCount`,
`previousSuiteCount`; rates 0–1; max 100 distinct suite ids per request).

## Goals / Non-Goals

**Goals:**
- Show the average pass-rate KPI when suites exist, beside the cost card.
- Derive trend from `passRate` vs `previousPassRate` (higher is better).
- Keep failures local to the card (em dash) so the suite picker and Trends stay usable.
- Batch suite ids at 100 and combine batch summaries with a suite-weighted mean.

**Non-Goals:**
- Changing cost-card windows, suite Trends KPIs, or score pills.
- Showing a numeric delta badge (Figma uses “Trending up” / “Trending down” copy).
- Using the API’s `suiteCount` as the footer (footer is the loaded suite list length).

## Decisions

1. **Reuse the cost-card frame.** `KpiCardFrame` + `dial-display2-text` + filled ui-kit `Badge` with
   Tabler carets, matching `EvalMonthCostCard` / `EvalMonthCostDeltaBadge`. No tooltip on this card.

2. **Footer from loaded suite count.** Same `EvalTrendsBasedOnAllSuites` plural as the cost card,
   with `suites.length`. The API `suiteCount` is only how many suites contributed a scored latest run.

3. **Batch and fail closed.** Chunk ids at 100. Combine with
   `sum(rate * count) / sum(count)` for current and previous separately. Any batch failure clears the
   card to an em dash (no partial average). Empty id list skips the request.

4. **Trend badge rules.** Green + caret-up + “Trending up” when `passRate > previousPassRate`; red +
   caret-down + “Trending down” when lower; omit the badge when either rate is missing or they are
   equal.

5. **Layout.** Header stays above; a wrapping flex row holds pass-rate then cost, each
   `w-full max-w-[24.625rem]`. Empty-suite state shows neither card.

## Risks / Trade-offs

- Entities with more than 100 suites need multiple POSTs; weighted combine preserves equal suite
  weight across batches.
- A suite with a latest run but no previous run contributes only to `passRate`; the badge stays
  hidden until both means exist.

## Migration Plan

None. Deploy with a backend that already serves the pass-rate endpoint.
