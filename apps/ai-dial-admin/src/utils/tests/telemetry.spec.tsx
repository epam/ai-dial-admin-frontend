import {
  getTracesListingData,
  getGridData,
  getSingleValueChartData,
  getLineChartData,
  prepareChartData,
  getFilterTypeConfig,
  getFilterConditionConfig,
} from '../telemetry';
import { describe, test, vi, expect } from 'vitest';
import { lineChartDefaultOptions } from '@/src/components/Charts/LineChart/line-chart-config';

describe('Utils :: telemetry :: getTracesListingData', () => {
  test('returns correct result', () => {
    const result = getTracesListingData({
      headers: ['header1', 'header2'],
      data: [
        ['value1', 'value2'],
        ['value3', 'value4'],
      ],
    });
    expect(result).toEqual([
      { header1: 'value1', header2: 'value2' },
      { header1: 'value3', header2: 'value4' },
    ]);
  });

  test('returns empty array for empty data', () => {
    const result = getTracesListingData({ headers: [], data: [] });
    expect(result).toEqual([]);
  });
});

describe('Utils :: telemetry :: getGridData', () => {
  test('returns correct result', () => {
    const result = getGridData({
      headers: ['deployment', 'count'],
      data: [
        ['value1', 'value3'],
        ['value4', 'value6'],
      ],
    });
    expect(result).toEqual([
      { name: 'value1', requests: 'value3' },
      { name: 'value4', requests: 'value6' },
    ]);
  });
});

describe('Utils :: telemetry :: getSingleValueChartData', () => {
  test('returns correct result', () => {
    const result = getSingleValueChartData({
      headers: ['value'],
      data: [['100']],
    });
    expect(result).toEqual(100);
  });

  test('returns empty array for empty data', () => {
    const result = getSingleValueChartData({ headers: [], data: [] });
    expect(result).toEqual(0);
  });
});

describe('Utils :: telemetry :: getLineChartData', () => {
  test('returns correct result', () => {
    const result = getLineChartData({
      headers: ['time', 'requests'],
      data: [
        ['2023-10-01T00:00:00Z', '100'],
        ['2023-10-01T01:00:00Z', '200'],
      ],
    });
    expect(result).toEqual([
      { time: '2023-10-01T00:00:00Z', requests: '100' },
      { time: '2023-10-01T01:00:00Z', requests: '200' },
    ]);
  });

  test('returns empty array for empty data', () => {
    const result = getLineChartData({ headers: [], data: [] });
    expect(result).toEqual([]);
  });
});

describe('Utils :: telemetry :: prepareChartData', () => {
  test('returns correct result', () => {
    const mockDate = new Date('2023-12-25T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const data = [{ time: '2023-12-25T12:00:00Z', requests: '100' }];
    const result = prepareChartData(data);
    expect(result).toEqual({
      ...lineChartDefaultOptions,
      xAxis: { ...lineChartDefaultOptions.xAxis, data: [mockDate.toLocaleString()] },
      series: [{ ...lineChartDefaultOptions.series[0], data: ['100'] }],
    });

    vi.useRealTimers();
  });
});

describe('Utils :: telemetry :: getFilterTypeConfig', () => {
  test('returns correct result', () => {
    const t = (key: string) => key;
    const result = getFilterTypeConfig(t);
    expect(result).toBeTruthy();
  });
});

describe('Utils :: telemetry :: getFilterConditionConfig', () => {
  test('returns correct result', () => {
    const t = (key: string) => key;
    const result = getFilterConditionConfig(t);
    expect(result).toBeTruthy();
  });
});
