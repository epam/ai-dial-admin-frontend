import {
  getListingData,
  getGridData,
  getSingleValueChartData,
  prepareChartData,
  prepareMultiSeriesChartData,
  getFilterTypeConfig,
  getFilterConditionConfig,
  getFormattedDataFilters,
  getFormattedFilters,
  getDefaultFilterValue,
} from '../telemetry';
import { describe, test, vi, expect } from 'vitest';

import { lineChartDefaultOptions } from '@/src/components/Charts/LineChart/constants';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';

describe('Utils :: telemetry :: getListingData', () => {
  test('returns correct result', () => {
    const result = getListingData({
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
    const result = getListingData({ headers: [], data: [] });
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

  test('returns empty result', () => {
    const result = getGridData({
      headers: ['deployment', 'count'],
    });
    expect(result).toEqual([]);
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
    expect(getSingleValueChartData({ headers: [], data: [] })).toEqual(0);
    expect(getSingleValueChartData({ headers: [] })).toEqual(0);
  });
});

describe('Utils :: telemetry :: getFormattedDataFilters', () => {
  test('returns filter for entityName only', () => {
    const result = getFormattedDataFilters([], 'EntityName');
    expect(result).toEqual([{ $eq: { left: 'deployment', right: "'EntityName'" } }]);
  });

  test('returns filters for data only with single values', () => {
    const filters = [
      { type: FILTER_TYPE.Project, value: ['Project1'], condition: FILTER_OPERATOR.Equal },
      { type: FILTER_TYPE.Entity, value: ['Entity1'], condition: FILTER_OPERATOR.NotEqual },
    ];
    const result = getFormattedDataFilters(filters, null);
    expect(result).toEqual([
      { $eq: { left: 'project_id', right: "'Project1'" } },
      { $ne: { left: 'deployment', right: "'Entity1'" } },
    ]);
  });

  test('returns filters for both entityName and data', () => {
    const filters = [{ type: FILTER_TYPE.Project, value: ['Project1'], condition: FILTER_OPERATOR.Equal }];
    const result = getFormattedDataFilters(filters, 'EntityName');
    expect(result).toEqual([
      { $eq: { left: 'deployment', right: "'EntityName'" } },
      { $eq: { left: 'project_id', right: "'Project1'" } },
    ]);
  });

  test('returns $in operator for multiple values with Equal condition', () => {
    const filters = [
      { type: FILTER_TYPE.Entity, value: ['Entity1', 'Entity2', 'Entity3'], condition: FILTER_OPERATOR.Equal },
    ];
    const result = getFormattedDataFilters(filters, null);
    expect(result).toEqual([{ $in: { left: 'deployment', right: ['Entity1', 'Entity2', 'Entity3'] } }]);
  });

  test('returns $nin operator for multiple values with NotEqual condition', () => {
    const filters = [
      { type: FILTER_TYPE.Project, value: ['Project1', 'Project2'], condition: FILTER_OPERATOR.NotEqual },
    ];
    const result = getFormattedDataFilters(filters, null);
    expect(result).toEqual([{ $nin: { left: 'project_id', right: ['Project1', 'Project2'] } }]);
  });

  test('handles text input conditions with array values', () => {
    const filters = [{ type: FILTER_TYPE.Entity, value: ['test'], condition: FILTER_OPERATOR.Contain }];
    const result = getFormattedDataFilters(filters, null);
    expect(result).toEqual([{ $contains: { left: 'deployment', right: "'test'" } }]);
  });

  test('returns empty array for no filters and no entityName', () => {
    const result = getFormattedDataFilters([], null);
    expect(result).toEqual([]);
  });
});

describe('Utils :: telemetry :: getListingData', () => {
  test('returns correct result', () => {
    const result = getListingData({
      headers: ['time', 'requests'],
      data: [
        ['2023-10-01T00:00:00Z', '100'],
        ['2023-10-01T01:00:00Z', '200'],
        ['undefined', '300'],
      ],
    });
    expect(result).toEqual([
      { time: '2023-10-01T00:00:00Z', requests: '100' },
      { time: '2023-10-01T01:00:00Z', requests: '200' },
      { time: '', requests: '300' },
    ]);
  });

  test('returns empty array for empty data', () => {
    expect(getListingData({ headers: [], data: [] })).toEqual([]);
    expect(getListingData({ headers: [] })).toEqual([]);
  });
});

describe('Utils :: telemetry :: prepareChartData', () => {
  test('returns correct result', () => {
    const mockDate = new Date('2023-12-25T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const data = [{ time: '2023-12-25T12:00:00.000Z', requests: '100' }];
    const result = prepareChartData(data, () => 'key');

    expect(result.series).toEqual([{ ...lineChartDefaultOptions(() => 'key').series[0], data: ['100'] }]);

    vi.useRealTimers();
  });
});

describe('Utils :: telemetry :: prepareMultiSeriesChartData', () => {
  const t = (key: string) => key;

  test('maps rows with empty mcp_method to Unknown series', () => {
    const data = [
      { window: '2023-10-01T00:00:00Z', mcp_method: '', count: '5' },
      { window: '2023-10-01T01:00:00Z', mcp_method: '', count: '10' },
    ];
    const result = prepareMultiSeriesChartData(data, t);
    const series = result.series as { name: string; data: number[] }[];

    expect(series).toHaveLength(1);
    expect(series[0].name).toBe('Telemetry.Unknown');
    expect(series[0].data).toEqual([5, 10]);
  });

  test('maps rows with undefined mcp_method to Unknown series', () => {
    const data = [{ window: '2023-10-01T00:00:00Z', count: '3' } as Record<string, string>];
    const result = prepareMultiSeriesChartData(data, t);
    const series = result.series as { name: string; data: number[] }[];

    expect(series).toHaveLength(1);
    expect(series[0].name).toBe('Telemetry.Unknown');
  });

  test('keeps named series unchanged', () => {
    const data = [
      { window: '2023-10-01T00:00:00Z', mcp_method: 'tools/list', count: '7' },
      { window: '2023-10-01T00:00:00Z', mcp_method: 'tools/call', count: '3' },
    ];
    const result = prepareMultiSeriesChartData(data, t);
    const series = result.series as { name: string; data: number[] }[];

    expect(series).toHaveLength(2);
    expect(series.map((s) => s.name).sort()).toEqual(['tools/call', 'tools/list']);
  });

  test('groups empty and named methods correctly', () => {
    const data = [
      { window: '2023-10-01T00:00:00Z', mcp_method: 'tools/list', count: '7' },
      { window: '2023-10-01T00:00:00Z', mcp_method: '', count: '2' },
    ];
    const result = prepareMultiSeriesChartData(data, t);
    const series = result.series as { name: string; data: number[] }[];

    expect(series).toHaveLength(2);
    expect(series.map((s) => s.name).sort()).toEqual(['Telemetry.Unknown', 'tools/list']);
  });
});

describe('Utils :: telemetry :: getFilterTypeConfig', () => {
  test('returns correct result', () => {
    const t = (key: string) => key;
    const result = getFilterTypeConfig(t);
    expect(result).toBeTruthy();
  });
});

describe('Utils :: telemetry :: getDefaultFilterValue', () => {
  test('returns array with first value for Entity type', () => {
    expect(
      getDefaultFilterValue(FILTER_TYPE.Entity, [{ label: 'a', value: 'aValue' }], [{ label: 'b', value: 'bValue' }]),
    ).toEqual(['aValue']);
  });

  test('returns array with first value for Project type', () => {
    expect(
      getDefaultFilterValue(FILTER_TYPE.Project, [{ label: 'a', value: 'aValue' }], [{ label: 'b', value: 'bValue' }]),
    ).toEqual(['bValue']);
  });

  test('returns empty array when no options available', () => {
    const result = getDefaultFilterValue(FILTER_TYPE.Entity, [], []);
    expect(result).toEqual([]);
  });
});

describe('Utils :: telemetry :: getFilterConditionConfig', () => {
  test('returns correct result', () => {
    const t = (key: string) => key;
    const result = getFilterConditionConfig(t);
    expect(result).toBeTruthy();
  });
});

const mockTimeRange = {
  startDate: new Date('2023-01-01T00:00:00.000Z'),
  endDate: new Date('2023-01-02T00:00:00.000Z'),
};

describe('getFormattedFilters', () => {
  test('returns $and with time and data filters', () => {
    const filters = [
      { type: 'entity', value: ['Entity1'], condition: 'eq' },
      { type: 'project', value: ['Project1'], condition: 'neq' },
    ];

    const result = getFormattedFilters(mockTimeRange, filters, 'EntityName');
    expect(result.$and[0]).toEqual({
      $gte: {
        left: '_time',
        right: `'2023-01-01T00:00:00.000Z'`,
      },
    });
    expect(result.$and[1]).toEqual({
      $lt: {
        left: '_time',
        right: `'2023-01-02T00:00:00.000Z'`,
      },
    });
    expect(result.$and[2]).toEqual({ $eq: { left: 'deployment', right: "'EntityName'" } });
  });
});
