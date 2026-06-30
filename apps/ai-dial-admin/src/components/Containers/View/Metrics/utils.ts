import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { DeploymentMetrics, PodResourceUsage } from '@/src/models/deployments/metrics';

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

// Input is the KV-cache usage ratio (0–1).
export const kvCacheStatus = (ratio: number | null): MetricStatus => {
  if (ratio === null) {
    return MetricStatus.NoData;
  }
  if (ratio > 0.9) {
    return MetricStatus.Crit;
  }
  return ratio > 0.7 ? MetricStatus.Warn : MetricStatus.Ok;
};
