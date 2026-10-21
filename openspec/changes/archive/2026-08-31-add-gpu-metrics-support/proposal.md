## Why

The deployment-manager backend's `feat/gpu-metric` branch turns `gpuUtilization` and `gpuMemoryBytes` from always-null placeholders into real, live values sourced from the NVIDIA DCGM exporter, and adds a new `gpuMemoryTotalBytes` field so a memory percentage can be computed. It also gives the existing `resources.gpu` availability block real, distinct reasons (no GPU requested, exporter absent/unreachable, collection disabled) instead of the permanent placeholder state. The frontend's Metrics tab was built against the placeholder contract: GPU memory renders as a plain summed-bytes card with no ceiling, GPU utilization isn't rendered at all, and no card reacts to `resources.gpu` availability. This change updates the Metrics tab to consume the real contract.

## What Changes

- Add `gpuMemoryTotalBytes` to the `PodResourceUsage` model, mirroring the backend's additive DTO change.
- Convert the GPU Memory card from a plain summed-bytes card to a **Ratio** card showing used/total (e.g. "12.4 / 14.6 GB") — the same card kind already used for Ready Replicas — instead of a gauge/dial.
- Add a new GPU Utilization card (**Single** card, a percentage averaged across pods) — `gpuUtilization` is not rendered anywhere today.
- Hide both GPU cards entirely when `resources.gpu` is marked unavailable in the snapshot, using the existing per-block `available` boolean (same pattern already used for `serving`/`operational`) — not a reason-specific message. This applies uniformly whether the deployment doesn't request GPU, the exporter is absent, or collection is disabled; no per-reason UI copy is introduced.
- Restrict both GPU cards to INFERENCE (`CONTAINER_TYPE.HF`) Model Servings only — NIM deployments never show them, even if `resources.gpu` reports available. GPU telemetry is engine-independent (unlike `serving`/`operational`, which are already unavailable for NIM), and NIM containers commonly do request a GPU, so the availability boolean alone would not exclude NIM; this requires an explicit deployment-type gate in addition to the availability gate.
- Extend the shared Ratio card (`RatioBadgeCard`) with an optional shared unit suffix (e.g. "GB") after the denominator, so it can express a formatted used/total pair, not just bare counts (as replicas use today).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deployment-metrics-tab`: GPU memory changes card type (single-value → ratio with used/total) and gains a new sibling GPU utilization single-value card; both are now gated on `resources.gpu` availability rather than always rendering (with data or "No Data"); the "GPU placeholder" language in the existing spec is replaced with the real-data behavior.

## Impact

- `src/models/deployments/metrics.ts` — `PodResourceUsage` gains `gpuMemoryTotalBytes`.
- `src/components/Containers/View/Metrics/{constants,models,utils}.ts` and `Metrics.tsx` — GPU card definitions, new `avgPodValue` helper, new `gpuAvailable` gate combining `resources.gpu` availability with an INFERENCE-only (`CONTAINER_TYPE.HF`) type check.
- `src/components/Containers/View/TabsContent.tsx` — passes the container's `$type` down to `Metrics` as the new `containerType` prop.
- `src/components/Deployments/Common/MetricCard/RatioBadgeCard.tsx` — optional `unit` suffix rendered after the denominator.
- `src/constants/i18n.ts` — new `GpuUtilization` label key.
- Existing tests for `Metrics`, `MetricsSection`, and the Metrics `constants`/`utils` need updates; no other features consume these files.
- Out of scope: wiring `MetricsAvailability.reason` text into any card's empty state generally (that plumbing exists but is unused across every block today — a separate, larger pre-existing gap).
