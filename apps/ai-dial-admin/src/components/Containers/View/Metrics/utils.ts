import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { MetricCardConfig } from '@/src/components/Containers/View/Metrics/models';
import { DeploymentMetrics, PodResourceUsage } from '@/src/models/deployments/metrics';
import { INFERENCE_TASK } from '@/src/types/deployments/containers';

// Task-type gate (issue #3895): typed servings drop cards not applicable to their inference task;
// an unset or NONE task keeps the full set — capability is unknown, so nothing is hidden.
export const filterCardsByTask = (cards: MetricCardConfig[], task?: INFERENCE_TASK): MetricCardConfig[] => {
  if (task !== INFERENCE_TASK.TEXT_GENERATION && task !== INFERENCE_TASK.TEXT_CLASSIFICATION) {
    return cards;
  }
  return cards.filter((card) => !card.tasks || card.tasks.includes(task));
};

const pickPodValues = (metrics: DeploymentMetrics, pick: (pod: PodResourceUsage) => number | null): number[] => {
  const pods = metrics.resources?.pods ?? [];
  return pods.map(pick).filter((value): value is number => value !== null && value !== undefined);
};

// Sum a nullable per-pod numeric field across pods (additive: CPU, memory); null when nothing contributes.
export const sumPodValue = (
  metrics: DeploymentMetrics,
  pick: (pod: PodResourceUsage) => number | null,
): number | null => {
  const values = pickPodValues(metrics, pick);
  return values.length ? values.reduce((acc, value) => acc + value, 0) : null;
};

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

// Scale a byte count to the most readable unit (binary 1024 steps): 15_400_000_000 → { value: 14.3, unit: 'Gb' }.
export const formatMemoryBytes = (bytes: number | null): { value: number; unit: string } | null => {
  if (bytes === null) {
    return null;
  }
  let value = bytes;
  let index = 0;
  while (Math.abs(value) >= 1024 && index < BYTE_UNITS.length - 1) {
    value /= 1024;
    index += 1;
  }
  return { value: Math.round(value * 10) / 10, unit: BYTE_UNITS[index] };
};

// Format a used/total byte pair in the total's unit, for gauges needing a shared scale (e.g. "14.3 / 40 GB").
export const formatMemoryPair = (
  used: number | null,
  total: number | null,
): { used: number; total: number; unit: string } | null => {
  if (used === null || total === null || total <= 0) {
    return null;
  }
  const totalFormatted = formatMemoryBytes(total);
  if (!totalFormatted) {
    return null;
  }
  const divisor = total / totalFormatted.value;
  return { used: Math.round((used / divisor) * 10) / 10, total: totalFormatted.value, unit: totalFormatted.unit };
};

// --- Threshold → status helpers (worst-of rollup happens at section/overall level) ---

export const replicaStatus = (ready: number | null, total: number | null): MetricStatus => {
  if (ready === null || total === null) {
    return MetricStatus.NoData;
  }
  if (total === 0 || ready === 0) {
    return ready === total ? MetricStatus.Neutral : MetricStatus.Crit;
  }
  if (ready === total) {
    return MetricStatus.Ok;
  }
  return ready < Math.ceil(total / 2) ? MetricStatus.Crit : MetricStatus.Warn;
};

// Input is the error ratio as a percentage (0–100).
export const errorRatioStatus = (percent: number | null): MetricStatus => {
  if (percent === null) {
    return MetricStatus.NoData;
  }
  if (percent > 2) {
    return MetricStatus.Crit;
  }
  return percent > 0.5 ? MetricStatus.Warn : MetricStatus.Ok;
};

// Shared 0–1 ratio gauge thresholds (KV-cache usage, GPU memory usage, GPU utilization).
export const ratioGaugeStatus = (ratio: number | null): MetricStatus => {
  if (ratio === null) {
    return MetricStatus.NoData;
  }
  if (ratio > 0.9) {
    return MetricStatus.Crit;
  }
  return ratio > 0.7 ? MetricStatus.Warn : MetricStatus.Ok;
};

// Average a nullable per-pod numeric field across pods (e.g. GPU utilization); null when nothing contributes.
export const avgPodValue = (
  metrics: DeploymentMetrics,
  pick: (pod: PodResourceUsage) => number | null,
): number | null => {
  const values = pickPodValues(metrics, pick);
  return values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : null;
};
