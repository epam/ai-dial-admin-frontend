## 1. Model & types

- [x] 1.1 Add `gpuMemoryTotalBytes: number | null` to `PodResourceUsage` in `src/models/deployments/metrics.ts`, mirroring the backend's additive `PodResourceUsageDto` field.
- [x] 1.2 Add a `GpuUtilization` key to `DeploymentMetricsI18nKey` in `src/constants/i18n.ts` (and its label in `src/locales/en.ts`); confirm the existing `GpuMemory` key's label still fits a gauge card.

## 2. Shared Gauge card: used/total detail label

- [x] 2.1 Add an optional `getDetail?: (metrics: DeploymentMetrics) => string | undefined` to `GaugeCardConfig` in `src/components/Containers/View/Metrics/models.ts`.
- [x] 2.2 Extend `GaugeCard` (`src/components/Deployments/Common/MetricCard/GaugeCard.tsx`) with an optional `detail?: string` prop that, when present, replaces the default `${Math.round(v * 100)}%` center-label formatter; when absent, keep today's percentage rendering unchanged (covers the existing KV-cache usage card).
- [x] 2.3 Wire `getDetail` through in `MetricsSection.tsx`'s `renderCard` for the `Gauge` case, passing the computed detail string to `GaugeCard`.

## 3. GPU card definitions and aggregation

- [x] 3.1 Add an `avgPodValue` helper to `src/components/Containers/View/Metrics/utils.ts`, parallel to the existing `sumPodValue` (average of a nullable per-pod numeric field across pods; null when nothing contributes).
- [x] 3.2 In `src/components/Containers/View/Metrics/constants.ts`, convert `GPU_MEMORY_CARD` from `memoryCard` (Single) to a `Gauge` card: `getValue` = sum(`gpuMemoryBytes`) ÷ sum(`gpuMemoryTotalBytes`) as a 0–1 ratio, `getDetail` = formatted `"used / total"` string via a new `formatMemoryPair` helper (shared-unit variant of `formatMemoryBytes`), thresholds via a shared `RATIO_GAUGE_THRESHOLDS` constant matching the renamed `ratioGaugeStatus` helper's convention (generalized from the former `kvCacheStatus`, now also used by KV-cache usage).
- [x] 3.3 Add a new `GPU_UTILIZATION_CARD` (`Gauge` kind) using `avgPodValue(m, p => p.gpuUtilization)`, same thresholds convention as 3.2.
- [x] 3.4 Update `COMPUTE_INFERENCE_CARDS` to `[GPU_MEMORY_CARD, GPU_UTILIZATION_CARD]`.

## 4. GPU visibility gate

- [x] 4.1 In `Metrics.tsx`, add a `gpuAvailable` boolean combining `resources.gpu` availability (`loading || !!metrics?.availability?.[MetricsBlockKey.ResourcesGpu]?.available`, following the existing `servingAvailable`/`operationalAvailable` pattern) with an INFERENCE-only deployment-type check (`containerType === CONTAINER_TYPE.HF`) — GPU telemetry is engine-independent, so availability alone does not exclude NIM, which commonly requests GPU too.
- [x] 4.2 Gate the inclusion of `COMPUTE_INFERENCE_CARDS` in the Compute section's `cards` array on `gpuAvailable` (in addition to the existing `isModelServing` gate), so both GPU cards are omitted (not rendered as "No Data") when `resources.gpu` is unavailable or the deployment is NIM.
- [x] 4.3 Add a `containerType?: CONTAINER_TYPE` prop to `Metrics`'s `Props` interface and thread it into the `gpuAvailable` computation; update the call site in `TabsContent.tsx` to pass `containerType={selectedContainer.$type}`.

## 5. Tests

- [x] 5.1 Update `src/models/deployments/metrics.ts` consumers/fixtures and any typed test mocks to include `gpuMemoryTotalBytes` (`Metrics.spec.tsx`'s `inferenceSnapshot` fixture).
- [x] 5.2 Add/update unit tests in `Containers/View/Metrics/tests/` for: `avgPodValue` and `formatMemoryPair` behavior (including all-null and mixed-null pod sets, zero/null totals) and `ratioGaugeStatus` thresholds in `utils.spec.ts`; the GPU Memory gauge's ratio + detail-label computation and the GPU Utilization gauge's averaged value in a new `constants.spec.ts`.
- [x] 5.3 Update `Metrics.spec.tsx` to cover: GPU cards (Memory + Utilization) rendered for an INFERENCE (`CONTAINER_TYPE.HF`) deployment when `resources.gpu.available: true`; GPU cards absent (not "No Data") when `resources.gpu.available: false`; GPU cards absent for a NIM deployment even when `resources.gpu.available: true`; existing non-inference/task-filter tests updated for the new `GpuUtilization` card.
- [x] 5.4 Added a new `GaugeCard.spec.tsx` component test (local `echarts-for-react` mock override to inspect the built chart option) covering both the default bare-percentage formatter (existing KV-cache path) and the new `detail` override path.

## 6. Quality checks

- [x] 6.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`, `npm run test` from `apps/ai-dial-admin/`) and fix any failures. Lint: 0 errors (32 pre-existing warnings, none in touched files). Format: clean. Full suite: 6447 passed, 1 unrelated flaky failure in `Tools/ManageToolsModal/utils.spec.ts` (untouched by this change, passes in isolation). Coverage: 64.4% statements / 54.4% branches / 57.2% functions / 64.7% lines — gate (40/40/50/50) not regressed.

## 7. Card-kind revision: Ratio/Single instead of Gauge

Follow-up from product feedback on the rendered result: a dial/gauge is the wrong shape for GPU Memory (a plain used/total pair) and GPU Utilization (a plain percentage). Revises tasks 2–3 above.

- [x] 7.1 Revert the `Gauge` detail-label extension: remove `getDetail` from `GaugeCardConfig`, remove the `detail` prop from `GaugeCard.tsx` (back to the original bare-percentage formatter), remove the `getDetail` wiring in `MetricsSection.tsx`'s `Gauge` case, and delete `GaugeCard.spec.tsx` (tested only the reverted feature).
- [x] 7.2 Add an optional `getUnit`/`unit` to `RatioCardConfig`/`RatioBadgeCard`, rendered after the denominator (additive; Ready Replicas keeps rendering bare `ready / total` since it doesn't set a unit).
- [x] 7.3 Convert `GPU_MEMORY_CARD` in `constants.ts` from `Gauge` to `Ratio`: `getNumerator`/`getDenominator`/`getUnit` from `formatMemoryPair`, `getStatus` from `ratioGaugeStatus` on the used/total ratio.
- [x] 7.4 Convert `GPU_UTILIZATION_CARD` in `constants.ts` from `Gauge` to `Single`: `getValue` = `avgPodValue` as a percentage (0–100, one decimal, matching the existing `RequestErrorRatio` card's pattern), `unit: '%'`, `getStatus` from `ratioGaugeStatus` on the percentage ÷ 100.
- [x] 7.5 Update `constants.spec.ts` for the new card kinds/fields; add a Ratio-with-unit case to `MetricsSection.spec.tsx`.
- [x] 7.6 Re-run lint, format, and the Metrics/MetricCard test suites; confirm no regressions.
