import {
  buildUsageLogQuery,
  extractTelemetryMaxRangeMs,
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
  translateUsageLogFilterModel,
  translateUsageLogSortModel,
} from '../telemetry';
import { describe, test, vi, expect } from 'vitest';

import { lineChartDefaultOptions } from '@/src/components/Telemetry/Dashboards/LineChart/constants';
import { TRACES_QUERY } from '@/src/constants/telemetry';
import { TimeRange } from '@/src/models/time-range';
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
  -test('returns $in operator for multiple values with Equal condition', () => {
    const filters = [
      { type: FILTER_TYPE.Entity, value: ['Entity1', 'Entity2', 'Entity3'], condition: FILTER_OPERATOR.Equal },
    ];
    const result = getFormattedDataFilters(filters, null);
    expect(result).toEqual([{ $in: { left: 'deployment', right: ["'Entity1'", "'Entity2'", "'Entity3'"] } }]);
  });

  test('returns $nin operator for multiple values with NotEqual condition', () => {
    const filters = [
      { type: FILTER_TYPE.Project, value: ['Project1', 'Project2'], condition: FILTER_OPERATOR.NotEqual },
    ];
    const result = getFormattedDataFilters(filters, null);
    expect(result).toEqual([{ $nin: { left: 'project_id', right: [`'Project1'`, `'Project2'`] } }]);
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
      { type: FILTER_TYPE.Entity, value: ['Entity1'], condition: FILTER_OPERATOR.Equal },
      { type: FILTER_TYPE.Project, value: ['Project1'], condition: FILTER_OPERATOR.NotEqual },
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

describe('Utils :: telemetry :: extractTelemetryMaxRangeMs', () => {
  test('returns maxTimeRangeMs for the dial_analytics_realtime dataset', () => {
    const res = {
      success: true,
      response: [
        { name: 'other_dataset', maxTimeRangeMs: 1000 },
        { name: 'dial_analytics_realtime', maxTimeRangeMs: 604_800_000 },
      ],
    };
    expect(extractTelemetryMaxRangeMs(res)).toBe(604_800_000);
  });

  test('returns undefined when the request failed', () => {
    expect(extractTelemetryMaxRangeMs({ success: false })).toBeUndefined();
  });

  test('returns undefined when the telemetry dataset is absent', () => {
    expect(
      extractTelemetryMaxRangeMs({
        success: true,
        response: [{ name: 'other_dataset', maxTimeRangeMs: 1000 }],
      }),
    ).toBeUndefined();
  });

  test('returns undefined when maxTimeRangeMs is missing on the dataset', () => {
    expect(
      extractTelemetryMaxRangeMs({
        success: true,
        response: [{ name: 'dial_analytics_realtime' }],
      }),
    ).toBeUndefined();
  });

  test('returns undefined when response is not an array', () => {
    expect(extractTelemetryMaxRangeMs({ success: true, response: undefined })).toBeUndefined();
    expect(extractTelemetryMaxRangeMs({ success: true, response: {} })).toBeUndefined();
    expect(extractTelemetryMaxRangeMs({ success: true, response: 'string' as any })).toBeUndefined();
  });
});

describe('Utils :: telemetry :: translateUsageLogSortModel', () => {
  test('falls back to default completion_time DESC when sort model is empty', () => {
    expect(translateUsageLogSortModel([])).toEqual([{ $desc: '_time' }]);
  });

  test('translates descending sort on a bare column', () => {
    expect(translateUsageLogSortModel([{ colId: 'model', sort: 'desc' }])).toEqual([{ $desc: 'model' }]);
  });

  test('translates ascending sort', () => {
    expect(translateUsageLogSortModel([{ colId: 'price', sort: 'asc' }])).toEqual([{ $asc: 'price' }]);
  });

  test('maps completion_time alias to _time source column', () => {
    expect(translateUsageLogSortModel([{ colId: 'completion_time', sort: 'asc' }])).toEqual([{ $asc: '_time' }]);
  });

  test('maps user_title alias to title source column', () => {
    expect(translateUsageLogSortModel([{ colId: 'user_title', sort: 'desc' }])).toEqual([{ $desc: 'title' }]);
  });

  test('truncates to the first sort entry when grid reports multiple', () => {
    expect(
      translateUsageLogSortModel([
        { colId: 'model', sort: 'desc' },
        { colId: 'price', sort: 'asc' },
      ]),
    ).toEqual([{ $desc: 'model' }]);
  });
});

describe('Utils :: telemetry :: translateUsageLogFilterModel', () => {
  test('returns an empty list for null/undefined filter model', () => {
    expect(translateUsageLogFilterModel(null)).toEqual([]);
    expect(translateUsageLogFilterModel(undefined)).toEqual([]);
  });

  test('returns an empty list for empty filter model', () => {
    expect(translateUsageLogFilterModel({})).toEqual([]);
  });

  test('translates text contains filter', () => {
    expect(
      translateUsageLogFilterModel({
        model: { filterType: 'text', type: 'contains', filter: 'gpt-4' },
      }),
    ).toEqual([{ $contains: { left: 'model', right: "'gpt-4'" } }]);
  });

  test('translates every supported text operator', () => {
    const cases: Array<[string, string]> = [
      ['contains', '$contains'],
      ['notContains', '$not_contains'],
      ['equals', '$eq'],
      ['notEqual', '$ne'],
      ['startsWith', '$starts_with'],
      ['endsWith', '$ends_with'],
    ];
    for (const [agType, beOp] of cases) {
      expect(
        translateUsageLogFilterModel({
          deployment: { filterType: 'text', type: agType, filter: 'x' },
        }),
      ).toEqual([{ [beOp]: { left: 'deployment', right: "'x'" } }]);
    }
  });

  test('skips text filters with empty or missing value', () => {
    expect(
      translateUsageLogFilterModel({
        model: { filterType: 'text', type: 'contains', filter: '' },
      }),
    ).toEqual([]);
    expect(
      translateUsageLogFilterModel({
        model: { filterType: 'text', type: 'contains' },
      }),
    ).toEqual([]);
  });

  test('skips filters with unsupported operator', () => {
    expect(
      translateUsageLogFilterModel({
        model: { filterType: 'text', type: 'blank', filter: 'x' },
      }),
    ).toEqual([]);
  });

  test('skips numeric-column text filter when value is not a valid number', () => {
    expect(
      translateUsageLogFilterModel({
        price: { filterType: 'text', type: 'contains', filter: 'abc' },
      }),
    ).toEqual([]);
  });

  test('strips comma thousands-separators from numeric column filter values', () => {
    expect(
      translateUsageLogFilterModel({
        prompt_tokens: { filterType: 'text', type: 'equals', filter: '1,234' },
      }),
    ).toEqual([{ $eq: { left: 'prompt_tokens', right: 1234 } }]);

    expect(
      translateUsageLogFilterModel({
        price: { filterType: 'text', type: 'notEqual', filter: '1,234,567.89' },
      }),
    ).toEqual([{ $ne: { left: 'price', right: 1234567.89 } }]);
  });

  test('numeric coercion accepts "0" — it is a legitimate filter value, not empty', () => {
    expect(
      translateUsageLogFilterModel({
        prompt_tokens: { filterType: 'text', type: 'equals', filter: '0' },
      }),
    ).toEqual([{ $eq: { left: 'prompt_tokens', right: 0 } }]);
  });
});

describe('Utils :: telemetry :: buildUsageLogQuery', () => {
  const timeRange: TimeRange = {
    startDate: new Date('2026-04-01T00:00:00.000Z'),
    endDate: new Date('2026-04-02T00:00:00.000Z'),
  };

  test('never sets limit; omits offset when zero', () => {
    const result = buildUsageLogQuery({
      baseQuery: TRACES_QUERY,
      offset: 0,
      sortModel: [],
      filterModel: null,
      timeRange,
      entityName: null,
    });

    expect(result.query.limit).toBeUndefined();
    expect(result.query.offset).toBeUndefined();
  });

  test('emits offset when greater than zero, still no limit', () => {
    const result = buildUsageLogQuery({
      baseQuery: TRACES_QUERY,
      offset: 4217,
      sortModel: [],
      filterModel: null,
      timeRange,
      entityName: null,
    });

    expect(result.query.limit).toBeUndefined();
    expect(result.query.offset).toBe(4217);
  });

  test('preserves baseQuery expressions and from without mutating the constant', () => {
    const snapshot = JSON.parse(JSON.stringify(TRACES_QUERY));
    const result = buildUsageLogQuery({
      baseQuery: TRACES_QUERY,
      offset: 0,
      sortModel: [],
      filterModel: null,
      timeRange,
      entityName: null,
    });

    expect(result.query.expressions).toEqual(TRACES_QUERY.query.expressions);
    expect(result.query.from).toEqual(TRACES_QUERY.query.from);
    expect(TRACES_QUERY).toEqual(snapshot);
  });

  test('composes time range, entity name, and grid filters inside where.$and', () => {
    const result = buildUsageLogQuery({
      baseQuery: TRACES_QUERY,
      offset: 0,
      sortModel: [],
      filterModel: {
        model: { filterType: 'text', type: 'contains', filter: 'gpt-4' },
      },
      timeRange,
      entityName: 'my-entity',
    });

    expect(result.query.where?.$and).toEqual([
      { $gte: { left: '_time', right: "'2026-04-01T00:00:00.000Z'" } },
      { $lt: { left: '_time', right: "'2026-04-02T00:00:00.000Z'" } },
      { $eq: { left: 'deployment', right: "'my-entity'" } },
      { $contains: { left: 'model', right: "'gpt-4'" } },
    ]);
  });

  test('uses grid sort model when present', () => {
    const result = buildUsageLogQuery({
      baseQuery: TRACES_QUERY,
      offset: 0,
      sortModel: [{ colId: 'model', sort: 'asc' }],
      filterModel: null,
      timeRange,
      entityName: null,
    });

    expect(result.query.orderBy).toEqual([{ $asc: 'model' }]);
  });

  test('falls back to default sort when grid sort model is empty', () => {
    const result = buildUsageLogQuery({
      baseQuery: TRACES_QUERY,
      offset: 0,
      sortModel: [],
      filterModel: null,
      timeRange,
      entityName: null,
    });

    expect(result.query.orderBy).toEqual([{ $desc: '_time' }]);
  });
});
