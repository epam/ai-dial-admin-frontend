import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { resolveDeploymentType } from '../resolve-deployment-type';

const getDeploymentByIdMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentById: (...args: unknown[]) => getDeploymentByIdMock(...args),
}));

describe('resolveDeploymentType', () => {
  beforeEach(() => {
    getDeploymentByIdMock.mockReset();
  });

  test('returns $type from getDeploymentById', async () => {
    getDeploymentByIdMock.mockResolvedValue({
      $type: DeploymentType.Model,
      deploymentId: 'gpt-4',
    });

    await expect(resolveDeploymentType('gpt-4')).resolves.toBe(DeploymentType.Model);
    expect(getDeploymentByIdMock).toHaveBeenCalledTimes(1);
    expect(getDeploymentByIdMock).toHaveBeenCalledWith('gpt-4');
  });

  test('returns undefined when getDeploymentById returns null', async () => {
    getDeploymentByIdMock.mockResolvedValue(null);

    await expect(resolveDeploymentType('missing')).resolves.toBeUndefined();
    expect(getDeploymentByIdMock).toHaveBeenCalledTimes(1);
  });
});
