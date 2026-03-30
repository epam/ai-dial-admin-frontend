import { describe, expect, test } from 'vitest';
import { applyResolutionToQuery, getChartResolution } from '../get-chart-resolution';
import { TelemetryQuery } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';

const makeRange = (durationMinutes: number): TimeRange => {
  const end = new Date('2026-01-15T12:00:00Z');
  const start = new Date(end.getTime() - durationMinutes * 60 * 1000);
  return { startDate: start, endDate: end };
};

describe('getChartResolution', () => {
  test.each([
    { period: '15m', minutes: 15, expected: { value: 1, unit: 'm' } },
    { period: '30m', minutes: 30, expected: { value: 1, unit: 'm' } },
    { period: '1h', minutes: 60, expected: { value: 1, unit: 'm' } },
    { period: '3h', minutes: 180, expected: { value: 1, unit: 'm' } },
    { period: '6h', minutes: 360, expected: { value: 2, unit: 'm' } },
    { period: '12h', minutes: 720, expected: { value: 5, unit: 'm' } },
    { period: '24h', minutes: 1440, expected: { value: 10, unit: 'm' } },
    { period: '2d', minutes: 2880, expected: { value: 15, unit: 'm' } },
    { period: '7d', minutes: 10080, expected: { value: 1, unit: 'h' } },
    { period: '30d', minutes: 43200, expected: { value: 6, unit: 'h' } },
  ])('returns $expected.value$expected.unit for $period ($minutes min)', ({ minutes, expected }) => {
    const result = getChartResolution(makeRange(minutes));
    expect(result).toEqual(expected);
  });

  test('returns 1d for very long ranges', () => {
    const result = getChartResolution(makeRange(365 * 24 * 60));
    expect(result).toEqual({ value: 1, unit: 'd' });
  });

  test('returns 1m for very short ranges', () => {
    const result = getChartResolution(makeRange(2));
    expect(result).toEqual({ value: 1, unit: 'm' });
  });
});

describe('applyResolutionToQuery', () => {
  test('replaces window pattern in expressions and groupBy', () => {
    const query: TelemetryQuery = {
      $type: 'json',
      query: {
        expressions: ["window(_time, 1, 'm') as time", 'count() as requests'],
        from: 'analytics',
        groupBy: ["window(_time, 1, 'm')"],
      },
    };

    applyResolutionToQuery(query, { value: 15, unit: 'm' });

    expect(query.query.expressions[0]).toBe("window(_time, 15, 'm') as time");
    expect(query.query.expressions[1]).toBe('count() as requests');
    expect(query.query.groupBy![0]).toBe("window(_time, 15, 'm')");
  });

  test('replaces hour-unit window patterns', () => {
    const query: TelemetryQuery = {
      $type: 'json',
      query: {
        expressions: ["window(_time, 1, 'h')", 'mcp_method', 'count()'],
        from: 'mcp_analytics',
        groupBy: ["window(_time, 1, 'h')", 'mcp_method'],
      },
    };

    applyResolutionToQuery(query, { value: 6, unit: 'h' });

    expect(query.query.expressions[0]).toBe("window(_time, 6, 'h')");
    expect(query.query.groupBy![0]).toBe("window(_time, 6, 'h')");
    expect(query.query.groupBy![1]).toBe('mcp_method');
  });

  test('is a no-op for queries without window()', () => {
    const query: TelemetryQuery = {
      $type: 'json',
      query: {
        expressions: ['count()'],
        from: 'analytics',
      },
    };

    const original = JSON.stringify(query);
    applyResolutionToQuery(query, { value: 5, unit: 'm' });
    expect(JSON.stringify(query)).toBe(original);
  });
});
