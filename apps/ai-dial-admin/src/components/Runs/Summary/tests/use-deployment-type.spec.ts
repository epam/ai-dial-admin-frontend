import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { useDeploymentType } from '../use-deployment-type';

const resolveDeploymentTypeMock = vi.fn();

vi.mock('../resolve-deployment-type', () => ({
  resolveDeploymentType: (...args: unknown[]) => resolveDeploymentTypeMock(...args),
}));

describe('useDeploymentType', () => {
  beforeEach(() => {
    resolveDeploymentTypeMock.mockReset();
  });

  test('uses stored type and skips resolveDeploymentType', () => {
    const { result } = renderHook(() => useDeploymentType({ id: 'gpt-4', type: DeploymentType.Model, name: 'GPT-4' }));

    expect(result.current).toEqual({ deploymentType: DeploymentType.Model, isLoading: false });
    expect(resolveDeploymentTypeMock).not.toHaveBeenCalled();
  });

  test('fetches once when type is missing', async () => {
    resolveDeploymentTypeMock.mockResolvedValue(DeploymentType.Application);

    const { result } = renderHook(() => useDeploymentType({ id: 'app-1', name: 'App' }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current).toEqual({
        deploymentType: DeploymentType.Application,
        isLoading: false,
      });
    });

    expect(resolveDeploymentTypeMock).toHaveBeenCalledTimes(1);
    expect(resolveDeploymentTypeMock).toHaveBeenCalledWith('app-1');
  });

  test('does not fetch when id is missing', () => {
    const { result } = renderHook(() => useDeploymentType({ name: 'App' }));

    expect(result.current).toEqual({ deploymentType: undefined, isLoading: false });
    expect(resolveDeploymentTypeMock).not.toHaveBeenCalled();
  });
});
