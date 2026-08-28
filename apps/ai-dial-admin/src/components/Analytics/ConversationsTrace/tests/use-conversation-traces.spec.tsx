import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useConversationTraces } from '@/src/components/Analytics/ConversationsTrace/Detail/use-conversation-traces';
import { ConversationTraceGroup, SessionScope } from '@/src/models/analytics/conversations-trace';

const getConversationTracePage = vi.fn();

// Held at module scope so every render passes the same object. The hook keys its loader on `scope`, so a
// fresh literal per render would rebuild the loader, refire the reset effect and re-fetch without end.
const scope: SessionScope = { id: 'chat-1', source: 'chat_id' };

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationTracePage: (...args: unknown[]) => getConversationTracePage(...args),
}));

const group = (traceId: string): ConversationTraceGroup => ({
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

const page = (ids: string[], hasMore = false) => ({
  success: true,
  response: { groups: ids.map(group), hasMore },
});

const renderTraces = () =>
  renderHook(() =>
    useConversationTraces({
      scope,
      projectId: 'statgpt',
      firstRequestTime: 1000,
      lastRequestTime: 2000,
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  getConversationTracePage.mockResolvedValue(page(['t1', 't2'], true));
});

describe('useConversationTraces', () => {
  test('loads the first page on mount and reports when it settles', async () => {
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2']);
    expect(getConversationTracePage).toHaveBeenCalledWith(scope, 'statgpt', 1000, 2000, 0);
  });

  test('appends the next page and advances the offset by what the page returned', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getConversationTracePage.mockResolvedValue(page(['t3']));
    await act(async () => result.current.onLoadMore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2', 't3']);
    expect(getConversationTracePage).toHaveBeenLastCalledWith(scope, 'statgpt', 1000, 2000, 2);
  });

  // A late-arriving row can lower a trace's earliest recorded time and move it across a page boundary, which
  // offset paging exposes as a repeat. Holding the loaded ids makes the duplicate impossible rather than
  // unlikely — and the offset still advances by the page's full length, so nothing is skipped either.
  test('renders a trace once even when a later page returns it again', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getConversationTracePage.mockResolvedValue(page(['t2', 't3']));
    await act(async () => result.current.onLoadMore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2', 't3']);
    expect(getConversationTracePage).toHaveBeenLastCalledWith(scope, 'statgpt', 1000, 2000, 2);
  });

  test('carries the page’s own hasMore rather than inferring one', async () => {
    getConversationTracePage.mockResolvedValue(page(['t1'], true));
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  test('reports a failed read and stops asking for more', async () => {
    getConversationTracePage.mockResolvedValue({ success: false });
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  test('reports a rejected read the same way rather than throwing', async () => {
    getConversationTracePage.mockRejectedValue(new Error('hop log unavailable'));
    const { result } = renderTraces();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.groups).toEqual([]);
  });

  test('does not issue a second read while one is outstanding', async () => {
    const { result } = renderTraces();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getConversationTracePage.mockClear();

    await act(async () => {
      result.current.onLoadMore();
      result.current.onLoadMore();
    });

    expect(getConversationTracePage).toHaveBeenCalledOnce();
  });
});
