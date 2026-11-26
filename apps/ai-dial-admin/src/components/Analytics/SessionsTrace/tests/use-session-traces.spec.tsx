import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSessionTraces } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-traces';
import { SessionTraceGroup, SessionScope } from '@/src/models/analytics/sessions-trace';

const getSessionTracePage = vi.fn();

// Held at module scope so every render passes the same object. The hook keys its loader on `scope`, so a
// fresh literal per render would rebuild the loader, refire the reset effect and re-fetch without end.
const scope: SessionScope = { id: 'chat-1', source: 'chat_id' };

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getSessionTracePage: (...args: unknown[]) => getSessionTracePage(...args),
}));

const group = (traceId: string): SessionTraceGroup => ({
  traceId,
  startedAt: 1,
  spans: 2,
  tokens: 10,
  price: 0.001,
  failedSpans: 0,
  chips: [],
  responseIds: [],
  cards: [],
  elidedCardCount: 0,
  isRootRecorded: true,
});

const CURSOR = { firstRequestTime: 1500, traceId: 't2' };

const page = (ids: string[], hasMore = false) => ({
  success: true,
  response: { groups: ids.map(group), hasMore, cursor: hasMore ? CURSOR : null },
});

const renderTraces = (traceId?: string) =>
  renderHook(
    ({ searched }: { searched?: string }) =>
      useSessionTraces({
        scope,
        projectId: 'demo-project',
        firstRequestTime: 1000,
        lastRequestTime: 2000,
        traceId: searched,
      }),
    { initialProps: { searched: traceId } },
  );

beforeEach(() => {
  vi.clearAllMocks();
  getSessionTracePage.mockResolvedValue(page(['t1', 't2'], true));
});

describe('useSessionTraces', () => {
  test('loads the first page on mount and reports when it settles', async () => {
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2']);
    expect(getSessionTracePage).toHaveBeenCalledWith(scope, 'demo-project', 1000, 2000, null, undefined);
  });

  test('appends the next page, requested after the cursor the previous page returned', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getSessionTracePage.mockResolvedValue(page(['t3']));
    await act(async () => result.current.onLoadMore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2', 't3']);
    expect(getSessionTracePage).toHaveBeenLastCalledWith(scope, 'demo-project', 1000, 2000, CURSOR, undefined);
  });

  // A late-arriving row can lower a trace's earliest recorded time and move it past the cursor, so two pages
  // can return the same trace. Holding the loaded ids makes the duplicate impossible rather than unlikely.
  test('renders a trace once even when a later page returns it again', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getSessionTracePage.mockResolvedValue(page(['t2', 't3']));
    await act(async () => result.current.onLoadMore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2', 't3']);
  });

  test('carries the page’s own hasMore rather than inferring one', async () => {
    getSessionTracePage.mockResolvedValue(page(['t1'], true));
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  test('reports a failed read and stops asking for more', async () => {
    getSessionTracePage.mockResolvedValue({ success: false });
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  test('reports a rejected read the same way rather than throwing', async () => {
    getSessionTracePage.mockRejectedValue(new Error('hop log unavailable'));
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.groups).toEqual([]);
  });

  test('does not issue a second read while one is outstanding', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getSessionTracePage.mockClear();

    await act(async () => {
      result.current.onLoadMore();
      result.current.onLoadMore();
    });

    expect(getSessionTracePage).toHaveBeenCalledOnce();
  });

  test('passes the searched trace id and reports a search', async () => {
    getSessionTracePage.mockResolvedValue(page(['t7']));
    const { result } = renderTraces('t7');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSearch).toBe(true);
    expect(getSessionTracePage).toHaveBeenCalledWith(scope, 'demo-project', 1000, 2000, null, 't7');
  });

  test('restarts from the first page when the search changes', async () => {
    const { result, rerender } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getSessionTracePage.mockResolvedValue(page(['t7']));
    rerender({ searched: 't7' });
    await waitFor(() => expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t7']));

    expect(getSessionTracePage).toHaveBeenLastCalledWith(scope, 'demo-project', 1000, 2000, null, 't7');
  });

  test('restores the listing from the first page when the search is cleared', async () => {
    getSessionTracePage.mockResolvedValue(page(['t7']));
    const { result, rerender } = renderTraces('t7');
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getSessionTracePage.mockResolvedValue(page(['t1', 't2'], true));
    rerender({ searched: undefined });
    await waitFor(() => expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2']));

    expect(result.current.isSearch).toBe(false);
    expect(getSessionTracePage).toHaveBeenLastCalledWith(scope, 'demo-project', 1000, 2000, null, undefined);
  });

  test('drops a page that resolves after the search changed', async () => {
    let resolveStale: (value: unknown) => void = () => undefined;
    getSessionTracePage.mockReturnValueOnce(new Promise((resolve) => (resolveStale = resolve)));
    const { result, rerender } = renderTraces();

    getSessionTracePage.mockResolvedValue(page(['t7']));
    rerender({ searched: 't7' });
    await waitFor(() => expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t7']));

    await act(async () => resolveStale(page(['t1', 't2'], true)));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t7']);
  });
});
