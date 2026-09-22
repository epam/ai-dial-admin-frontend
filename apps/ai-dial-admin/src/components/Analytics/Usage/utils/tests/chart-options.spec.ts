import { describe, expect, test } from 'vitest';

import {
  buildBarOptions,
  buildLatencyOptions,
  formatChartNumber,
} from '@/src/components/Analytics/Usage/utils/chart-options';

type ValueFormatter = (value: unknown) => string;

const formatterOf = (options: { tooltip?: unknown }): ValueFormatter =>
  (options.tooltip as { valueFormatter: ValueFormatter }).valueFormatter;

describe('formatChartNumber', () => {
  test('stops at two decimals by default', () => {
    expect(formatChartNumber(9149.517302573204)).toBe('9,149.52');
  });

  test('takes the precision a caller asks for', () => {
    expect(formatChartNumber(20.50087114, 1)).toBe('20.5');
  });
});

describe('tooltip value formatting', () => {
  test('rounds a cost to one decimal instead of printing the raw float', () => {
    expect(formatterOf(buildBarOptions(['Sep'], [20.50087114], null))(20.50087114)).toBe('20.5');
  });

  test('rounds a latency to one decimal', () => {
    expect(formatterOf(buildLatencyOptions(['12:00'], [9149.517302573204], [null]))(9149.517302573204)).toBe('9,149.5');
  });

  test('states a bucket with no figure as a dash rather than a zero', () => {
    expect(formatterOf(buildLatencyOptions(['12:00'], [null], [null]))(null)).toBe('—');
  });
});
