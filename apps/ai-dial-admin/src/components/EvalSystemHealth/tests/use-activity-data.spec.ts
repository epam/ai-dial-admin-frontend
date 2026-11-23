import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { executeStructuredQueries } from '@/src/app/[lang]/runs/actions';
import { buildMonthCostWindows } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import { ActivityCardModel, ActivityKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useActivityData } from '@/src/components/EvalSystemHealth/use-activity-data';
import { buildActivityQueries } from '@/src/components/EvalSystemHealth/utils/build-activity-queries';

vi.mock('@/src/app/[lang]/runs/actions', () => ({ executeStructuredQueries: vi.fn() }));

const NOW = new Date(2026, 10, 18, 12, 0, 0);

const rowsOf = (count: number) => ({
  rows: Array.from({ length: count }, (_, index) => ({ test_suite_id: `s-${index}` })),
});

/** Results in the order the hook sends the queries: total, run current, run previous, added current, added previous. */
const BATCH = [
  { rows: [{ id: 'any' }], totalCount: 200 },
  rowsOf(50),
  rowsOf(30),
  { rows: [{ 'deployment_ref::id': 'a' }, { 'mcp_deployment_ref::id': 'b' }], totalCount: 47 },
  { rows: [{ id: 'any' }], totalCount: 38 },
];

const cardOf = (cards: ActivityCardModel[], kind: ActivityKind) =>
  cards.find((card) => card.kind === kind) as ActivityCardModel;

const isEveryCard = (cards: ActivityCardModel[], status: CoverageStatus) =>
  cards.every((card) => card.status === status);

describe('useActivityData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test('starts with both cards loading', () => {
    vi.mocked(executeStructuredQueries).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useActivityData());

    expect(isEveryCard(result.current.cards, CoverageStatus.Loading)).toBe(true);
  });

  test('returns both cards ready with their figures once the batch returns', async () => {
    vi.mocked(executeStructuredQueries).mockResolvedValue(BATCH);

    const { result } = renderHook(() => useActivityData());

    await waitFor(() => expect(isEveryCard(result.current.cards, CoverageStatus.Ready)).toBe(true));
    expect(cardOf(result.current.cards, ActivityKind.SuitesRun)).toMatchObject({
      value: 50,
      delta: 20,
      total: 200,
      rate: 0.25,
    });
    expect(cardOf(result.current.cards, ActivityKind.SuitesAdded)).toMatchObject({
      value: 47,
      delta: 9,
      evaluateeCount: 2,
    });
  });

  test('sends the five queries for the current and previous month spans as one batch', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.mocked(executeStructuredQueries).mockResolvedValue(BATCH);

    const { result } = renderHook(() => useActivityData());
    await waitFor(() => expect(isEveryCard(result.current.cards, CoverageStatus.Ready)).toBe(true));

    const queries = buildActivityQueries(buildMonthCostWindows(NOW));
    expect(executeStructuredQueries).toHaveBeenCalledOnce();
    expect(executeStructuredQueries).toHaveBeenCalledWith([
      queries.totalSuites,
      queries.suitesRunCurrent,
      queries.suitesRunPrevious,
      queries.suitesAddedCurrent,
      queries.suitesAddedPrevious,
    ]);
  });

  test('exposes the spans the cards count over', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.mocked(executeStructuredQueries).mockResolvedValue(BATCH);

    const { result } = renderHook(() => useActivityData());
    await waitFor(() => expect(isEveryCard(result.current.cards, CoverageStatus.Ready)).toBe(true));

    expect(result.current.windows).toEqual(buildMonthCostWindows(NOW));
  });

  test('errors only the card whose query came back null', async () => {
    vi.mocked(executeStructuredQueries).mockResolvedValue([BATCH[0], BATCH[1], BATCH[2], BATCH[3], null]);

    const { result } = renderHook(() => useActivityData());

    await waitFor(() =>
      expect(cardOf(result.current.cards, ActivityKind.SuitesAdded).status).toBe(CoverageStatus.Error),
    );
    expect(cardOf(result.current.cards, ActivityKind.SuitesRun).status).toBe(CoverageStatus.Ready);
  });

  test('errors both cards when the batch call is rejected instead of leaving them loading', async () => {
    vi.mocked(executeStructuredQueries).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useActivityData());

    await waitFor(() => expect(isEveryCard(result.current.cards, CoverageStatus.Error)).toBe(true));
  });

  test('loads again for the new periods when the day rolls over while the page is open', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 30, 23, 59, 0));
    vi.mocked(executeStructuredQueries).mockResolvedValue(BATCH);

    const { result } = renderHook(() => useActivityData());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(executeStructuredQueries).toHaveBeenCalledOnce();
    expect(isEveryCard(result.current.cards, CoverageStatus.Ready)).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });

    const december = buildActivityQueries(buildMonthCostWindows(new Date(2026, 11, 1)));
    expect(executeStructuredQueries).toHaveBeenCalledTimes(2);
    expect(executeStructuredQueries).toHaveBeenLastCalledWith([
      december.totalSuites,
      december.suitesRunCurrent,
      december.suitesRunPrevious,
      december.suitesAddedCurrent,
      december.suitesAddedPrevious,
    ]);
    expect(result.current.windows).toEqual(buildMonthCostWindows(new Date(2026, 11, 1)));
    expect(isEveryCard(result.current.cards, CoverageStatus.Ready)).toBe(true);
  });

  test('does not load again within the same day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 9, 0, 0));
    vi.mocked(executeStructuredQueries).mockResolvedValue(BATCH);

    renderHook(() => useActivityData());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    });

    expect(executeStructuredQueries).toHaveBeenCalledOnce();
  });
});
