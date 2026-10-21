import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ApplicationRoute } from '@/src/types/routes';
import { getModelNavigationName, resolveModelDeploymentRoute } from '@/src/utils/resolve-model-deployment-route';

const getModelMock = vi.fn();

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getModelMock(...args),
}));

describe('getModelNavigationName', () => {
  test('strips models/platform/ prefix', () => {
    expect(getModelNavigationName('models/platform/msh-responses')).toBe('msh-responses');
  });

  test('returns bare ids unchanged', () => {
    expect(getModelNavigationName('msh-responses')).toBe('msh-responses');
  });
});

describe('resolveModelDeploymentRoute', () => {
  beforeEach(() => {
    getModelMock.mockReset();
  });

  test('routes models/platform/ ids to PlatformModels without a lookup', async () => {
    await expect(resolveModelDeploymentRoute('models/platform/msh-responses')).resolves.toBe(
      ApplicationRoute.PlatformModels,
    );
    expect(getModelMock).not.toHaveBeenCalled();
  });

  test('routes to PlatformModels when the Catalog resource exists', async () => {
    getModelMock.mockResolvedValue({ response: { name: 'msh-responses' } });

    await expect(resolveModelDeploymentRoute('msh-responses')).resolves.toBe(ApplicationRoute.PlatformModels);
    expect(getModelMock).toHaveBeenCalledWith('msh-responses', DEFAULT_ETAG);
  });

  test('falls back to Entities Models when Catalog lookup misses', async () => {
    getModelMock.mockResolvedValue(null);

    await expect(resolveModelDeploymentRoute('legacy-model')).resolves.toBe(ApplicationRoute.Models);
  });
});
