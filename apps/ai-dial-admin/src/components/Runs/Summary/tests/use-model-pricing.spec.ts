import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { useModelPricing } from '../use-model-pricing';

const resolveModelPricingMock = vi.fn();

vi.mock('../resolve-model-pricing', () => ({
  resolveModelPricing: (...args: unknown[]) => resolveModelPricingMock(...args),
}));

describe('useModelPricing', () => {
  beforeEach(() => {
    resolveModelPricingMock.mockReset();
  });

  test('reports definitely-unpriced once the model is confirmed to have no prompt/completion rate', async () => {
    resolveModelPricingMock.mockResolvedValue({ isResolved: true, pricing: undefined });

    const { result } = renderHook(() => useModelPricing('gpt-unpriced', DeploymentType.Model));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current).toEqual({ isDefinitelyUnpriced: true, isLoading: false }));
    expect(resolveModelPricingMock).toHaveBeenCalledWith('gpt-unpriced');
  });

  test('stays not-unpriced when the model has a prompt or completion rate', async () => {
    resolveModelPricingMock.mockResolvedValue({ isResolved: true, pricing: { prompt: '0.001' } });

    const { result } = renderHook(() => useModelPricing('gpt-4', DeploymentType.Model));

    await waitFor(() => expect(result.current).toEqual({ isDefinitelyUnpriced: false, isLoading: false }));
  });

  test('stays not-unpriced when the model resource could not be resolved on either surface', async () => {
    resolveModelPricingMock.mockResolvedValue({ isResolved: false, pricing: undefined });

    const { result } = renderHook(() => useModelPricing('ghost-model', DeploymentType.Model));

    await waitFor(() => expect(result.current).toEqual({ isDefinitelyUnpriced: false, isLoading: false }));
  });

  test('does not fetch for an Application deployment', () => {
    const { result } = renderHook(() => useModelPricing('app-1', DeploymentType.Application));

    expect(result.current).toEqual({ isDefinitelyUnpriced: false, isLoading: false });
    expect(resolveModelPricingMock).not.toHaveBeenCalled();
  });

  test('does not fetch when the deployment id is missing', () => {
    const { result } = renderHook(() => useModelPricing(undefined, DeploymentType.Model));

    expect(result.current).toEqual({ isDefinitelyUnpriced: false, isLoading: false });
    expect(resolveModelPricingMock).not.toHaveBeenCalled();
  });

  test('does not fetch while the deployment type is not yet known', () => {
    const { result } = renderHook(() => useModelPricing('gpt-4', undefined));

    expect(result.current).toEqual({ isDefinitelyUnpriced: false, isLoading: false });
    expect(resolveModelPricingMock).not.toHaveBeenCalled();
  });
});
