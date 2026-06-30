## Why

Deployment detail views (Model Servings and the container types) expose no live runtime metrics today — operators must leave the admin app to see CPU/memory or model serving quality. The deployment-manager backend now ships a unified snapshot endpoint (`GET /deployments/{id}/metrics`, PR #357, merging soon) that returns resource metrics for any deployment plus serving/operational metrics for inference. This change surfaces that snapshot in a new **Metrics** tab.

## What Changes

- Add a **Metrics** tab to deployment/container detail views for **MCP, Interceptor, Adaptor, Application containers and Model Servings** — not Images. Tab is disabled unless status is `RUNNING` (existing `metricsTab()` convention).
- The tab fetches one live snapshot on open and renders it as grouped, operator-oriented sections of metric cards (single value, gauge, percentile distribution, ratio, dual value):
  - **Scale & Health** (all types): ready/total replicas; request error ratio is added on Model Servings.
  - **Compute** (all types): total CPU (millicores) and total memory (bytes) across pods; GPU memory is added on Model Servings.
  - **Latency** (inference only): TTFT, inter-token latency, e2e latency (mean/p50/p95/p99), request latency.
  - **Throughput** (inference only): tokens/sec (prompt + generation), requests/sec.
  - **Load** (inference only): running requests, queue depth, KV-cache usage.
- Each metric uses the card type that fits it: replicas → ratio badge, latencies → p50/p95/p99 distribution, tokens/sec → dual value, KV-cache → gauge, the rest → single value. Threshold metrics (replicas, error ratio, KV-cache) are colored by status (green/amber/red). Byte values render in the most readable unit (Mb/Gb). A null/unavailable field shows the existing "No Data" state.
- A manual **Refresh** button re-fetches the snapshot. No auto-poll (PoC is a point-in-time snapshot; backend caches ~5s).
- **Refactor** `SingleValueChart` to extract a reusable, fetch-free presentational child so both telemetry dashboards and this tab share the same card rendering and "No Data" state.
- New reusable `MetricsSection` (title + responsive card row) used for each metric group.
- New API layer: `getContainerMetrics(id)` server action + `ContainersApi.getContainerMetrics`, plus a frontend model mirroring the backend `UnifiedDeploymentMetrics` DTO.

## Capabilities

### New Capabilities
- `deployment-metrics-tab`: A Metrics tab on deployment/container detail views that fetches the live unified metrics snapshot and renders resource/serving/operational metrics as grouped single-value cards with a manual refresh and graceful per-field "No Data" handling.

### Modified Capabilities
<!-- None — no existing capability's requirements change. The SingleValueChart refactor is an internal implementation change (behavior preserved), not a spec-level change. -->

## Impact

- **New code:**
  - `components/Common/SingleValue/SingleValueContent.tsx` (extracted presentational child)
  - `components/Containers/View/Metrics/` — `MetricsSection`, metric→card config, real `Metrics` tab (replaces current stub)
  - `models/` — frontend type mirroring `UnifiedDeploymentMetrics`
- **Modified code:**
  - `components/Telemetry/Dashboards/Values/SingleValueChart.tsx` — delegates rendering to the extracted child (telemetry behavior unchanged; existing spec must still pass)
  - `app/actions/deployments.ts` — add `getContainerMetrics`
  - `server/deployments/containers.ts` — add `CONTAINER_METRICS_URL` + `getContainerMetrics`
  - `utils/tabs/utils.ts` — register `metricsTab()` in `getDeploymentsViewTabs()` for the five deployment routes
  - `constants/i18n.ts` + `locales/en.ts` — add metric label / section keys (`TabsI18nKey.Metrics` already exists)
- **External dependency:** backend endpoint `GET /deployments/{id}/metrics` from deployment-manager PR #357. Designed against its current contract; merges soon.
- **No-time-series constraint:** the snapshot has no history, so no charts-over-time — point-in-time cards only (gauges/distributions show the current snapshot, not trends).

## Non-goals

- No time-series / charts-over-time, time-range picker, or historical retention (separate backend follow-up — OTel pipeline).
- No auto-refresh / polling in this change.
- No GPU memory values (backend placeholder until DCGM ships). The GPU memory card appears only on Model Servings and renders "No Data" until the backend populates it. GPU utilization is intentionally not shown (no meaningful per-deployment value without DCGM).
- No multi-pod aggregation, alerting, or metrics-driven autoscaling.
- No Metrics tab on Images.
