# Design

## Context

Models and Applications already use shared tab helpers (`getModelsTabs` / `getApplicationTabs`) and
`EntityViewTab`. Evaluation is feature-flagged via `evaluationEnabled` (`DIAL_EVAL_API_URL`).
Test suites bind to a deployment through `deploymentRef.id` (or `mcpDeploymentRef.id` for MCP
tool suites). The suite Trends tab already loads per-suite run windows and charts via
`Trends` + `useTrendsData`.

Figma also shows a “Trends in All Test Suites” strip (suite count, average pass rate with trend
badge, this-month cost with MoM delta). Deployment-scoped eval cost is available via
`GET /api/v1/costs/deployment/{id}?from=&to=` (`totalTestCaseCost` + `totalMetricEvalCost`).
Cross-suite average pass rate still has no deployment-scoped aggregate API.

## Goals / Non-Goals

**Goals:**
- Surface Eval Trends on admin model and application views when evaluation is enabled.
- Let operators pick among suites targeting the current entity and reuse suite Trends for that suite.
- Open the selected suite in a new browser tab.
- Show month-to-date deployment eval cost vs the matching previous-month span, with a two-period
  tooltip, when at least one suite exists.
- Document the deferred cross-suite pass-rate card and the API gap it waits on.

**Non-Goals:**
- Implementing the cross-suite average pass-rate KPI card in this change.
- Changing `test-suite-trends` chart or KPI contracts.
- Run start from this tab, or Trends deep-link on open-in-new-tab.

## Decisions

1. **New tab id `EntityViewTab.EvalTrends`.** Keeps the suite tab’s `EntityViewTab.Trends` /
   `Tabs.Trends` wording. Label uses `Tabs.EvalTrends`. Append after Audit (always last when
   present); omit when `!evaluationEnabled`.

2. **Shared client tab component.** One component under `components/EvalTrendsTab`, mounted from
   Entities and Ai Gateway Models/Applications `TabsContent`, keyed by the entity’s deployment id
   (`getModelDeploymentId` for models; `getApplicationDeploymentId` for applications — public-bucket
   apps use `applications/<path>`, platform/Entities apps use `name`). Query `test_suites` with OR
   equality on `deployment_ref::id` and `mcp_deployment_ref::id`, sort by name, page through results
   so the dropdown is complete. List projection from `mapTestSuiteRow` is enough for `Trends`
   (needs `id`) and the source-kind label (suite type + refs).

3. **Toolbar layout.** “View in Test Suite:” + compact searchable ui-kit `Select` +
   “Open in new tab” (`onOpenInNewTab(ApplicationRoute.TestSuites, { id })`). Preview runs badge
   on the right via existing `TrendsPreviewRunsBadge`, fed by `onTrendsRunCountChange` from
   `Trends`. Do not pass `onStartRun`.

4. **Empty / loading.** Spinner while suites load. When none match, info notification and no
   Trends (and no all-suites cost strip). Default selection: first suite by name; changing the
   dropdown remounts Trends for the new suite id.

5. **Month-to-date deployment cost card.** When suites exist, show “Trends in All Test Suites” with
   suite count and one `KpiCardFrame` cost card. Windows are local calendar month-to-date and the
   matching day-clamped span in the previous month, as inclusive epoch-millis `from`/`to` on
   `GET /api/v1/costs/deployment/{id}`. Displayed total uses `sumRunCostParts` over
   `totalTestCaseCost` / `totalMetricEvalCost`. MoM delta uses filled red/green badges with caret
   icons (`higher cost` is worse). Hover tooltip lists both period labels and amounts; `sr-only`
   duplicates them. Cost fetch failures show an em dash inside the card without blocking Trends.

6. **Defer cross-suite pass-rate KPI.** Follow-up still needs a deployment-scoped average latest
   pass rate (and vs previous). Do not approximate from per-run APIs in the admin app.

## Risks / Trade-offs

- Open-in-new-tab lands on the suite Properties tab (no tab query). Acceptable for this change;
  Trends deep-link would need suite-view URL state.
- Matching on id excludes suites that only store a display name mismatch; creation always sets
  `deploymentRef.id` to `deploymentId`, so this matches how suites are authored.
- Large suite counts mean multiple pages; paging is required to avoid a truncated dropdown.
- Local timezone windows can disagree with UTC-oriented usage logs near month boundaries; matches
  the Figma calendar-month reading and the product’s “this month / today” wording.

## Migration Plan

None. Feature appears only when evaluation is configured.
