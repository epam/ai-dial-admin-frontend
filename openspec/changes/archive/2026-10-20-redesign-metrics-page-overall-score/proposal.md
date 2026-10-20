## Why

The Metrics tab’s always-on Overall Score sidebar does not match the redesigned layout: an empty state with no score chrome when there are zero metrics, and a compact Overall Score card with an Edit modal when metrics exist. When Overall Score is a suite-level Specific function (ROC AUC), the backend already supports a separate per-test-case score definition (`testCaseOverallScore`), but the frontend never models or persists it — so choosing ROC AUC leaves per-test-case `score`/`passed` unset.

## What Changes

- Hide Overall Score UI when the suite has no bound metrics (empty Metrics state only).
- Replace the always-visible Score Settings sidebar with an Overall Score summary card and an Edit modal (Mean / Weighted mean / Specific function + parameters, optional Enable threshold).
- When Specific function is selected, show nested Test Case Score (Mean / Weighted mean only) and persist it as `testCaseOverallScore` on the suite.
- When Overall Score is Mean or Weighted mean, clear `testCaseOverallScore` so per-row scoring falls back to `overallScore`.
- Extend the FE `TestSuite` model with `testCaseOverallScore` (Mean | WeightedMean only) and `SuiteSnapshot.testCaseOverallScore` where the API returns it.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `test-suite-metrics-tab`: empty-state vs card+modal Overall Score UX; nested Test Case Score persistence via `testCaseOverallScore`.

## Impact

- `apps/ai-dial-admin/src/models/evaluation/test-suite.ts` — `testCaseOverallScore` on suite/snapshot.
- `apps/ai-dial-admin/src/components/TestSuites/Metrics/Metrics.tsx` — layout: empty state / card + modal.
- `apps/ai-dial-admin/src/components/TestSuites/Metrics/ScoreSettings/*` — modal draft Apply; nested Test Case Score; threshold enable switch.
- i18n keys for card, Edit modal, Test Case Score, Enable threshold.
- No backend changes (BE already implements `testCaseOverallScore`).
