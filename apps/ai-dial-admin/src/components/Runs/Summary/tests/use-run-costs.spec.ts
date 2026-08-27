import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useRunCosts } from '../use-run-costs';

const getRunCostsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunCosts: (id: string) => getRunCostsMock(id),
}));

describe('useRunCosts', () => {
  beforeEach(() => {
    getRunCostsMock.mockReset();
  });

  test('returns costs on success', async () => {
    const payload = { avgTestCaseCost: 0.1, avgMetricEvalCost: 0.2 };
    getRunCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.costs).toEqual(payload);
    expect(result.current.unavailable).toBe(false);
  });

  test('marks unavailable when the action returns null', async () => {
    getRunCostsMock.mockResolvedValue(null);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('marks unavailable when the action throws', async () => {
    getRunCostsMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('clears state when runId is undefined', async () => {
    const { result } = renderHook(() => useRunCosts(undefined));

    expect(result.current.costs).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.unavailable).toBe(false);
    expect(getRunCostsMock).not.toHaveBeenCalled();
  });
});
