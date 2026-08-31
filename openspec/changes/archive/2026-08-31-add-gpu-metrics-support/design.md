## Context

The Metrics tab (`src/components/Containers/View/Metrics/`) renders a snapshot fetched once per tab-open from `GET /deployments/{id}/metrics`, grouped into config-driven card sections (`constants.ts` → `MetricsSectionConfig`/`MetricCardConfig` → `MetricsSection.tsx` → per-kind card components). GPU fields (`gpuUtilization`, `gpuMemoryBytes`) have always been null on the backend (a documented PoC placeholder), so the current `GPU_MEMORY_CARD` is a plain `Single`/`memoryCard` (summed bytes, no ceiling) and `gpuUtilization` is not rendered anywhere. The deployment-manager backend's `feat/gpu-metric` branch makes these fields real (sourced from the DCGM exporter) and adds `gpuMemoryTotalBytes`, and gives the pre-existing `resources.gpu` availability block real, distinct (but free-text) reasons.

The existing `MetricCardKind.Ratio` (used today only for Ready Replicas — `RatioBadgeCard`, e.g. "2 / 3") renders a bare numerator/denominator pair with no unit suffix. The existing `MetricsAvailability { available, reason? }` is already modeled and already drives section visibility for `Serving`/`Operational` in `Metrics.tsx`, but `resources.gpu`'s availability has never been read anywhere in the frontend.

## Goals / Non-Goals

**Goals:**
- Consume `gpuMemoryTotalBytes` and render GPU memory as a used/total pair instead of a bare summed value.
- Render `gpuUtilization` (currently unused) as a percentage, averaged across the deployment's pods.
- Hide both GPU cards when `resources.gpu.available` is false, for any reason, so a CPU-only model no longer shows a permanent empty GPU card.
- Extend the shared `Ratio` card mechanism minimally so it can show a unit suffix, reusable beyond GPU memory.

**Non-Goals:**
- Surfacing `MetricsAvailability.reason` text anywhere in the UI (for GPU or any other block) — the plumbing (`emptyReason` on `MetricCardShell`) already exists but is unused everywhere today; wiring it project-wide is a separate, larger change.
- Distinguishing *why* GPU is unavailable (no GPU requested vs. exporter down vs. disabled) — all cases are treated identically (hidden).
- Any backend, config, or RBAC change — this is a pure consumption of an already-additive contract.
- Time-range/historical GPU data, multi-replica GPU aggregation beyond the existing per-pod sum/average pattern.
- GPU metrics for NIM deployments — GPU cards are supported for INFERENCE (`CONTAINER_TYPE.HF`) Model Servings only; NIM never shows them, regardless of what `resources.gpu` reports.

## Decisions

**1. Gate visibility on the `available` boolean only, never on `reason` text.**
The backend spec documents `reason` as a "human-readable" string, not a stable enum/code — matching on its contents to distinguish "no GPU requested" (hide) from "exporter down" (show empty state) would be brittle across backend releases and versions. Gating on the boolean alone is simpler, forward-compatible, and matches the scope decision to treat this as a plain visibility gate, not a messaging feature. Alternative considered: parse `reason` for known substrings — rejected as fragile and out of scope.

**2. Render GPU Memory as a `Ratio` card and GPU Utilization as a `Single` card — not a `Gauge`.**
An earlier iteration of this design used `Gauge` (the semi-circular dial already used for KV-cache usage) for both cards, extended with a detail-label override so it could show "used / total" instead of a bare percentage. Product feedback on the rendered result was that a dial/needle visualization is the wrong shape for this data — GPU Memory is a plain used/total pair (the same shape Ready Replicas already renders via `RatioCardConfig`/`RatioBadgeCard`, e.g. "2 / 3"), and GPU Utilization is a plain percentage (the same shape CPU/Memory/error-ratio already render via `SingleCardConfig`). Reusing those two existing, simpler card kinds is a better fit than stretching `Gauge` to cover a shape it wasn't designed for. `RatioCardConfig`/`RatioBadgeCard` gained one small addition — an optional `getUnit`/`unit` suffix rendered after the denominator — so it can express "12.4 / 14.6 GB", not just bare counts. `GaugeCard` itself is left unchanged (still used only by KV-cache usage); the detail-label extension that had been added to it was reverted since nothing calls it anymore.

**3. Aggregate `gpuUtilization` across pods with a new `avgPodValue` helper, mirroring the existing `sumPodValue`.**
Each pod already carries one utilization value (backend averages across a pod's own GPUs). Averaging again across a deployment's pods (replicas) is the natural per-deployment roll-up and matches how CPU/memory are already summed across pods in this same section — one small, pure, testable helper per aggregation operation (`utils.md` convention).

**4. Both GPU cards stay "universal" (not gated by inference task type).**
The existing spec already establishes GPU memory as universal because its emptiness is hardware-gated (GPU pool + exporter presence), not task-type-gated (`deployment-metrics-tab` spec, "Gauge filtering by inference task type"). GPU utilization follows the same reasoning — a text-classification model on a GPU node pool is just as entitled to see utilization as a text-generation one.

**5. No change to fetch/caching/polling.** GPU data rides the same single on-demand snapshot already fetched on tab open plus manual refresh; no new request, no interval polling.

**6. GPU cards are gated on deployment type (INFERENCE only) in addition to `resources.gpu` availability.** Unlike `serving`/`operational` — which the backend already reports unavailable for NIM regardless of GPU — `resources.gpu` is engine-independent: it reflects only whether the deployment requests `nvidia.com/gpu` and whether the DCGM exporter can be reached, both of which are commonly true for NIM deployments too. Gating on availability alone would therefore show GPU cards for NIM, which is out of scope here. `Metrics.tsx` receives a new `containerType?: CONTAINER_TYPE` prop (passed from `TabsContent.tsx`'s `selectedContainer.$type`) and the `gpuAvailable` gate additionally requires `containerType === CONTAINER_TYPE.HF` (the constant's value is `'inference'`; NIM is `CONTAINER_TYPE.NIM`). Alternative considered: rely on `resources.gpu` availability alone and treat NIM as in-scope — rejected because NIM support is explicitly out of scope for this change, and the availability boolean cannot express that distinction on its own.

## Risks / Trade-offs

- **[Risk]** Treating every unavailable reason identically means an operational problem (exporter down on a GPU deployment) is visually indistinguishable from "this model has no GPU" (both: card simply absent). → **Mitigation:** accepted per explicit scope decision; if this needs to change, it's the same follow-up as the broader reason-surfacing gap, not a new one.
- **[Risk]** Averaging utilization across replica pods can hide one hot GPU among several idle ones. → **Mitigation:** consistent with the granularity the rest of the Compute section already uses (pod-summed CPU/memory); per-pod breakdown is out of scope for this snapshot-level dashboard.
- **[Risk]** Adding a `unit` suffix to `RatioBadgeCard` could regress the existing Ready Replicas card. → **Mitigation:** the `unit` prop is optional and additive; omitting it (as Replicas does) preserves today's bare "ready / total" rendering exactly, covered by existing tests.

## Migration Plan

No data migration. The new model field and gate are purely additive on the frontend. Because the backend has always reported `resources.gpu.available: false` (the placeholder state), this frontend change is safe to deploy ahead of, alongside, or after the backend's `feat/gpu-metric` rollout: until the backend ships, both GPU cards simply stay hidden (as today's users see no functional regression — no card previously showed real data anyway). No feature flag is needed. Rollback is a plain revert of the frontend change.

## Open Questions

None blocking. A future follow-up may want to surface `resources.gpu`'s specific unavailable reason (and generalize that to the other blocks) — tracked as out of scope here, not a blocker.
