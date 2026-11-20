import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import { useQuerySparkline } from '@/src/components/Analytics/Common/use-query-sparkline';
import { SPARKLINE_BUCKET } from '@/src/components/Analytics/CustomDashboards/utils/sparkline';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';

vi.mock('@/src/app/[lang]/queries/actions', () => ({ executeQuery: vi.fn() }));

const QUERY: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Aggregate };
const RANGE = { startDate: new Date('2026-11-17T00:00:00Z'), endDate: new Date('2026-11-19T00:00:00Z') };

const renderSparkline = (overrides: Partial<Parameters<typeof useQuerySparkline>[0]> = {}) =>
  renderHook(() =>
    useQuerySparkline({
      query: QUERY,
      timeField: 'request_time',
      column: 'cost',
      range: RANGE,
      isEnabled: true,
      ...overrides,
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useQuerySparkline', () => {
  test('runs the query bucketed by time and returns the column per bucket', async () => {
    vi.mocked(executeQuery).mockResolvedValue({
      success: true,
      response: { rows: [{ cost: 1 }, { cost: 3 }] },
    } as never);
    const { result } = renderSparkline();

    await waitFor(() => expect(result.current).toEqual([1, 3]));
    expect(executeQuery).toHaveBeenCalledWith(expect.objectContaining({ group_by: [SPARKLINE_BUCKET] }));
  });

  test.each([
    ['is disabled', { isEnabled: false }],
    ['has no query', { query: null }],
    ['has no time field', { timeField: null }],
    ['already groups its rows', { query: { ...QUERY, group_by: ['deployment'] } }],
  ])('draws no line and runs nothing when it %s', (_case, overrides) => {
    const { result } = renderSparkline(overrides);

    expect(result.current).toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  test('draws no line when the run fails', async () => {
    vi.mocked(executeQuery).mockRejectedValue(new Error('down'));
    const { result } = renderSparkline();

    await act(async () => {});

    expect(result.current).toEqual([]);
    expect(executeQuery).toHaveBeenCalledOnce();
  });
});
