# Proposal

## Why

Operators reviewing a model or application need eval trend context without leaving that entity.
Today Trends exists only on the test-suite view, so finding which suites target a deployment and
comparing recent runs requires navigating away.

## What Changes

- Add an **Eval Trends** tab on the admin Models and Applications views when evaluation is enabled.
- Load that entity’s test suites (matched by deployment / MCP deployment id), let the user pick one,
  open the suite in a new tab, and reuse the existing suite Trends view for the selection.
- Show the Trends Preview runs badge in the tab body (not on the entity tab line).
- Show **Trends in All Test Suites** month-to-date eval cost for the deployment (vs the matching
  previous-month span) via `GET /api/v1/costs/deployment/{id}`.
- **Deferred:** the Figma cross-suite average pass-rate KPI card (still needs a deployment-scoped
  pass-rate aggregate).

## Non-goals

- Assets Models / Assets Applications tab lists.
- Starting a run from the entity Eval Trends tab.
- Deep-linking the new-tab suite open to the suite’s Trends tab (suite view has no tab query param).
- Client-side composition of cross-suite pass-rate aggregates from per-run APIs.

## Capabilities

### New Capabilities

- `entity-eval-trends`: Eval Trends tab on model and application detail views — suite picker, open
  in new tab, reused suite Trends content, and deployment month-to-date eval cost card.

### Modified Capabilities

None. Suite Trends chart/KPI behavior stays under `test-suite-trends`; this capability only mounts
that surface on the entity views (plus the deployment cost strip).

## Impact

- Tab lists: `getModelsTabs` / `getApplicationTabs` gated by `evaluationEnabled`.
- Shared tab UI under Models/Applications view `TabsContent`.
- Structured query for `test_suites` filtered by `deployment_ref::id` / `mcp_deployment_ref::id`.
- Eval API `GET /api/v1/costs/deployment/{id}?from=&to=` for month-to-date and previous-period totals.
- i18n for the new tab label, toolbar strings, and cost card copy.
- Co-located unit and component tests.
