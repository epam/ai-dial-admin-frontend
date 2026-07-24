import { describe, expect, test } from 'vitest';

import { COMPUTE_INFERENCE_CARDS } from '@/src/components/Containers/View/Metrics/constants';
import { MetricCardKind } from '@/src/components/Containers/View/Metrics/models';
import { DeploymentMetricsI18nKey } from '@/src/constants/i18n';
import { DeploymentMetrics, PodResourceUsage } from '@/src/models/deployments/metrics';

const pod = (overrides: Partial<PodResourceUsage>): PodResourceUsage => ({
  name: 'pod',
  cpuMillicores: null,
  memoryBytes: null,
  gpuUtilization: null,
  gpuMemoryBytes: null,
  gpuMemoryTotalBytes: null,
  ...overrides,
});

const metricsWithPods = (pods: PodResourceUsage[]): DeploymentMetrics =>
  ({ resources: { replicas: { total: pods.length, ready: pods.length }, pods } }) as DeploymentMetrics;

const gpuMemoryCard = COMPUTE_INFERENCE_CARDS.find((card) => card.labelKey === DeploymentMetricsI18nKey.GpuMemory);
const gpuUtilizationCard = COMPUTE_INFERENCE_CARDS.find(
  (card) => card.labelKey === DeploymentMetricsI18nKey.GpuUtilization,
);

describe('GPU Memory card', () => {
  test('is a Gauge card', () => {
    expect(gpuMemoryCard?.kind).toBe(MetricCardKind.Gauge);
  });

  test('computes the used/total ratio across pods', () => {
    if (gpuMemoryCard?.kind !== MetricCardKind.Gauge) throw new Error('expected a Gauge card');
    const metrics = metricsWithPods([
      pod({ gpuMemoryBytes: 5 * 1024 ** 3, gpuMemoryTotalBytes: 20 * 1024 ** 3 }),
      pod({ gpuMemoryBytes: 5 * 1024 ** 3, gpuMemoryTotalBytes: 20 * 1024 ** 3 }),
    ]);
    expect(gpuMemoryCard.getValue(metrics)).toBe(0.25);
  });

  test('formats the detail label as used / total in a shared unit', () => {
    if (gpuMemoryCard?.kind !== MetricCardKind.Gauge) throw new Error('expected a Gauge card');
    const metrics = metricsWithPods([pod({ gpuMemoryBytes: 5 * 1024 ** 3, gpuMemoryTotalBytes: 20 * 1024 ** 3 })]);
    expect(gpuMemoryCard.getDetail?.(metrics)).toBe('5 / 20 GB');
  });

  test('is null when no pod reports GPU memory', () => {
    if (gpuMemoryCard?.kind !== MetricCardKind.Gauge) throw new Error('expected a Gauge card');
    const metrics = metricsWithPods([pod({})]);
    expect(gpuMemoryCard.getValue(metrics)).toBeNull();
    expect(gpuMemoryCard.getDetail?.(metrics)).toBeUndefined();
  });
});

describe('GPU Utilization card', () => {
  test('is a Gauge card', () => {
    expect(gpuUtilizationCard?.kind).toBe(MetricCardKind.Gauge);
  });

  test('averages utilization across pods', () => {
    if (gpuUtilizationCard?.kind !== MetricCardKind.Gauge) throw new Error('expected a Gauge card');
    const metrics = metricsWithPods([pod({ gpuUtilization: 0.2 }), pod({ gpuUtilization: 0.8 })]);
    expect(gpuUtilizationCard.getValue(metrics)).toBe(0.5);
  });

  test('is null when no pod reports utilization', () => {
    if (gpuUtilizationCard?.kind !== MetricCardKind.Gauge) throw new Error('expected a Gauge card');
    expect(gpuUtilizationCard.getValue(metricsWithPods([pod({})]))).toBeNull();
  });
});
