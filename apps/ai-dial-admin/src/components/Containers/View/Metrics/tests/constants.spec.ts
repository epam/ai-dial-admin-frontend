import { describe, expect, test } from 'vitest';

import { COMPUTE_INFERENCE_CARDS } from '@/src/components/Containers/View/Metrics/constants';
import { MetricCardKind } from '@/src/components/Containers/View/Metrics/models';
import { MetricStatus } from '@/src/components/Common/MetricCard/models';
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
  test('is a Ratio card', () => {
    expect(gpuMemoryCard?.kind).toBe(MetricCardKind.Ratio);
  });

  test('reports used/total in a shared unit across pods', () => {
    if (gpuMemoryCard?.kind !== MetricCardKind.Ratio) throw new Error('expected a Ratio card');
    const metrics = metricsWithPods([
      pod({ gpuMemoryBytes: 5 * 1024 ** 3, gpuMemoryTotalBytes: 20 * 1024 ** 3 }),
      pod({ gpuMemoryBytes: 5 * 1024 ** 3, gpuMemoryTotalBytes: 20 * 1024 ** 3 }),
    ]);
    expect(gpuMemoryCard.getNumerator(metrics)).toBe(10);
    expect(gpuMemoryCard.getDenominator(metrics)).toBe(40);
    expect(gpuMemoryCard.getUnit?.(metrics)).toBe('GB');
  });

  test('is null when no pod reports GPU memory', () => {
    if (gpuMemoryCard?.kind !== MetricCardKind.Ratio) throw new Error('expected a Ratio card');
    const metrics = metricsWithPods([pod({})]);
    expect(gpuMemoryCard.getNumerator(metrics)).toBeNull();
    expect(gpuMemoryCard.getDenominator(metrics)).toBeNull();
    expect(gpuMemoryCard.getUnit?.(metrics)).toBeUndefined();
  });

  test('status is critical when used/total exceeds the crit threshold', () => {
    if (gpuMemoryCard?.kind !== MetricCardKind.Ratio) throw new Error('expected a Ratio card');
    expect(gpuMemoryCard.getStatus?.(19, 20)).toBe(MetricStatus.Crit);
    expect(gpuMemoryCard.getStatus?.(null, null)).toBe(MetricStatus.NoData);
  });
});

describe('GPU Utilization card', () => {
  test('is a Single card with a percent unit', () => {
    expect(gpuUtilizationCard?.kind).toBe(MetricCardKind.Single);
    if (gpuUtilizationCard?.kind !== MetricCardKind.Single) throw new Error('expected a Single card');
    expect(gpuUtilizationCard.unit).toBe('%');
  });

  test('averages utilization across pods as a percentage', () => {
    if (gpuUtilizationCard?.kind !== MetricCardKind.Single) throw new Error('expected a Single card');
    const metrics = metricsWithPods([pod({ gpuUtilization: 0.2 }), pod({ gpuUtilization: 0.8 })]);
    expect(gpuUtilizationCard.getValue(metrics)).toBe(50);
  });

  test('is null when no pod reports utilization', () => {
    if (gpuUtilizationCard?.kind !== MetricCardKind.Single) throw new Error('expected a Single card');
    expect(gpuUtilizationCard.getValue(metricsWithPods([pod({})]))).toBeNull();
  });

  test('status is critical above the crit threshold', () => {
    if (gpuUtilizationCard?.kind !== MetricCardKind.Single) throw new Error('expected a Single card');
    expect(gpuUtilizationCard.getStatus?.(95)).toBe(MetricStatus.Crit);
    expect(gpuUtilizationCard.getStatus?.(null)).toBe(MetricStatus.NoData);
  });
});
