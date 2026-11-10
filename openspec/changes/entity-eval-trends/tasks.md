# Tasks

## 1. Tab wiring and i18n

- [x] 1.1 Add `EntityViewTab.EvalTrends`, `evalTrendsTab`, and `evaluationEnabled` gating in
  [`apps/ai-dial-admin/src/utils/tabs/utils.ts`](apps/ai-dial-admin/src/utils/tabs/utils.ts)
  (`getModelsTabs` / `getApplicationTabs`); add `TabsI18nKey.EvalTrends` and locale string;
  update [`utils.spec.ts`](apps/ai-dial-admin/src/utils/tabs/tests/utils.spec.ts).

## 2. Suites-by-entity query

- [x] 2.1 Add a structured-query builder that filters `test_suites` by `deployment_ref::id` OR
  `mcp_deployment_ref::id`, sorts by name, and pages through results; map rows with
  `mapTestSuiteRow`; expose a server action; cover the filter/sort with a unit spec.

## 3. Eval Trends tab UI

- [x] 3.1 Build a shared Eval Trends tab component (suite dropdown, Open in new tab via
  `onOpenInNewTab`, `TrendsPreviewRunsBadge`, reused `Trends` without `onStartRun`; loading and
  empty states) and mount it from Models and Applications `TabsContent`.
- [x] 3.2 Add component tests for suite list/selection, open-in-new-tab target, empty state, and
  preview badge run count from Trends.

## 4. Searchable suite select

- [x] 4.1 Replace the Eval Trends suite `InlineSelect` with a searchable `Select` of suite names;
  cover selection/search contracts with specs.

## 5. Month-to-date deployment cost card

- [x] 5.1 Add period-window helpers, grouped cost formatting, `RunsApi.getDeploymentCosts`, and a
  server action that fetches current and previous windows; cover helpers with unit specs.
- [x] 5.2 Build the all-suites header, month cost card (delta badge + two-period tooltip), mount on
  Eval Trends when suites exist; add i18n and component coverage.

## 6. Quality gates

- [x] 6.1 Run focused Vitest specs, `typecheck` / `typecheck:specs`, and lint/format on touched
  files; resolve regressions.

> Formal OpenSpec `spec-browser-verify` task omitted: AskQuestion was unavailable when drafting
> tasks. Practical browser verification against the local app hit the Keycloak sign-in gate; focused
> component tests cover the tab contracts.
