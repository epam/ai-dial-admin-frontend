## Why

The Analytics tab fetches metric snapshots from the backend (`GET /analytics/run-metric-snapshots`) but the data is never surfaced to the user — it is currently only `console.log`-ged. Metric snapshots contain the binding configuration used to compute each metric group (which test-case columns or constant values were wired to which metric properties). Without this, users inspecting a metric result have no way to understand how the metric was configured. Additionally, the two parallel fetches in `AnalyticsTab` have misaligned loading state: results drive the loader but snapshots don't, meaning the panel can appear ready while snapshots are still in flight.

## What Changes

- **`AnalyticsTab` loading unification** — `getTestCaseRunResults` and `getMetricSnapshots` are fired in parallel via `Promise.all`; a single `isLoading` flag covers both. The `console.log` is removed and snapshot results are stored in `metricBindings` state (`Record<string, MetricBindings>`).
- **`metricBindings` passed to `RunMetricDetailPanel`** — added as an optional prop; `AnalyticsTab` passes it via `sidebar.showSidebar` at row-click time.
- **Metric Bindings sub-section in `RunMetricDetailPanel`** — each metric group section gains a collapsible "Metric Bindings" sub-section driven by `metricBindings[group.title]`. Renders a flat table: property · source-type chip · value. Config and input bindings are shown together (flat). The section is silently skipped if no bindings exist for a group.
- **New tests** — `analytics-api.spec.ts` covers `getMetricSnapshots` URL; `actions.spec.ts` covers the server action; `utils.spec.ts` covers `snapshotsToBindingsMap`.

## Capabilities

### New Capabilities

- `analytics-metric-bindings-display`: Metric bindings (property, source type, value) are shown as a collapsible sub-section inside each metric group in `RunMetricDetailPanel`, driven by snapshot data fetched in `AnalyticsTab`.

### Modified Capabilities

<!-- No existing spec-level capabilities are changing. -->

## Impact

- `components/Runs/View/Analytics.tsx` — parallel fetch via `Promise.all`, unified loader, `metricBindings` state, pass to panel
- `components/Runs/Details/RunMetricDetailPanel.tsx` — new `metricBindings` prop, new Metric Bindings sub-section per group
- `server/eval/analytics-api.ts` — already has `getMetricSnapshots` (no changes needed)
- `app/[lang]/runs/actions.ts` — already has `getMetricSnapshots` action (no changes needed)
- `components/Runs/View/utils.ts` — already has `snapshotsToBindingsMap` (no changes needed)
- Test files: `analytics-api.spec.ts`, `actions.spec.ts`, `utils.spec.ts`
- New i18n key: `RunsI18nKey.MetricBindings`
