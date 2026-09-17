## 1. Shared HeatMap extract

- [x] 1.1 Move domain-free heatmap chrome (constants, layout utils, format-cell-value, tooltip popup centering, axis header, value cell renderer, generic tooltip shell) into `src/components/Common/HeatMap/` with parameterized value-column id prefix; update Compare imports. Verify Compare HeatMap unit specs still pass from `apps/ai-dial-admin/`.
- [x] 1.2 Add `HeatMapGrid` wrapper (fit loop, `GridView`, ColorScale slot) and rewire `HeatMapTab` to use it while keeping Compare fetch/builders/toolbar/label renderer. Verify `HeatMapTab.spec.tsx` still passes.

## 2. Stability data

- [x] 2.1 Add Trends field constants (`TEST_CASE_NAME_FIELD`, `SCORE_FIELD`, `TRENDS_STABILITY_ROW_LIMIT = 200`) and `buildTrendsStabilityQuery(runIds)` matching the BE JSON contract. Verify co-located builder spec deep-equals entity/mode/filter/select/sort/page shape.
- [x] 2.2 Add pivot util (test case × `runOrder`, gap = undefined, duplicate last-wins) and `useTestCaseStabilityData(runOrder)` that skips fetch when empty. Verify pivot unit specs cover present/gap/duplicate cases.

## 3. Stability UI

- [x] 3.1 Add `TestSuitesI18nKey` Stability title/tooltip keys and English strings. Verify mocked `t()` returns keys in a component render.
- [x] 3.2 Implement Trends Stability builders + `TestCaseStability` `SummarySection` (loading / no-data / matrix) using Common `HeatMapGrid`, and mount it in `Trends.tsx` below Metric Trends when `runCount > 0`. Verify Trends and Stability component specs assert section presence, loading, and gap cells.

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled) and resolve any `fail` verdicts before continuing.
  - Result: gate ran; **0 fail**, 4 **blocked** — local app redirects to Keycloak (`/api/auth/signin`). Retest when auth is disabled. Unit/component coverage already covers query, pivot/gaps, and section presence.

## 5. Quality checks

- [x] 5.1 Run targeted vitest for Common HeatMap, Compare HeatMap, and Trends Stability specs from `apps/ai-dial-admin/` and confirm all pass.
- [x] 5.2 Run `npm run lint`, `npm run format:write`, and `npm run typecheck`; fix any issues introduced by this change.
