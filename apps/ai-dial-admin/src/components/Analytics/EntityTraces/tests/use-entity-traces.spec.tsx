import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useEntityTraces } from '@/src/components/Analytics/EntityTraces/use-entity-traces';
import { SessionTraceGroup } from '@/src/models/analytics/sessions-trace';
import { ApplicationRoute } from '@/src/types/routes';

const getEntityTracePage = vi.fn();

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getEntityTracePage: (...args: unknown[]) => getEntityTracePage(...args),
}));

// Held at module scope: the hook keys its loader on the range's instants, and a fresh range per render would
// re-read without end.
const RANGE = { startDate: new Date(1000), endDate: new Date(9000) };

const group = (traceId: string, coreSpanId = `${traceId}-call`): SessionTraceGroup => ({
  traceId,
  startedAt: 1,
  spans: 2,
  tokens: 10,
  price: 0.001,
  failedSpans: 0,
  chips: [],
  responseIds: [],
  cards: [{ traceId, coreSpanId } as SessionTraceGroup['cards'][number]],
  elidedCardCount: 0,
  isRootRecorded: true,
});

const page = (ids: string[], hasMore: boolean, cursor = { requestTime: 500, coreSpanId: 'last' }) => ({
  success: true,
  response: { groups: ids.map((id) => group(id)), hasMore, cursor },
});

const renderTraces = (refreshToken = 0) =>
  renderHook(
    ({ token }) =>
      useEntityTraces({
        route: ApplicationRoute.Models,
        entityName: 'a-model',
        timeRange: RANGE,
        refreshToken: token,
        isEnabled: true,
      }),
    { initialProps: { token: refreshToken } },
  );

beforeEach(() => {
  vi.clearAllMocks();
  getEntityTracePage.mockResolvedValue(page(['t1', 't2'], true));
});

describe('useEntityTraces', () => {
  test('reads nothing until it is enabled', async () => {
    const { result } = renderHook(() =>
      useEntityTraces({
        route: ApplicationRoute.Models,
        entityName: 'a-model',
        timeRange: RANGE,
        refreshToken: 0,
        isEnabled: false,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.groups).toEqual([]);
    expect(getEntityTracePage).not.toHaveBeenCalled();
  });

  test('reads the first page of the period with no cursor', async () => {
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2']);
    expect(getEntityTracePage).toHaveBeenCalledWith(ApplicationRoute.Models, 'a-model', 1000, 9000, null);
  });

  test('reads the next page after the last call shown', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getEntityTracePage.mockResolvedValueOnce(page(['t3'], false));

    await act(async () => result.current.onLoadMore());

    expect(getEntityTracePage).toHaveBeenLastCalledWith(ApplicationRoute.Models, 'a-model', 1000, 9000, {
      requestTime: 500,
      coreSpanId: 'last',
    });
    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2', 't3']);
    expect(result.current.hasMore).toBe(false);
  });

  test('re-reads from the newest call on Refresh', async () => {
    const { result, rerender } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getEntityTracePage.mockResolvedValueOnce(page(['t9'], false));

    rerender({ token: 1 });

    await waitFor(() => expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t9']));
    expect(getEntityTracePage).toHaveBeenLastCalledWith(ApplicationRoute.Models, 'a-model', 1000, 9000, null);
  });

  test('keeps the pages shown and stops paging when a further page fails', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getEntityTracePage.mockResolvedValueOnce({ success: false });

    await act(async () => result.current.onLoadMore());

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.groups).toHaveLength(2);
  });

  test('retries the failed page with the same cursor', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getEntityTracePage.mockResolvedValueOnce({ success: false });
    await act(async () => result.current.onLoadMore());
    getEntityTracePage.mockResolvedValueOnce(page(['t3'], false));

    await act(async () => result.current.onRetry());

    expect(getEntityTracePage).toHaveBeenLastCalledWith(ApplicationRoute.Models, 'a-model', 1000, 9000, {
      requestTime: 500,
      coreSpanId: 'last',
    });
    expect(result.current.hasLoadError).toBe(false);
    expect(result.current.groups).toHaveLength(3);
  });
});

describe('useEntityTraces — reads that do not settle cleanly', () => {
  const LATER = { startDate: new Date(2000), endDate: new Date(10000) };

  const renderWithRange = () =>
    renderHook(
      ({ timeRange }) =>
        useEntityTraces({
          route: ApplicationRoute.Models,
          entityName: 'a-model',
          timeRange,
          refreshToken: 0,
          isEnabled: true,
        }),
      { initialProps: { timeRange: RANGE } },
    );

  test('reports a refused page read as refused, not as a load failure to retry', async () => {
    getEntityTracePage.mockResolvedValueOnce({ success: false, status: 403 });
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isRefused).toBe(true);
  });

  test('does not report an ordinary failure as refused', async () => {
    getEntityTracePage.mockResolvedValueOnce({ success: false, status: 500 });
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.isRefused).toBe(false);
  });

  test('drops a page that answers after the period changed', async () => {
    let answerStale: (value: unknown) => void = () => {};
    getEntityTracePage.mockReturnValueOnce(new Promise((resolve) => (answerStale = resolve)));
    getEntityTracePage.mockResolvedValueOnce(page(['fresh'], false));
    const { result, rerender } = renderWithRange();

    rerender({ timeRange: LATER });
    await waitFor(() => expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['fresh']));

    await act(async () => answerStale(page(['stale'], true)));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['fresh']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
