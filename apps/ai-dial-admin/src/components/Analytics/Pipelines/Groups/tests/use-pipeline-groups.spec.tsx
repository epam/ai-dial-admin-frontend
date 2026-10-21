import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { groupMock } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';
import { usePipelineGroups } from '@/src/components/Analytics/Pipelines/Groups/use-pipeline-groups';
import { GROUPS_PAGE_SIZE } from '@/src/constants/analytics/pipeline-groups';
import { GroupListOrder, PipelineGroup } from '@/src/models/analytics/pipeline-groups';

const { getPipelineGroups } = vi.hoisted(() => ({ getPipelineGroups: vi.fn() }));

vi.mock('@/src/app/[lang]/pipelines/actions', () => ({ getPipelineGroups }));

const page = (keys: string[], nextCursor: string | null, total = 5) => ({
  success: true,
  response: {
    groups: keys.map((key): PipelineGroup => groupMock({ group_key: key })),
    next_cursor: nextCursor,
    has_more: nextCursor != null,
    total,
  },
});

const keysOf = (groups: PipelineGroup[]) => groups.map((group) => group.group_key);

const renderWalk = async () => {
  const hook = renderHook(() => usePipelineGroups('retrieval-quality'));
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
};

describe('usePipelineGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads the first page newest first, with the runner total', async () => {
    getPipelineGroups.mockResolvedValueOnce(page(['a', 'b'], 'c2', 37));

    const { result } = await renderWalk();

    expect(getPipelineGroups).toHaveBeenCalledWith('retrieval-quality', GROUPS_PAGE_SIZE, GroupListOrder.Newest);
    expect(keysOf(result.current.groups)).toEqual(['a', 'b']);
    expect(result.current).toMatchObject({ total: 37, hasMore: true, order: GroupListOrder.Newest });
  });

  test('appends the next page from the cursor', async () => {
    getPipelineGroups.mockResolvedValueOnce(page(['a', 'b'], 'c2')).mockResolvedValueOnce(page(['c'], null));

    const { result } = await renderWalk();
    await act(() => result.current.loadMore());

    expect(getPipelineGroups).toHaveBeenLastCalledWith(
      'retrieval-quality',
      GROUPS_PAGE_SIZE,
      GroupListOrder.Newest,
      'c2',
    );
    expect(keysOf(result.current.groups)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
  });

  test('asks for nothing more once the last page is in', async () => {
    getPipelineGroups.mockResolvedValueOnce(page(['a'], null));

    const { result } = await renderWalk();
    await act(() => result.current.loadMore());

    expect(getPipelineGroups).toHaveBeenCalledOnce();
  });

  test('restarts the walk from the first page when the order changes', async () => {
    getPipelineGroups.mockResolvedValueOnce(page(['a', 'b'], 'c2')).mockResolvedValueOnce(page(['z'], null));

    const { result } = await renderWalk();
    act(() => result.current.setOrder(GroupListOrder.Oldest));

    await waitFor(() => expect(keysOf(result.current.groups)).toEqual(['z']));
    expect(getPipelineGroups).toHaveBeenLastCalledWith('retrieval-quality', GROUPS_PAGE_SIZE, GroupListOrder.Oldest);
    expect(result.current.order).toBe(GroupListOrder.Oldest);
  });

  test('drops a page asked for before the order changed', async () => {
    let answerStale: (value: unknown) => void = () => {};
    getPipelineGroups
      .mockResolvedValueOnce(page(['a'], 'c2'))
      .mockImplementationOnce(() => new Promise((resolve) => (answerStale = resolve)))
      .mockResolvedValueOnce(page(['z'], null));

    const { result } = await renderWalk();
    let stale: Promise<void> = Promise.resolve();
    act(() => {
      stale = result.current.loadMore();
    });
    act(() => result.current.setOrder(GroupListOrder.Oldest));
    await waitFor(() => expect(keysOf(result.current.groups)).toEqual(['z']));

    await act(async () => {
      answerStale(page(['stale'], null));
      await stale;
    });

    expect(keysOf(result.current.groups)).toEqual(['z']);
  });

  test('restarts from the first page when the runner refuses the cursor', async () => {
    getPipelineGroups
      .mockResolvedValueOnce(page(['a'], 'c2'))
      .mockResolvedValueOnce({ success: false, status: 400, errorHeader: 'invalid_cursor' })
      .mockResolvedValueOnce(page(['fresh'], null));

    const { result } = await renderWalk();
    await act(() => result.current.loadMore());

    await waitFor(() => expect(keysOf(result.current.groups)).toEqual(['fresh']));
    expect(result.current.hasFailed).toBe(false);
  });

  test('ends the walk when a next page fails, rather than asking again on every scroll', async () => {
    getPipelineGroups
      .mockResolvedValueOnce(page(['a'], 'c2'))
      .mockResolvedValueOnce({ success: false, status: 503, errorMessage: 'down' });

    const { result } = await renderWalk();
    await act(() => result.current.loadMore());

    expect(result.current.hasMore).toBe(false);
    expect(keysOf(result.current.groups)).toEqual(['a']);
  });

  test('asks for a page once when two scrolls arrive before it answers', async () => {
    let answer: (value: unknown) => void = () => {};
    getPipelineGroups
      .mockResolvedValueOnce(page(['a'], 'c2'))
      .mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));

    const { result } = await renderWalk();
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.loadMore();
      void result.current.loadMore();
    });
    await act(async () => {
      answer(page(['b'], null));
      await first;
    });

    expect(getPipelineGroups).toHaveBeenCalledTimes(2);
    expect(keysOf(result.current.groups)).toEqual(['a', 'b']);
  });

  test('reports a failed first page', async () => {
    getPipelineGroups.mockResolvedValueOnce({ success: false, status: 503, errorMessage: 'down' });

    const { result } = await renderWalk();

    expect(result.current).toMatchObject({ hasFailed: true, errorMessage: 'down' });
  });
});
