import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import { useDashboardWidgetData } from '@/src/components/Analytics/CustomDashboards/Widget/use-dashboard-widget-data';
import { WidgetQuery, WidgetQueryKind } from '@/src/models/analytics/dashboard';
import { QueryExprType, QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { SavedQuery } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions', () => ({ executeQuery: vi.fn(), executeSqlQuery: vi.fn() }));

const RANGE = { startDate: new Date('2026-10-01T00:00:00Z'), endDate: new Date('2026-10-08T00:00:00Z') };
const PREVIOUS = { startDate: new Date('2026-09-24T00:00:00Z'), endDate: new Date('2026-10-01T00:00:00Z') };

// The shape `translate-sql` gives `SELECT client_type AS client, sum(price) AS spend ... GROUP BY client_type`.
const QUERY: StructuredQuery = {
  entity: 'dial_usage_log',
  mode: QueryMode.Aggregate,
  select: [{ expr: { type: QueryExprType.Field, name: 'client_type' }, as: 'client' }],
  group_by: ['client_type'],
};

const WIDGET_QUERY: WidgetQuery = {
  kind: WidgetQueryKind.Structured,
  savedQuery: { id: 'q1', name: 'Spend by client' } as SavedQuery,
  query: QUERY,
  fields: [],
};

describe('useDashboardWidgetData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(executeQuery).mockResolvedValue({ success: true, response: { rows: [{ client: 'chat', spend: 3 }] } });
  });

  test('reads an aliased group-by column as the dimension the rows carry', async () => {
    const { result } = renderHook(() =>
      useDashboardWidgetData({ widgetQuery: WIDGET_QUERY, rowLimit: 10, range: RANGE }),
    );

    await waitFor(() => expect(result.current.meta).not.toBeNull());
    expect(result.current.meta?.dimensionColumns).toEqual(['client']);
    expect(result.current.meta?.aggregateColumns).toEqual(['spend']);
  });

  test('runs the compared window beside the current one when asked for it', async () => {
    const { result } = renderHook(() =>
      useDashboardWidgetData({ widgetQuery: WIDGET_QUERY, rowLimit: 10, range: RANGE, previousRange: PREVIOUS }),
    );

    await waitFor(() => expect(result.current.previousResult).not.toBeNull());
    expect(executeQuery).toHaveBeenCalledTimes(2);
  });

  test.each([403, 404])('reads a run answered %i as refused to the viewer', async (status) => {
    vi.mocked(executeQuery).mockResolvedValue({ success: false, status });
    const { result } = renderHook(() =>
      useDashboardWidgetData({ widgetQuery: WIDGET_QUERY, rowLimit: 10, range: RANGE }),
    );

    await waitFor(() => expect(result.current.isDenied).toBe(true));
    expect(result.current.isLoading).toBe(false);
  });

  test('reads a run answered 500 as an ordinary failure, not a refusal', async () => {
    vi.mocked(executeQuery).mockResolvedValue({ success: false, status: 500 });
    const { result } = renderHook(() =>
      useDashboardWidgetData({ widgetQuery: WIDGET_QUERY, rowLimit: 10, range: RANGE }),
    );

    await waitFor(() => expect(result.current.hasFailed).toBe(true));
    expect(result.current.isDenied).toBe(false);
  });

  test('drops the answer of a run a later range change superseded', async () => {
    let answerStale: (value: Awaited<ReturnType<typeof executeQuery>>) => void = () => undefined;
    vi.mocked(executeQuery)
      .mockReturnValueOnce(new Promise((resolve) => (answerStale = resolve)))
      .mockResolvedValueOnce({ success: true, response: { rows: [{ client: 'fresh', spend: 1 }] } });
    const { result, rerender } = renderHook(
      ({ range }) => useDashboardWidgetData({ widgetQuery: WIDGET_QUERY, rowLimit: 10, range }),
      { initialProps: { range: PREVIOUS } },
    );

    rerender({ range: RANGE });
    await waitFor(() => expect(result.current.result?.rows).toEqual([{ client: 'fresh', spend: 1 }]));
    await act(async () => answerStale({ success: true, response: { rows: [{ client: 'stale', spend: 9 }] } }));

    expect(result.current.result?.rows).toEqual([{ client: 'fresh', spend: 1 }]);
  });

  test('drops the answer of a run whose query became unavailable meanwhile', async () => {
    let answerStale: (value: Awaited<ReturnType<typeof executeQuery>>) => void = () => undefined;
    vi.mocked(executeQuery).mockReturnValueOnce(new Promise((resolve) => (answerStale = resolve)));
    const unavailable: WidgetQuery = { kind: WidgetQueryKind.Unavailable };
    const { result, rerender } = renderHook(
      ({ widgetQuery }) => useDashboardWidgetData({ widgetQuery, rowLimit: 10, range: RANGE }),
      { initialProps: { widgetQuery: WIDGET_QUERY as WidgetQuery } },
    );

    rerender({ widgetQuery: unavailable });
    await act(async () => answerStale({ success: true, response: { rows: [{ client: 'stale', spend: 9 }] } }));

    expect(result.current.result).toBeNull();
    expect(result.current.isDenied).toBe(true);
  });
});
