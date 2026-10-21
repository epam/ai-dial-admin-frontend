## Context

See proposal.md — Why. Trends loads last-`TRENDS_RUN_WINDOW` runs via `metric_score_results` +
`getRuns` into `TrendsData.runOrder` ([`use-trends-data.ts`](apps/ai-dial-admin/src/components/TestSuites/Trends/use-trends-data.ts)).
It does not query `eval_summaries` today. Run Comparison Heat Map
([`Runs/Compare/HeatMap/`](apps/ai-dial-admin/src/components/Runs/Compare/HeatMap/)) is an AG Grid of
metrics × test cases with Absolute/Delta and a metrics toolbar — tightly Compare-coupled, but its
layout fit loop, axis header rotation, value-text threshold, and tooltip centering are reusable.
`ColorScale` already lives in Common. Trends sections use [`SummarySection`](apps/ai-dial-admin/src/components/Runs/Summary/SummarySection.tsx).

## Goals / Non-Goals

**Goals:**
- Extract domain-free heatmap grid chrome to `Common/HeatMap/` and rewire Compare to it without
  changing Compare product behavior.
- Fetch Stability from `eval_summaries` using the exact BE row-query contract keyed by `runOrder`
  IDs; pivot to test-case × run cells with gap / last-wins semantics.
- Render Stability as a Trends `SummarySection` consuming the shared grid shell.

**Non-Goals:**
- Unifying Compare and Trends data models or toolbars.
- Raising the BE sample page limit (200) without a product decision.
- Folding Stability into `useTrendsData`’s primary Promise.all (keep charts independent of summaries).

## Decisions

**1. Extract chrome only; keep Compare builders in place.**
Move layout helpers, axis header, numeric value cell, tooltip shell, fit-loop wrapper (`HeatMapGrid`),
and constants to `Common/HeatMap/`. Parameterize value-column id prefix (`tc_` vs `run_`). Leave
`buildHeatMapRows*` / `buildHeatMapColumns`, toolbar, label renderer (group + run badges), and
Compare tooltip payload under Compare. Alternative: move the whole HeatMap folder — rejected; it
would drag Compare domain into Common (violates components.md §4).

**2. Second fetch after `runOrder`, not a parallel Trends bootstrap query.**
`useTestCaseStabilityData(runOrder)` calls `executeStructuredQuery(buildTrendsStabilityQuery(runIds))`
when `runIds.length > 0`. Charts/KPIs stay on `useTrendsData` alone. Alternative: add summaries to
`useTrendsData` Promise.all — rejected; slows first paint of KPIs/charts when summaries are slow,
and couples empty-window handling.

**3. Exact BE query shape via DSL helpers.**
`rowQuery` + `inValues(RUN_ID_FIELD, Uuid, runIds)` + four `col(field(...))` selects + two
`sortItem`s + `offsetPage(0, TRENDS_STABILITY_ROW_LIMIT=200, false)`. Unit-test deep-equals the
JSON contract. Alternative: hand-built JSON — rejected; rest of Trends/Summary uses the DSL.

**4. Pivot util: rows = runOrder (runs), columns = test cases, cell = score (+ passed for tooltip).**
Missing pair → `undefined` (gap). Duplicate pair → last row wins. Score drives accuracy
`ColorScale` cell style; `passed` is tooltip-only unless Figma requires otherwise at apply time.

**5. Stability feature builders feed Common `HeatMapGrid`.**
`build-stability-rows.ts` / `build-stability-columns.ts` under Trends; label column is test case
name only (no Compare group rows).

## Risks / Trade-offs

- **[Risk]** Limit 200 truncates large suites (10 runs × many cases). → **Mitigation:** match BE
  sample; document in tasks; raise later if product asks.
- **[Risk]** Extract regresses Compare Heat Map layout. → **Mitigation:** keep Compare specs green;
  parameterize prefix carefully; no Absolute/Delta logic in Common.
- **[Risk]** `test_case_name` collisions across differently typed cases. → **Mitigation:** accepted;
  join key is name as BE returns; same as Trends charts’ run-name display.

## Migration Plan

Frontend-only. Deploy anytime. Rollback is a plain revert. Compare Heat Map path changes are a
refactor with no API contract change.

## Open Questions

None.
