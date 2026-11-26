import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { getEvalPeriodCosts } from '@/src/app/[lang]/runs/actions';
import { CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useEvalCostData } from '@/src/components/EvalSystemHealth/use-eval-cost-data';
import { buildMonthCostWindows } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import { EvalPeriodCosts } from '@/src/models/evaluation/run';

vi.mock('@/src/app/[lang]/runs/actions', () => ({ getEvalPeriodCosts: vi.fn() }));

const WINDOWS = buildMonthCostWindows(new Date(2026, 10, 18, 12, 0, 0));
const NEXT_WINDOWS = buildMonthCostWindows(new Date(2026, 10, 19, 12, 0, 0));

const COSTS: EvalPeriodCosts = {
  current: { totalCost: 4218, testCaseCost: 2840, metricEvalCost: 1378 },
  previous: { totalCost: 3876 },
};

describe('useEvalCostData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('starts loading', () => {
    vi.mocked(getEvalPeriodCosts).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useEvalCostData(WINDOWS));

    expect(result.current.status).toBe(CoverageStatus.Loading);
  });

  test('requests both periods and returns the ready card', async () => {
    vi.mocked(getEvalPeriodCosts).mockResolvedValue(COSTS);

    const { result } = renderHook(() => useEvalCostData(WINDOWS));

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(getEvalPeriodCosts).toHaveBeenCalledWith(
      WINDOWS.current.fromMs,
      WINDOWS.current.toMs,
      WINDOWS.previous.fromMs,
      WINDOWS.previous.toMs,
    );
    expect(result.current).toMatchObject({
      total: 4218,
      evaluateesCost: 2840,
      judgesCost: 1378,
      deltaLabel: '+$342',
    });
  });

  test('reports an error when a period failed', async () => {
    vi.mocked(getEvalPeriodCosts).mockResolvedValue({ current: COSTS.current, previous: null });

    const { result } = renderHook(() => useEvalCostData(WINDOWS));

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));
  });

  test('reports an error when the action throws', async () => {
    vi.mocked(getEvalPeriodCosts).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useEvalCostData(WINDOWS));

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));
  });

  test('loads again for new windows and drops the superseded response', async () => {
    let resolveFirst: (value: EvalPeriodCosts) => void = () => undefined;
    vi.mocked(getEvalPeriodCosts)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({ current: { totalCost: 7 }, previous: { totalCost: 7 } });

    const { result, rerender } = renderHook(({ windows }) => useEvalCostData(windows), {
      initialProps: { windows: WINDOWS },
    });
    rerender({ windows: NEXT_WINDOWS });

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(getEvalPeriodCosts).toHaveBeenLastCalledWith(
      NEXT_WINDOWS.current.fromMs,
      NEXT_WINDOWS.current.toMs,
      NEXT_WINDOWS.previous.fromMs,
      NEXT_WINDOWS.previous.toMs,
    );

    await act(async () => resolveFirst(COSTS));
    expect(result.current.total).toBe(7);
  });

  test('does not load again for the same windows', async () => {
    vi.mocked(getEvalPeriodCosts).mockResolvedValue(COSTS);

    const { result, rerender } = renderHook(() => useEvalCostData(WINDOWS));
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    rerender();

    expect(getEvalPeriodCosts).toHaveBeenCalledTimes(1);
  });
});
