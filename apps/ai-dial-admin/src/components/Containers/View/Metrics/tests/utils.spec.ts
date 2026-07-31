import { describe, expect, test } from 'vitest';

import { MetricCardConfig, MetricCardKind } from '@/src/components/Containers/View/Metrics/models';
import {
  avgPodValue,
  filterCardsByTask,
  formatMemoryBytes,
  formatMemoryPair,
  ratioGaugeStatus,
} from '@/src/components/Containers/View/Metrics/utils';
import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { DeploymentMetrics, PodResourceUsage } from '@/src/models/deployments/metrics';
import { INFERENCE_TASK } from '@/src/types/deployments/containers';

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

const card = (labelKey: string, tasks?: INFERENCE_TASK[]): MetricCardConfig => ({
  kind: MetricCardKind.Single,
  labelKey,
  tasks,
  getValue: () => null,
});

const UNIVERSAL = card('universal');
const GENERATION = card('generation', [INFERENCE_TASK.TEXT_GENERATION]);
const CLASSIFICATION = card('classification', [INFERENCE_TASK.TEXT_CLASSIFICATION]);
const ALL_CARDS = [UNIVERSAL, GENERATION, CLASSIFICATION];

describe('filterCardsByTask', () => {
  test('text classification keeps universal + classification cards', () => {
    expect(filterCardsByTask(ALL_CARDS, INFERENCE_TASK.TEXT_CLASSIFICATION)).toEqual([UNIVERSAL, CLASSIFICATION]);
  });

  test('text generation keeps universal + generation cards', () => {
    expect(filterCardsByTask(ALL_CARDS, INFERENCE_TASK.TEXT_GENERATION)).toEqual([UNIVERSAL, GENERATION]);
  });

  test('undefined task keeps the full set', () => {
    expect(filterCardsByTask(ALL_CARDS, undefined)).toEqual(ALL_CARDS);
  });

  test('NONE task keeps the full set', () => {
    expect(filterCardsByTask(ALL_CARDS, INFERENCE_TASK.NONE)).toEqual(ALL_CARDS);
  });

  test('can filter a section down to empty', () => {
    expect(filterCardsByTask([GENERATION], INFERENCE_TASK.TEXT_CLASSIFICATION)).toEqual([]);
  });
});

describe('formatMemoryBytes', () => {
  test('returns null for null input', () => {
    expect(formatMemoryBytes(null)).toBeNull();
  });

  test('keeps small values in bytes', () => {
    expect(formatMemoryBytes(512)).toEqual({ value: 512, unit: 'B' });
  });

  test('scales to KB / MB / GB at 1024 steps', () => {
    expect(formatMemoryBytes(1024)).toEqual({ value: 1, unit: 'KB' });
    expect(formatMemoryBytes(5 * 1024 * 1024)).toEqual({ value: 5, unit: 'MB' });
    expect(formatMemoryBytes(2 * 1024 * 1024 * 1024)).toEqual({ value: 2, unit: 'GB' });
  });

  test('picks GB and rounds to one decimal for large values', () => {
    // 15.4e9 bytes ≈ 14.3 GB
    expect(formatMemoryBytes(15_400_000_000)).toEqual({ value: 14.3, unit: 'GB' });
  });

  test('handles zero', () => {
    expect(formatMemoryBytes(0)).toEqual({ value: 0, unit: 'B' });
  });
});

describe('avgPodValue', () => {
  test('averages a field across pods', () => {
    const metrics = metricsWithPods([pod({ gpuUtilization: 0.2 }), pod({ gpuUtilization: 0.6 })]);
    expect(avgPodValue(metrics, (p) => p.gpuUtilization)).toBe(0.4);
  });

  test('ignores null values from pods without data', () => {
    const metrics = metricsWithPods([pod({ gpuUtilization: 0.5 }), pod({ gpuUtilization: null })]);
    expect(avgPodValue(metrics, (p) => p.gpuUtilization)).toBe(0.5);
  });

  test('returns null when no pod contributes', () => {
    const metrics = metricsWithPods([pod({ gpuUtilization: null }), pod({ gpuUtilization: null })]);
    expect(avgPodValue(metrics, (p) => p.gpuUtilization)).toBeNull();
  });

  test('returns null for an empty pod list', () => {
    expect(avgPodValue(metricsWithPods([]), (p) => p.gpuUtilization)).toBeNull();
  });
});

describe('formatMemoryPair', () => {
  test('scales used to the total’s unit', () => {
    expect(formatMemoryPair(5 * 1024 ** 3, 20 * 1024 ** 3)).toEqual({ used: 5, total: 20, unit: 'GB' });
  });

  test('returns null when used is null', () => {
    expect(formatMemoryPair(null, 20 * 1024 ** 3)).toBeNull();
  });

  test('returns null when total is null', () => {
    expect(formatMemoryPair(5 * 1024 ** 3, null)).toBeNull();
  });

  test('returns null when total is zero', () => {
    expect(formatMemoryPair(0, 0)).toBeNull();
  });
});

describe('ratioGaugeStatus', () => {
  test('is NoData for null', () => {
    expect(ratioGaugeStatus(null)).toBe(MetricStatus.NoData);
  });

  test('is Ok at or below the warn threshold', () => {
    expect(ratioGaugeStatus(0.7)).toBe(MetricStatus.Ok);
  });

  test('is Warn above warn and at or below crit', () => {
    expect(ratioGaugeStatus(0.8)).toBe(MetricStatus.Warn);
  });

  test('is Crit above the crit threshold', () => {
    expect(ratioGaugeStatus(0.95)).toBe(MetricStatus.Crit);
  });
});
