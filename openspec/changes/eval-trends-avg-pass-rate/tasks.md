# Tasks

## 1. OpenSpec and deferred-card cleanup

- [x] 1.1 Keep proposal, design, delta spec, and implementation aligned on the pass-rate card row,
      endpoint contract, trend badge rules, and footer from loaded suite count.
- [x] 1.2 Lift the deferred pass-rate wording in
      [`openspec/changes/entity-eval-trends/proposal.md`](../entity-eval-trends/proposal.md) and
      [`design.md`](../entity-eval-trends/design.md) so that open change points at this follow-up.

## 2. API and helpers

- [x] 2.1 Add suite pass-rate types, 100-id chunking, suite-weighted combine, and trend direction
      helpers under `components/EvalTrendsTab`.
- [x] 2.2 Add `RunsApi.getSuitePassRate` (`POST /api/v1/analytics/test-suites/pass-rate`) and a
      `getSuitePassRate` server action that batches and combines results.

## 3. Card UI

- [x] 3.1 Add `EvalAvgPassRateCard`, trend badge, and `use-suite-pass-rate` hook; wire i18n title and
      Trending up / Trending down strings.
- [x] 3.2 Place the card in a wrapping row before `EvalMonthCostCard` in `EvalTrendsTab`.

## 4. Tests

- [x] 4.1 Unit-test chunking, weighted combine, and trend direction.
- [x] 4.2 Component-test card states (up, down, no badge, failure em dash, footer) and empty-suite
      omission in `EvalTrendsTab`.

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled,
      eval API available) and resolve any `fail` verdicts before the change is complete.
      Attempted: all 5 scenarios **blocked** by Keycloak sign-in (`auth` enabled on
      `localhost:4200`). No `fail` verdicts. Retest when auth is disabled.

## 6. Quality gates

- [x] 6.1 Run lint/format, both typechecks, and the focused vitest specs for the new and updated
      files.
