import { describe, expect, test } from 'vitest';

import { MetricCardConfig, MetricCardKind } from '@/src/components/Containers/View/Metrics/models';
import { filterCardsByTask, formatMemoryBytes } from '@/src/components/Containers/View/Metrics/utils';
import { INFERENCE_TASK } from '@/src/types/deployments/containers';

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
